/**
 * Initialize workflow functionality
 */

import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { getWorkflowStatus, getCurrentStage } from '../shared/documentStatus.js';
import { calculateWorkflowProgress } from '../shared/progressCalculator.js';
import { createRequirementsDocument } from './createRequirementsDoc.js';
import { updateStageConfirmation } from '../shared/confirmationStatus.js';
import { responseBuilder } from '../shared/responseBuilder.js';
import { WorkflowResult } from '../shared/mcpTypes.js';

export interface InitOptions {
  path: string;
  featureName: string;
  introduction: string;
  onProgress?: (progress: number, total: number, message: string) => Promise<void>;
}

export async function initWorkflow(options: InitOptions): Promise<WorkflowResult> {
  const { path, featureName, introduction, onProgress } = options;
  
  try {
    await reportProgress(onProgress, 0, 100, 'Starting initialization...');
    
    // Create directory
    if (!existsSync(path)) {
      mkdirSync(path, { recursive: true });
    }
    
    await reportProgress(onProgress, 50, 100, 'Checking project status...');
    
    // Comprehensively check if project already exists
    const requirementsPath = join(path, 'requirements.md');
    const designPath = join(path, 'design.md');
    const tasksPath = join(path, 'tasks.md');
    const confirmationsPath = join(path, '.workflow-confirmations.json');
    
    // If any workflow-related files exist, consider the project already exists
    const projectExists = existsSync(requirementsPath) || 
                         existsSync(designPath) || 
                         existsSync(tasksPath) || 
                         existsSync(confirmationsPath);
    
    if (projectExists) {
      await reportProgress(onProgress, 100, 100, 'Found existing project');
      
      const status = getWorkflowStatus(path);
      const currentStage = getCurrentStage(status, path);
      const progress = calculateWorkflowProgress(path, status);
      
      const enhancedStatus = {
        ...status,
        design: { ...status.design, exists: existsSync(designPath) },
        tasks: { ...status.tasks, exists: existsSync(tasksPath) }
      };
      
      // Build detailed existing reason
      const existingFiles = [];
      if (existsSync(requirementsPath)) existingFiles.push('Requirements document');
      if (existsSync(designPath)) existingFiles.push('Design document');
      if (existsSync(tasksPath)) existingFiles.push('Task list');
      if (existsSync(confirmationsPath)) existingFiles.push('Workflow status');
      
      // Use responseBuilder to build error response
      return {
        displayText: responseBuilder.buildErrorResponse('alreadyInitialized', { 
          path,
          existingFiles: existingFiles.join(', ')
        }),
        data: {
          success: false,
          error: 'PROJECT_ALREADY_EXISTS',
          existingFiles: existingFiles,
          currentStage: currentStage,
          progress: progress
        }
      };
    }
    
    // Generate requirements document
    const result = createRequirementsDocument(path, featureName, introduction);
    
    if (!result.generated) {
      return {
        displayText: responseBuilder.buildErrorResponse('invalidPath', { path }),
        data: {
          success: false,
          error: 'Failed to create requirements document',
          details: result
        }
      };
    }
    
    // Initialize status file, mark requirements stage as unconfirmed
    updateStageConfirmation(path, 'requirements', false);
    updateStageConfirmation(path, 'design', false);
    updateStageConfirmation(path, 'tasks', false);
    
    await reportProgress(onProgress, 100, 100, 'Initialization completed!');
    
    // Use responseBuilder to build success response
    return responseBuilder.buildInitResponse(path, featureName);
    
  } catch (error) {
    return {
      displayText: responseBuilder.buildErrorResponse('invalidPath', { 
        path,
        error: String(error) 
      }),
      data: {
        success: false,
        error: `Initialization failed: ${error}`
      }
    };
  }
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