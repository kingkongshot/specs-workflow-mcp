/**
 * Task guidance template extractor
 * Reads task completion guidance text templates from OpenAPI specification
 */

import { openApiLoader, OpenApiLoader } from './openApiLoader.js';

export class TaskGuidanceExtractor {
  private static _template: ReturnType<typeof openApiLoader.getTaskGuidanceTemplate> | undefined;
  
  private static get template() {
    if (!this._template) {
      // Lazy loading to ensure OpenAPI spec is loaded
      openApiLoader.loadSpec();
      this._template = openApiLoader.getTaskGuidanceTemplate();
    }
    return this._template;
  }
  
  /**
   * Build task guidance text
   * Read templates from OpenAPI spec and assemble them
   */
  static buildGuidanceText(
    nextTaskContent: string,
    firstSubtask: string,
    taskNumber?: string,
    isFirstTask: boolean = false
  ): string {
    const template = this.template;
    if (!template) {
      throw new Error('Failed to load task guidance template from OpenAPI specification');
    }
    
    const parts: string[] = [];
    
    // Add separator line
    parts.push(template.separator);
    parts.push('');
    
    // Add task header
    parts.push(template.header);
    parts.push(nextTaskContent);
    parts.push('');
    
    // Add model instructions
    parts.push(template.instructions.prefix);
    const taskFocusText = OpenApiLoader.replaceVariables(template.instructions.taskFocus, { firstSubtask });
    parts.push(taskFocusText);
    
    parts.push('');
    parts.push(template.instructions.progressTracking);
    parts.push(template.instructions.workflow);
    parts.push('');
    
    // Add model prompt based on scenario
    let prompt: string;
    if (isFirstTask) {
      prompt = template.prompts.firstTask;
    } else if (taskNumber) {
      // Determine if it's a new task or continuation
      if (taskNumber.includes('.')) {
        // Subtask, use continuation prompt
        prompt = OpenApiLoader.replaceVariables(template.prompts.continueTask, { taskNumber });
      } else {
        // Main task, use new task prompt
        prompt = OpenApiLoader.replaceVariables(template.prompts.nextTask, { taskNumber });
      }
    } else {
      // Batch completion scenario, no specific task number
      prompt = template.prompts.batchContinue;
    }
    
    parts.push(prompt);
    
    return parts.join('\n');
  }
  
  /**
   * Extract the first uncompleted subtask with its context
   */
  static extractFirstSubtask(taskContent: string): string {
    const taskLines = taskContent.split('\n');
    let firstSubtask = '';
    let foundTaskNumber = '';
    
    for (const line of taskLines) {
      // More flexible pattern: find checkbox first, then check for subtask number
      const checkboxMatch = line.match(/\[([xX ])\]/);
      if (!checkboxMatch) continue;
      
      // Skip completed tasks
      if (checkboxMatch[1].toLowerCase() === 'x') continue;
      
      // Check if this is a subtask (has dot in number)
      const numberMatch = line.match(/(\d+(?:\.\d+)*)/);
      if (!numberMatch || !numberMatch[1].includes('.')) continue;
      
      // Found an uncompleted subtask
      foundTaskNumber = numberMatch[1];
      firstSubtask = line.trim();
      
      // Determine the depth level of the found task (number of dots)
      const foundTaskDepth = foundTaskNumber.split('.').length;
      
      // Get context from the next few lines
      const lineIndex = taskLines.indexOf(line);
      for (let i = lineIndex + 1; i < taskLines.length; i++) {
        const nextLine = taskLines[i];
        const trimmedLine = nextLine.trim();
        
        // Skip empty lines
        if (trimmedLine === '') {
          continue;
        }
        
        // Check if we hit another task
        const nextCheckbox = nextLine.match(/\[([xX ])\]/);
        if (nextCheckbox) {
          const nextNumberMatch = nextLine.match(/(\d+(?:\.\d+)*)/);
          if (nextNumberMatch) {
            const nextTaskNumber = nextNumberMatch[1];
            const nextTaskDepth = nextTaskNumber.split('.').length;
            
            // If the next task is a child of our found task, include it
            if (nextTaskNumber.startsWith(foundTaskNumber + '.')) {
              firstSubtask += '\n      ' + trimmedLine;
              continue;
            } else {
              // Otherwise, we've hit a sibling or parent task, stop here
              break;
            }
          }
        }
        
        // Include task details (bullet points, references, etc.)
        if (trimmedLine.startsWith('-') || 
            trimmedLine.includes('*Goal*') || 
            trimmedLine.includes('*Details*') || 
            trimmedLine.includes('*Requirements*') ||
            trimmedLine.includes('**Reference**')) {
          firstSubtask += '\n      ' + trimmedLine;
        } else if (nextLine.match(/^#{1,3}\s/)) {
          // Stop if we hit a heading
          break;
        }
      }
      break;
    }
    
    return firstSubtask;
  }
  
  /**
   * Get completion message
   */
  static getCompletionMessage(type: 'taskCompleted' | 'allCompleted' | 'alreadyCompleted' | 'batchSucceeded' | 'batchCompleted', taskNumber?: string): string {
    const template = this.template;
    if (!template) {
      throw new Error('Failed to load task guidance template from OpenAPI specification');
    }
    
    const message = template.completionMessages[type];
    if (taskNumber && message.includes('${taskNumber}')) {
      return OpenApiLoader.replaceVariables(message, { taskNumber });
    }
    return message;
  }
}