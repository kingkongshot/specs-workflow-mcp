/**
 * Skip current stage
 */

import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { getWorkflowStatus, getCurrentStage, getNextStage, getStageName, getStageFileName } from '../shared/documentStatus.js';
import { getSkippedTemplate, getDesignTemplate, getTasksTemplate } from '../shared/documentTemplates.js';
import { updateStageConfirmation, updateStageSkipped } from '../shared/confirmationStatus.js';
import { responseBuilder } from '../shared/responseBuilder.js';
import { WorkflowResult } from '../shared/mcpTypes.js';
import { extractDocumentInfo } from '../shared/documentUtils.js';
import { calculateWorkflowProgress } from '../shared/progressCalculator.js';

export interface SkipOptions {
  path: string;
}

export async function skipStage(options: SkipOptions): Promise<WorkflowResult> {
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
  
  if (currentStage === 'completed') {
    return {
      displayText: '✅ All stages completed, no need to skip',
      data: {
        success: false,
        reason: 'All stages completed'
      }
    };
  }
  
  // Get document information
  const documentInfo = extractDocumentInfo(join(path, 'requirements.md'));
  
  // Create document for skipped stage
  createSkippedDocument(path, currentStage, documentInfo.featureName);
  
  // Mark current stage as skipped
  updateStageSkipped(path, currentStage, true);
  // For tasks stage, don't mark as confirmed when skipping
  // since it's essential for development
  if (currentStage !== 'tasks') {
    updateStageConfirmation(path, currentStage, true);
  }
  
  // Generate next document (if needed)
  const nextStage = getNextStage(currentStage);
  
  if (nextStage !== 'completed') {
    createNextStageDocument(path, nextStage, documentInfo.featureName);
    // Initialize next stage confirmation status as unconfirmed
    updateStageConfirmation(path, nextStage, false);
  }
  
  // Calculate progress after skip
  const updatedStatus = getWorkflowStatus(path);
  const progress = calculateWorkflowProgress(path, updatedStatus);
  
  return responseBuilder.buildSkipResponse(currentStage, path, progress);
}


interface DocumentResult {
  created: boolean;
  fileName: string;
  message: string;
}

function createSkippedDocument(
  path: string,
  stage: string,
  featureName: string
): DocumentResult {
  const fileName = getStageFileName(stage);
  const filePath = join(path, fileName);
  
  // If document already exists, don't overwrite
  if (existsSync(filePath)) {
    return {
      created: false,
      fileName,
      message: `${fileName} already exists, keeping original content`
    };
  }
  
  const content = getSkippedTemplate(getStageName(stage), featureName);
  
  try {
    writeFileSync(filePath, content, 'utf-8');
    return {
      created: true,
      fileName,
      message: `Created skip marker document: ${fileName}`
    };
  } catch (error) {
    return {
      created: false,
      fileName,
      message: `Failed to create skip document: ${error}`
    };
  }
}

function createNextStageDocument(
  path: string,
  stage: string,
  featureName: string
): DocumentResult | null {
  const fileName = getStageFileName(stage);
  const filePath = join(path, fileName);
  
  if (existsSync(filePath)) {
    return {
      created: false,
      fileName,
      message: `${fileName} already exists`
    };
  }
  
  let content: string;
  switch (stage) {
    case 'design':
      content = getDesignTemplate(featureName);
      break;
    case 'tasks':
      content = getTasksTemplate(featureName);
      break;
    default:
      return null;
  }
  
  try {
    writeFileSync(filePath, content, 'utf-8');
    return {
      created: true,
      fileName,
      message: `Created next stage document: ${fileName}`
    };
  } catch (error) {
    return {
      created: false,
      fileName,
      message: `Failed to create document: ${error}`
    };
  }
}