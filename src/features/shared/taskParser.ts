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
  const lines = content.split('\n');
  const allTasks: Task[] = [];
  
  // Phase 1: Collect all tasks with checkboxes
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Find checkbox pattern
    const checkboxMatch = line.match(/\[([xX ])\]/);
    if (!checkboxMatch) continue;
    
    // Extract task number (flexible matching)
    const numberMatch = line.match(/(\d+(?:\.\d+)*)/);
    if (!numberMatch) continue;
    
    const taskNumber = numberMatch[1];
    const isChecked = checkboxMatch[1].toLowerCase() === 'x';
    
    // Extract description (remove task number and checkbox)
    let description = line
      .replace(/\[([xX ])\]/, '')  // Remove checkbox
      .replace(/(\d+(?:\.\d+)*)\s*[.:\-)]?/, '') // Remove task number
      .replace(/^[\s\-*]+/, '')  // Remove leading symbols
      .trim();
    
    // If description is empty, try to get from next line
    if (!description && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      if (nextLine && !nextLine.match(/\[([xX ])\]/) && !nextLine.match(/^#/)) {
        description = nextLine;
        i++; // Skip next line
      }
    }
    
    if (!description) continue;
    
    allTasks.push({
      number: taskNumber,
      description: description,
      checked: isChecked
    });
  }
  
  // Phase 2: Build hierarchy structure
  const taskMap = new Map<string, Task>();
  const rootTasks: Task[] = [];
  
  // Infer main tasks from task numbers
  for (const task of allTasks) {
    if (!task.number.includes('.')) {
      // Top-level task
      taskMap.set(task.number, task);
      rootTasks.push(task);
    }
  }
  
  // Process subtasks
  for (const task of allTasks) {
    if (task.number.includes('.')) {
      const parts = task.number.split('.');
      const parentNumber = parts[0];
      
      // If main task doesn't exist, create virtual parent task
      if (!taskMap.has(parentNumber)) {
        // Try to find better title from document
        const betterTitle = findMainTaskTitle(lines, parentNumber);
        const virtualParent: Task = {
          number: parentNumber,
          description: betterTitle || `Task Group ${parentNumber}`,
          checked: false,
          subtasks: []
        };
        taskMap.set(parentNumber, virtualParent);
        rootTasks.push(virtualParent);
      }
      
      // Add subtask to main task
      const parent = taskMap.get(parentNumber)!;
      if (!parent.subtasks) {
        parent.subtasks = [];
      }
      parent.subtasks.push(task);
    }
  }
  
  // Update main task completion status (only when all subtasks are completed)
  for (const task of rootTasks) {
    if (task.subtasks && task.subtasks.length > 0) {
      task.checked = task.subtasks.every(st => st.checked);
    }
  }
  
  // Sort by task number
  rootTasks.sort((a, b) => {
    const numA = parseInt(a.number);
    const numB = parseInt(b.number);
    return numA - numB;
  });
  
  // Sort subtasks
  for (const task of rootTasks) {
    if (task.subtasks) {
      task.subtasks.sort((a, b) => {
        const partsA = a.number.split('.').map(n => parseInt(n));
        const partsB = b.number.split('.').map(n => parseInt(n));
        for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
          const diff = (partsA[i] || 0) - (partsB[i] || 0);
          if (diff !== 0) return diff;
        }
        return 0;
      });
    }
  }
  
  return rootTasks;
}

// Find main task title (from headers or other places)
function findMainTaskTitle(lines: string[], taskNumber: string): string | null {
  // Look for lines like "### 1. Title" or "## 1. Title"
  for (const line of lines) {
    const headerMatch = line.match(/^#+\s*(\d+)\.\s*(.+)$/);
    if (headerMatch && headerMatch[1] === taskNumber) {
      return headerMatch[2].trim();
    }
  }
  
  // Also support other formats like "1. **Title**"
  for (const line of lines) {
    const boldMatch = line.match(/^(\d+)\.\s*\*\*(.+?)\*\*$/);
    if (boldMatch && boldMatch[1] === taskNumber) {
      return boldMatch[2].trim();
    }
  }
  
  return null;
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