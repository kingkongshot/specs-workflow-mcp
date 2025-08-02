/**
 * Confirm stage completion
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { getWorkflowStatus, getStageName, getNextStage, getCurrentStage, getStageFileName } from '../shared/documentStatus.js';
import { updateStageConfirmation, isStageSkipped } from '../shared/confirmationStatus.js';
import { generateNextDocument } from '../check/generateNextDocument.js';
import { responseBuilder } from '../shared/responseBuilder.js';
import { WorkflowResult } from '../shared/mcpTypes.js';
import { parseTasksFile, getFirstUncompletedTask, formatTaskForFullDisplay } from '../shared/taskParser.js';
import { isDocumentEdited } from '../shared/documentAnalyzer.js';
import { calculateWorkflowProgress } from '../shared/progressCalculator.js';

export interface ConfirmOptions {
  path: string;
}

export async function confirmStage(options: ConfirmOptions): Promise<WorkflowResult> {
  const { path } = options;
  
  if (!existsSync(path)) {
    return {
      displayText: responseBuilder.buildErrorResponse('invalidPath', { path }),
      data: {
        success: false,
        error: 'Directory does not exist'
      }
    };
  }
  
  const status = getWorkflowStatus(path);
  const currentStage = getCurrentStage(status, path);
  
  // Check if all stages are completed
  if (currentStage === 'completed') {
    return {
      displayText: `✅ All stages completed!

Workflow completed, no need to confirm again.`,
      data: {
        success: false,
        reason: 'All stages completed'
      }
    };
  }
  
  const stageData = status[currentStage as keyof typeof status];
  
  // Check if document exists
  if (!stageData || !stageData.exists) {
    return {
      displayText: `⚠️ ${getStageName(currentStage)} does not exist

Please create ${getStageName(currentStage)} document before confirming.`,
      data: {
        success: false,
        reason: `${getStageName(currentStage)} does not exist`
      }
    };
  }
  
  // Check if already skipped
  if (isStageSkipped(path, currentStage)) {
    return {
      displayText: `⚠️ ${getStageName(currentStage)} already skipped

This stage has been skipped, no need to confirm.`,
      data: {
        success: false,
        reason: `${getStageName(currentStage)} already skipped`
      }
    };
  }
  
  // Check if document has been edited
  const fileName = getStageFileName(currentStage);
  const filePath = join(path, fileName);
  if (!isDocumentEdited(filePath)) {
    return {
      displayText: responseBuilder.buildErrorResponse('documentNotEdited', { 
        documentName: getStageName(currentStage)
      }),
      data: {
        success: false,
        error: 'Document not edited'
      }
    };
  }
  
  // Update confirmation status
  updateStageConfirmation(path, currentStage, true);
  
  // Get next stage
  const nextStage = getNextStage(currentStage);
  
  // Generate document for next stage
  if (nextStage !== 'completed') {
    await generateNextDocument(path, currentStage);
  }
  
  // If tasks stage, get first task details
  let firstTaskContent = null;
  if (currentStage === 'tasks' && nextStage === 'completed') {
    const tasks = parseTasksFile(path);
    const firstTask = getFirstUncompletedTask(tasks);
    if (firstTask) {
      const tasksPath = join(path, 'tasks.md');
      const content = readFileSync(tasksPath, 'utf-8');
      firstTaskContent = formatTaskForFullDisplay(firstTask, content);
    }
  }
  
  // Calculate progress after confirmation
  const updatedStatus = getWorkflowStatus(path);
  const progress = calculateWorkflowProgress(path, updatedStatus);
  
  return responseBuilder.buildConfirmResponse(currentStage, nextStage === 'completed' ? null : nextStage, path, firstTaskContent, progress);
}