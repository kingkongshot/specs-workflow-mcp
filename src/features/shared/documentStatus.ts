/**
 * Document status management related functions
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { isStageSkipped, isStageConfirmed } from './confirmationStatus.js';

export interface DocumentStatus {
  exists: boolean;
}

export interface WorkflowStatus {
  requirements: DocumentStatus;
  design: DocumentStatus;
  tasks: DocumentStatus;
}

export type WorkflowStage = 'requirements' | 'design' | 'tasks' | 'completed';

export function getWorkflowStatus(path: string): WorkflowStatus {
  return {
    requirements: getDocumentStatus(path, 'requirements.md'),
    design: getDocumentStatus(path, 'design.md'),
    tasks: getDocumentStatus(path, 'tasks.md')
  };
}

function getDocumentStatus(path: string, fileName: string): DocumentStatus {
  const filePath = join(path, fileName);
  return { exists: existsSync(filePath) };
}


export function getCurrentStage(status: WorkflowStatus, path?: string): WorkflowStage {
  if (!path) {
    // Backward compatibility: if no path, return the first existing document stage
    if (status.requirements.exists) return 'requirements';
    if (status.design.exists) return 'design';
    if (status.tasks.exists) return 'tasks';
    return 'completed';
  }
  
  // Determine current stage based on confirmations
  // If requirements stage is not confirmed and not skipped, current stage is requirements
  if (!isStageConfirmed(path, 'requirements') && !isStageSkipped(path, 'requirements')) {
    return 'requirements';
  }
  
  // If design stage is not confirmed and not skipped, current stage is design
  if (!isStageConfirmed(path, 'design') && !isStageSkipped(path, 'design')) {
    return 'design';
  }
  
  // If tasks stage is not confirmed and not skipped, current stage is tasks
  if (!isStageConfirmed(path, 'tasks') && !isStageSkipped(path, 'tasks')) {
    return 'tasks';
  }
  
  return 'completed';
}

export function getNextStage(stage: WorkflowStage): WorkflowStage {
  const stages: WorkflowStage[] = ['requirements', 'design', 'tasks', 'completed'];
  const index = stages.indexOf(stage);
  return stages[Math.min(index + 1, stages.length - 1)];
}

export function getStageName(stage: string): string {
  const names: Record<string, string> = {
    requirements: 'Requirements Document',
    design: 'Design Document',
    tasks: 'Task List',
    completed: 'Completed'
  };
  return names[stage] || stage;
}

export function getStageFileName(stage: string): string {
  const fileNames: Record<string, string> = {
    requirements: 'requirements.md',
    design: 'design.md',
    tasks: 'tasks.md'
  };
  return fileNames[stage] || '';
}