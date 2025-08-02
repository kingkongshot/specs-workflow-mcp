/**
 * Check workflow status
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { getWorkflowStatus, getCurrentStage } from '../shared/documentStatus.js';
import { calculateWorkflowProgress } from '../shared/progressCalculator.js';
import { analyzeStage } from './analyzeStage.js';
import { generateNextDocument } from './generateNextDocument.js';
import { responseBuilder } from '../shared/responseBuilder.js';
import { WorkflowResult } from '../shared/mcpTypes.js';
import { parseTasksFile, getFirstUncompletedTask, formatTaskForFullDisplay } from '../shared/taskParser.js';

export interface CheckOptions {
  path: string;
  onProgress?: (progress: number, total: number, message: string) => Promise<void>;
}

export async function checkWorkflow(options: CheckOptions): Promise<WorkflowResult> {
  const { path, onProgress } = options;
  
  if (!existsSync(path)) {
    return {
      displayText: responseBuilder.buildErrorResponse('invalidPath', { path }),
      data: {
        success: false,
        error: 'Directory does not exist'
      }
    };
  }
  
  await reportProgress(onProgress, 33, 100, 'Checking document status...');
  
  const status = getWorkflowStatus(path);
  
  // Check if all files do not exist
  if (!status.requirements.exists && !status.design.exists && !status.tasks.exists) {
    await reportProgress(onProgress, 100, 100, 'Check completed');
    return {
      displayText: responseBuilder.buildErrorResponse('invalidPath', { 
        path,
        error: 'Project not initialized' 
      }),
      data: {
        success: false,
        error: 'Project not initialized'
      }
    };
  }
  
  const currentStage = getCurrentStage(status, path);
  // const stageStatus = getStageStatus(currentStage, status, path); // 未使用
  
  await reportProgress(onProgress, 66, 100, 'Analyzing document content...');
  
  // Analyze current stage
  const analysis = analyzeStage(path, currentStage, status);
  
  // Check if need to generate next document
  if (analysis.canProceed) {
    await generateNextDocument(path, currentStage);
  }
  
  await reportProgress(onProgress, 100, 100, 'Check completed');
  
  const progress = calculateWorkflowProgress(path, status);
  
  // Determine status type
  let statusType: string;
  let reason: string | undefined;
  
  if (currentStage === 'completed') {
    statusType = 'completed';
  } else if (!status[currentStage].exists) {
    statusType = 'not_edited';
    reason = `${currentStage === 'requirements' ? 'Requirements' : currentStage === 'design' ? 'Design' : 'Tasks'} document does not exist`;
  } else if (analysis.canProceed) {
    statusType = 'ready_to_confirm';
  } else if (analysis.needsConfirmation) {
    statusType = 'ready_to_confirm';
  } else {
    statusType = 'not_edited';
    reason = analysis.reason;
  }
  
  // If workflow is completed, get the first uncompleted task
  let firstTask = null;
  if (currentStage === 'completed') {
    const tasks = parseTasksFile(path);
    const task = getFirstUncompletedTask(tasks);
    if (task) {
      const tasksPath = join(path, 'tasks.md');
      const content = readFileSync(tasksPath, 'utf-8');
      firstTask = formatTaskForFullDisplay(task, content);
    }
  }
  
  return responseBuilder.buildCheckResponse(
    currentStage,
    progress,
    { 
      type: statusType, 
      reason,
      readyToConfirm: analysis.canProceed 
    },
    analysis,
    path,
    firstTask
  );
}

async function reportProgress(
  onProgress: ((progress: number, total: number, message: string) => Promise<void>) | undefined,
  progress: number,
  total: number,
  message: string
): Promise<void> {
  if (onProgress) {
    await onProgress(progress, total, message);
  }
}