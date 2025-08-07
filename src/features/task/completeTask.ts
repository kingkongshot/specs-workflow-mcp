/**
 * Complete task
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { parseTasksFromContent, getFirstUncompletedTask, formatTaskForFullDisplay, Task } from '../shared/taskParser.js';
import { responseBuilder } from '../shared/responseBuilder.js';
import { WorkflowResult } from '../shared/mcpTypes.js';
import { BatchCompleteTaskResponse, CompleteTaskResponse } from '../shared/openApiTypes.js';
import { TaskGuidanceExtractor } from '../shared/taskGuidanceTemplate.js';

export interface CompleteTaskOptions {
  path: string;
  taskNumber: string | string[];
}

export async function completeTask(options: CompleteTaskOptions): Promise<WorkflowResult> {
  const { path, taskNumber } = options;
  
  // Normalize input: convert to array for unified processing
  const taskNumbers = Array.isArray(taskNumber) ? taskNumber : [taskNumber];
  
  if (!existsSync(path)) {
    return {
      displayText: responseBuilder.buildErrorResponse('invalidPath', { path }),
      data: {
        success: false,
        error: 'Directory does not exist'
      }
    };
  }
  
  const tasksPath = join(path, 'tasks.md');
  if (!existsSync(tasksPath)) {
    return {
      displayText: '❌ Error: tasks.md file does not exist\n\nPlease complete writing the tasks document first.',
      data: {
        success: false,
        error: 'tasks.md does not exist'
      }
    };
  }
  
  // Batch processing logic
  if (taskNumbers.length > 1) {
    const batchResult = await completeBatchTasks(path, tasksPath, taskNumbers);
    return {
      displayText: batchResult.displayText,
      data: { ...batchResult }
    };
  } else {
    const singleResult = await completeSingleTask(path, tasksPath, taskNumbers[0]);
    return {
      displayText: singleResult.displayText,
      data: { ...singleResult }
    };
  }
}

/**
 * Complete a single task
 */
async function completeSingleTask(path: string, tasksPath: string, taskNumber: string): Promise<CompleteTaskResponse> {
  // Read tasks file
  const content = readFileSync(tasksPath, 'utf-8');
  
  // Check if task exists
  const tasksInContent = parseTasksFromContent(content);
  const targetTask = findTaskByNumber(tasksInContent, taskNumber);
  
  if (!targetTask) {
    throw new Error(responseBuilder.buildErrorResponse('taskNotFound', { taskNumber }));
  }
  
  // If task is already completed, return success (idempotency)
  if (targetTask.checked) {
    const allTasks = parseTasksFromContent(content);
    const nextTask = getFirstUncompletedTask(allTasks);
    
    let displayText = TaskGuidanceExtractor.getCompletionMessage('alreadyCompleted', taskNumber);
    
    if (nextTask) {
      const nextTaskFullContent = formatTaskForFullDisplay(nextTask, content);
      
      // Extract first uncompleted subtask for focused planning
      const firstSubtask = TaskGuidanceExtractor.extractFirstSubtask(nextTaskFullContent);
      
      // Build guidance text using the template
      const guidanceText = TaskGuidanceExtractor.buildGuidanceText(
        nextTaskFullContent,
        firstSubtask,
        nextTask.number,
        false // not first task, continuing
      );
      
      displayText += '\n\n' + guidanceText;
    } else {
      displayText += '\n\n' + TaskGuidanceExtractor.getCompletionMessage('allCompleted');
    }
    
    const result: CompleteTaskResponse = {
      taskCompleted: taskNumber,
      displayText: displayText,
      hasNextTask: nextTask !== null,
      nextTask: nextTask ? {
        number: nextTask.number,
        description: nextTask.description
      } : undefined
    };
    return result;
  }
  
  // First check if task can be marked as completed
  const checkResult = checkTaskCanBeCompleted(content, taskNumber);
  if (!checkResult.canComplete) {
    throw new Error(checkResult.errorMessage!);
  }
  
  // Mark task as completed
  const updatedContent = markTaskAsCompleted(content, taskNumber);
  
  if (!updatedContent) {
    throw new Error(responseBuilder.buildErrorResponse('taskNotFound', { taskNumber }));
  }
  
  // Save updated file
  writeFileSync(tasksPath, updatedContent, 'utf-8');
  
  // Parse updated task list from the updated content (not from file)
  // This ensures we get the correct state after auto-completing parent tasks
  const tasks = parseTasksFromContent(updatedContent);
  const nextTask = getFirstUncompletedTask(tasks);
  
  // If completing a subtask, return complete information of the main task
  let taskToDisplay = nextTask;
  let nextTaskFullContent = null;
  
  if (taskNumber.includes('.')) {
    // Get main task number
    const mainTaskNumber = taskNumber.split('.')[0];
    // Find main task from updated content
    const mainTask = findTaskByNumber(tasks, mainTaskNumber);
    if (mainTask && !mainTask.checked) {
      // If main task is not completed, show it as the next task
      taskToDisplay = mainTask;
    }
  }
  
  if (taskToDisplay) {
    nextTaskFullContent = formatTaskForFullDisplay(taskToDisplay, updatedContent);
  }
  
  const response = responseBuilder.buildCompleteTaskResponse(taskNumber, taskToDisplay, nextTaskFullContent, null);
  const result: CompleteTaskResponse = {
    taskCompleted: taskNumber,
    displayText: response.displayText
  };
  if (response.data && 'hasNextTask' in response.data && response.data.hasNextTask) {
    result.hasNextTask = true;
    if ('nextTask' in response.data && response.data.nextTask) {
      result.nextTask = response.data.nextTask as { number: string; description: string };
    }
  } else {
    result.hasNextTask = false;
  }
  return result;
}

/**
 * Complete multiple tasks in batch
 */
async function completeBatchTasks(path: string, tasksPath: string, taskNumbers: string[]): Promise<BatchCompleteTaskResponse> {
  // Read tasks file
  const originalContent = readFileSync(tasksPath, 'utf-8');
  const tasks = parseTasksFromContent(originalContent);
  
  // Categorize tasks: already completed, can be completed, cannot be completed
  const alreadyCompleted: string[] = [];
  const canBeCompleted: string[] = [];
  const cannotBeCompleted: Array<{
    taskNumber: string;
    reason: string;
  }> = [];
  
  for (const taskNum of taskNumbers) {
    const targetTask = findTaskByNumber(tasks, taskNum);
    
    if (!targetTask) {
      cannotBeCompleted.push({
        taskNumber: taskNum,
        reason: 'Task does not exist'
      });
    } else if (targetTask.checked) {
      alreadyCompleted.push(taskNum);
    } else if (targetTask.subtasks && targetTask.subtasks.some(s => !s.checked)) {
      cannotBeCompleted.push({
        taskNumber: taskNum,
        reason: 'Has uncompleted subtasks'
      });
    } else {
      canBeCompleted.push(taskNum);
    }
  }
  
  // If there are tasks that cannot be completed (excluding already completed), return error
  if (cannotBeCompleted.length > 0) {
    const errorMessages = cannotBeCompleted
      .map(v => `- ${v.taskNumber}: ${v.reason}`)
      .join('\n');
    
    return {
      success: false,
      completedTasks: [],
      alreadyCompleted: [],
      failedTasks: cannotBeCompleted,
      displayText: `❌ Batch task completion failed\n\nThe following tasks cannot be completed:\n${errorMessages}\n\nPlease resolve these issues and try again.`
    };
  }
  
  // If no tasks can be completed but there are already completed tasks, still return success
  if (canBeCompleted.length === 0 && alreadyCompleted.length > 0) {
    const allTasks = parseTasksFromContent(originalContent);
    const nextTask = getFirstUncompletedTask(allTasks);
    
    const alreadyCompletedText = alreadyCompleted
      .map(t => `- ${t} (already completed)`)
      .join('\n');
    
    const displayText = `${TaskGuidanceExtractor.getCompletionMessage('batchCompleted')}\n\nThe following tasks were already completed:\n${alreadyCompletedText}\n\n${nextTask ? `Next task: ${nextTask.number}. ${nextTask.description}` : TaskGuidanceExtractor.getCompletionMessage('allCompleted')}`;
    
    return {
      success: true,
      completedTasks: [],
      alreadyCompleted,
      nextTask: nextTask ? {
        number: nextTask.number,
        description: nextTask.description
      } : undefined,
      hasNextTask: nextTask !== null,
      displayText
    };
  }
  
  // Execution phase: complete tasks in dependency order
  let currentContent = originalContent;
  const actuallyCompleted: string[] = [];
  const results: Array<{
    taskNumber: string;
    success: boolean;
    status: 'completed' | 'already_completed' | 'failed';
  }> = [];
  
  try {
    // Sort by task number, ensure parent tasks are processed after subtasks (avoid dependency conflicts)
    const sortedTaskNumbers = [...canBeCompleted].sort((a, b) => {
      // Subtasks first (numbers with more dots have priority)
      const aDepth = a.split('.').length;
      const bDepth = b.split('.').length;
      if (aDepth !== bDepth) {
        return bDepth - aDepth; // Process deeper levels first
      }
      return a.localeCompare(b); // Same depth, sort by string
    });
    
    for (const taskNum of sortedTaskNumbers) {
      const updatedContent = markTaskAsCompleted(currentContent, taskNum);
      
      if (!updatedContent) {
        // This should not happen as we have already validated
        throw new Error(`Unexpected error: Task ${taskNum} could not be marked`);
      }
      
      currentContent = updatedContent;
      actuallyCompleted.push(taskNum);
      results.push({
        taskNumber: taskNum,
        success: true,
        status: 'completed' as const
      });
    }
    
    // Add results for already completed tasks
    for (const taskNum of alreadyCompleted) {
      results.push({
        taskNumber: taskNum,
        success: true,
        status: 'already_completed' as const
      });
    }
    
    // All tasks completed successfully, save file
    if (actuallyCompleted.length > 0) {
      writeFileSync(tasksPath, currentContent, 'utf-8');
    }
    
    // Build success response
    const allTasks = parseTasksFromContent(currentContent);
    const nextTask = getFirstUncompletedTask(allTasks);
    
    // Build detailed completion information
    let completedInfo = '';
    if (actuallyCompleted.length > 0) {
      completedInfo += 'Newly completed tasks:\n' + actuallyCompleted.map(t => `- ${t}`).join('\n');
    }
    if (alreadyCompleted.length > 0) {
      if (completedInfo) completedInfo += '\n\n';
      completedInfo += 'Already completed tasks:\n' + alreadyCompleted.map(t => `- ${t} (already completed)`).join('\n');
    }
    
    let displayText = `${TaskGuidanceExtractor.getCompletionMessage('batchSucceeded')}\n\n${completedInfo}`;
    
    // Add enhanced guidance for next task
    if (nextTask) {
      const nextTaskFullContent = formatTaskForFullDisplay(nextTask, currentContent);
      
      // Extract first uncompleted subtask for focused planning
      const firstSubtask = TaskGuidanceExtractor.extractFirstSubtask(nextTaskFullContent);
      
      // Build guidance text using the template
      const guidanceText = TaskGuidanceExtractor.buildGuidanceText(
        nextTaskFullContent,
        firstSubtask,
        undefined, // no specific task number for batch
        false // not first task
      );
      
      displayText += '\n\n' + guidanceText;
    } else {
      displayText += '\n\n' + TaskGuidanceExtractor.getCompletionMessage('allCompleted');
    }
    
    return {
      success: true,
      completedTasks: actuallyCompleted,
      alreadyCompleted,
      failedTasks: [],
      results,
      nextTask: nextTask ? {
        number: nextTask.number,
        description: nextTask.description
      } : undefined,
      hasNextTask: nextTask !== null,
      displayText
    };
    
  } catch (error) {
    // Execution failed, need to rollback to original state
    if (actuallyCompleted.length > 0) {
      writeFileSync(tasksPath, originalContent, 'utf-8');
    }
    
    return {
      success: false,
      completedTasks: [],
      alreadyCompleted: [],
      failedTasks: [{
        taskNumber: 'batch',
        reason: error instanceof Error ? error.message : String(error)
      }],
      results,
      displayText: `❌ Batch task execution failed\n\nError: ${error instanceof Error ? error.message : String(error)}\n\nRolled back to original state.`
    };
  }
}

/**
 * Check if task can be marked as completed
 */
function checkTaskCanBeCompleted(content: string, taskNumber: string): {
  canComplete: boolean;
  errorMessage?: string;
  errorReason?: string;
} {
  const tasks = parseTasksFromContent(content);
  const targetTask = findTaskByNumber(tasks, taskNumber);
  
  if (!targetTask) {
    return {
      canComplete: false,
      errorMessage: responseBuilder.buildErrorResponse('taskNotFound', { taskNumber }),
      errorReason: 'Task does not exist'
    };
  }
  
  // Note: Already completed check is now handled before calling this function
  // No longer checking targetTask.checked here
  
  // Check if there are uncompleted subtasks
  if (targetTask.subtasks && targetTask.subtasks.some(s => !s.checked)) {
    const uncompletedSubtasks = targetTask.subtasks
      .filter(s => !s.checked)
      .map(s => `${s.number}. ${s.description}`)
      .join('\n  - ');
    
    return {
      canComplete: false,
      errorMessage: `❌ Error: Task ${taskNumber} has uncompleted subtasks\n\nPlease complete the following subtasks first:\n  - ${uncompletedSubtasks}`,
      errorReason: 'Has uncompleted subtasks'
    };
  }
  
  return { canComplete: true };
}

/**
 * Mark task as completed
 */
function markTaskAsCompleted(content: string, taskNumber: string): string | null {
  const lines = content.split('\n');
  const tasks = parseTasksFromContent(content);
  let found = false;
  
  // Find target task (including subtasks)
  const targetTask = findTaskByNumber(tasks, taskNumber);
  if (!targetTask) {
    return null;
  }
  
  // Build set of task numbers to mark
  const numbersToMark = new Set<string>();
  numbersToMark.add(taskNumber);
  
  // If it's a leaf task, check if parent task should be auto-marked
  const parentNumber = taskNumber.substring(0, taskNumber.lastIndexOf('.'));
  if (parentNumber && taskNumber.includes('.')) {
    const parentTask = findTaskByNumber(tasks, parentNumber);
    if (parentTask && parentTask.subtasks) {
      // Check if all sibling tasks are completed
      const allSiblingsCompleted = parentTask.subtasks
        .filter(s => s.number !== taskNumber)
        .every(s => s.checked);
      
      if (allSiblingsCompleted) {
        numbersToMark.add(parentNumber);
      }
    }
  }
  
  // Mark all related tasks
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip already completed tasks
    if (!line.includes('[ ]')) continue;
    
    // Check if line contains task number to mark
    for (const num of numbersToMark) {
      // More robust matching strategy: as long as the line contains both task number and checkbox
      // Don't care about their relative position and format details
      if (containsTaskNumber(line, num)) {
        lines[i] = line.replace('[ ]', '[x]');
        found = true;
        break;
      }
    }
  }
  
  return found ? lines.join('\n') : null;
}

/**
 * Check if line contains specified task number
 * Use flexible matching strategy, ignore format details
 */
function containsTaskNumber(line: string, taskNumber: string): boolean {
  // Remove checkbox part to avoid interference with matching
  const lineWithoutCheckbox = line.replace(/\[[xX ]\]/g, '');
  
  // Use word boundary to ensure matching complete task number
  // For example: won't mistakenly match "11.1" as "1.1"
  const escapedNumber = escapeRegExp(taskNumber);
  const regex = new RegExp(`\\b${escapedNumber}\\b`);
  
  return regex.test(lineWithoutCheckbox);
}

/**
 * Escape regex special characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Recursively find task (including subtasks)
 */
function findTaskByNumber(tasks: Task[], targetNumber: string): Task | null {
  for (const task of tasks) {
    if (task.number === targetNumber) {
      return task;
    }
    
    // Recursively search subtasks
    if (task.subtasks) {
      const found = findTaskByNumber(task.subtasks, targetNumber);
      if (found) {
        return found;
      }
    }
  }
  
  return null;
}