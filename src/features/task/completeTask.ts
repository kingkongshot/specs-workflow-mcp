/**
 * Complete task
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { parseTasksFile, parseTasksFromContent, getFirstUncompletedTask, formatTaskForFullDisplay, Task } from '../shared/taskParser.js';
import { responseBuilder } from '../shared/responseBuilder.js';
import { WorkflowResult } from '../shared/mcpTypes.js';

export interface CompleteTaskOptions {
  path: string;
  taskNumber: string;
}

export async function completeTask(options: CompleteTaskOptions): Promise<WorkflowResult> {
  const { path, taskNumber } = options;
  
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
  
  // Read tasks file
  const content = readFileSync(tasksPath, 'utf-8');
  
  // First check if task can be marked as completed
  const checkResult = checkTaskCanBeCompleted(content, taskNumber);
  if (!checkResult.canComplete) {
    return {
      displayText: checkResult.errorMessage!,
      data: {
        success: false,
        error: checkResult.errorReason
      }
    };
  }
  
  // Mark task as completed
  const updatedContent = markTaskAsCompleted(content, taskNumber);
  
  if (!updatedContent) {
    return {
      displayText: responseBuilder.buildErrorResponse('taskNotFound', { taskNumber }),
      data: {
        success: false,
        error: `Task ${taskNumber} does not exist`
      }
    };
  }
  
  // Save updated file
  writeFileSync(tasksPath, updatedContent, 'utf-8');
  
  // Parse updated task list to find next task
  const tasks = parseTasksFile(path);
  const nextTask = getFirstUncompletedTask(tasks);
  
  // If completing a subtask, return complete information of the main task
  let taskToDisplay = nextTask;
  let nextTaskFullContent = null;
  
  if (taskNumber.includes('.')) {
    // Get main task number
    const mainTaskNumber = taskNumber.split('.')[0];
    // Find main task
    const mainTask = findTaskByNumber(tasks, mainTaskNumber);
    if (mainTask) {
      taskToDisplay = mainTask;
    }
  }
  
  if (taskToDisplay) {
    nextTaskFullContent = formatTaskForFullDisplay(taskToDisplay, updatedContent);
  }
  
  return responseBuilder.buildCompleteTaskResponse(taskNumber, taskToDisplay, nextTaskFullContent, null);
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
  
  // Check if task is already completed
  if (targetTask.checked) {
    return {
      canComplete: false,
      errorMessage: responseBuilder.buildErrorResponse('taskAlreadyCompleted', { taskNumber }),
      errorReason: 'Already completed'
    };
  }
  
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