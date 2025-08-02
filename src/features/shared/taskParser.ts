/**
 * Parse tasks from tasks.md file
 */

import { readFileSync } from 'fs';
import { join } from 'path';

export interface Task {
  number: string;
  description: string;
  checked: boolean;
  subtasks?: Task[];
}

export function parseTasksFile(path: string): Task[] {
  try {
    const tasksPath = join(path, 'tasks.md');
    const content = readFileSync(tasksPath, 'utf-8');
    
    // Remove template marker blocks
    const cleanContent = content
      .replace(/<!--\s*SPEC-MARKER[\s\S]*?-->/g, '') // Compatible with old format
      .replace(/<template-tasks>[\s\S]*?<\/template-tasks>/g, '') // Match actual task template markers
      .trim();
    
    if (!cleanContent) {
      return [];
    }
    
    return parseTasksFromContent(cleanContent);
  } catch {
    return [];
  }
}

export function parseTasksFromContent(content: string): Task[] {
  const tasks: Task[] = [];
  const lines = content.split('\n');
  
  let currentTask: Task | null = null;
  let currentSubtasks: Task[] = [];
  let autoNumber = 1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines
    if (!line.trim()) continue;
    
    // Core pattern: find lines containing [ ] or [x]
    const checkboxMatch = line.match(/\[([xX ])\]/);
    if (!checkboxMatch) continue;
    
    // Extract checkbox status
    const isChecked = checkboxMatch[1].toLowerCase() === 'x';
    
    // Find task number (optional)
    const numberMatch = line.match(/(\d+(?:\.\d+)*)\s*[.:\-)]?/);
    const taskNumber = numberMatch ? numberMatch[1] : String(autoNumber++);
    
    // Extract task description: all content after checkbox
    const checkboxIndex = line.indexOf(checkboxMatch[0]);
    const afterCheckbox = line.substring(checkboxIndex + checkboxMatch[0].length).trim();
    
    // If there's a number after checkbox, remove it
    let description = afterCheckbox;
    if (numberMatch && afterCheckbox.startsWith(numberMatch[0])) {
      description = afterCheckbox.substring(numberMatch[0].length).trim();
    }
    
    // If description is empty, try to get from next line
    if (!description && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      if (nextLine && !nextLine.match(/\[([xX ])\]/)) {
        description = nextLine;
        i++; // Skip next line
      }
    }
    
    // If still no description, skip this task
    if (!description) continue;
    
    // Check if this is a subtask
    const isSubtask = taskNumber.includes('.');
    
    if (!isSubtask) {
      // Save previous task
      if (currentTask) {
        if (currentSubtasks.length > 0) {
          currentTask.subtasks = currentSubtasks;
        }
        tasks.push(currentTask);
      }
      
      // Create new top-level task
      currentTask = {
        number: taskNumber,
        description: description,
        checked: isChecked
      };
      currentSubtasks = [];
    } else if (currentTask) {
      // Add subtask
      currentSubtasks.push({
        number: taskNumber,
        description: description,
        checked: isChecked
      });
    }
  }
  
  // Save the last task
  if (currentTask) {
    if (currentSubtasks.length > 0) {
      currentTask.subtasks = currentSubtasks;
    }
    tasks.push(currentTask);
  }
  
  return tasks;
}

export function getFirstUncompletedTask(tasks: Task[]): Task | null {
  for (const task of tasks) {
    if (!task.checked) {
      return task;
    }
    
    // Check subtasks
    if (task.subtasks) {
      for (const subtask of task.subtasks) {
        if (!subtask.checked) {
          return subtask;
        }
      }
    }
  }
  
  return null;
}

export function formatTaskForDisplay(task: Task): string {
  let display = `📋 Task ${task.number}: ${task.description}`;
  
  if (task.subtasks && task.subtasks.length > 0) {
    display += '\n\nSubtasks:';
    for (const subtask of task.subtasks) {
      const status = subtask.checked ? '✓' : '☐';
      display += `\n  ${status} ${subtask.number}. ${subtask.description}`;
    }
  }
  
  return display;
}

export function formatTaskForFullDisplay(task: Task, content: string): string {
  const lines = content.split('\n');
  const taskLines: string[] = [];
  let capturing = false;
  let indent = '';
  
  for (const line of lines) {
    // Find task start (supports two formats: `1. - [ ] task` or `- [ ] 1. task`)
    const taskPattern1 = new RegExp(`^(\\s*)${task.number}\\.\\s*-\\s*\\[[ x]\\]\\s*`);
    const taskPattern2 = new RegExp(`^(\\s*)-\\s*\\[[ x]\\]\\s*${task.number}\\.\\s*`);
    if (line.match(taskPattern1) || line.match(taskPattern2)) {
      capturing = true;
      taskLines.push(line);
      indent = line.match(/^(\s*)/)?.[1] || '';
      continue;
    }
    
    // If capturing task content
    if (capturing) {
      // Check if reached next task at same or higher level
      const nextTaskPattern = /^(\s*)-\s*\[[ x]\]\s*\d+(\.\d+)*\.\s*/;
      const nextMatch = line.match(nextTaskPattern);
      if (nextMatch) {
        const nextIndent = nextMatch[1] || '';
        if (nextIndent.length <= indent.length) {
          break; // Found same or higher level task, stop capturing
        }
      }
      
      // Continue capturing content belonging to current task
      if (line.trim() === '') {
        taskLines.push(line);
      } else if (line.startsWith(indent + '  ') || line.startsWith(indent + '\t')) {
        // Deeper indented content belongs to current task
        taskLines.push(line);
      } else if (line.match(/^#+\s/)) {
        // Found header, stop capturing
        break;
      } else if (line.match(/^\d+\.\s*-\s*\[[ x]\]/)) {
        // Found other top-level task, stop
        break;
      } else {
        // Other cases continue capturing (might be continuation of task description)
        const isTaskLine = line.match(/^(\s*)-\s*\[[ x]\]/) || line.match(/^(\s*)\d+(\.\d+)*\.\s*-\s*\[[ x]\]/);
        if (isTaskLine) {
          break; // Found other task, stop
        } else if (line.match(/^\s/) && !line.match(/^\s{8,}/)) {
          // If indented but not too deep, might still be current task content
          taskLines.push(line);
        } else {
          break; // Otherwise stop
        }
      }
    }
  }
  
  return taskLines.join('\n').trimEnd();
}

// Format task list overview for display
export function formatTaskListOverview(path: string): string {
  try {
    const tasks = parseTasksFile(path);
    if (tasks.length === 0) {
      return 'No tasks found.';
    }
    
    const taskItems = tasks.map(task => {
      const status = task.checked ? '[x]' : '[ ]';
      return `- ${status} ${task.number}. ${task.description}`;
    });
    
    return taskItems.join('\n');
  } catch (error) {
    return 'Error loading tasks list.';
  }
}