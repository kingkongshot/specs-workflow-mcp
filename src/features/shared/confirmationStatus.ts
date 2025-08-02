/**
 * Confirmation status management
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface ConfirmationStatus {
  requirements: boolean;
  design: boolean;
  tasks: boolean;
}

export interface SkipStatus {
  requirements: boolean;
  design: boolean;
  tasks: boolean;
}

export interface WorkflowConfirmations {
  confirmed: ConfirmationStatus;
  skipped: SkipStatus;
}

const CONFIRMATION_FILE = '.workflow-confirmations.json';

export function getWorkflowConfirmations(path: string): WorkflowConfirmations {
  const filePath = join(path, CONFIRMATION_FILE);
  
  const defaultStatus: WorkflowConfirmations = {
    confirmed: {
      requirements: false,
      design: false,
      tasks: false
    },
    skipped: {
      requirements: false,
      design: false,
      tasks: false
    }
  };
  
  if (!existsSync(filePath)) {
    return defaultStatus;
  }
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    
    // Compatible with old format
    if (!parsed.confirmed && !parsed.skipped) {
      return {
        confirmed: parsed,
        skipped: {
          requirements: false,
          design: false,
          tasks: false
        }
      };
    }
    
    return parsed;
  } catch {
    return defaultStatus;
  }
}

// Keep old function for compatibility with existing code
export function getConfirmationStatus(path: string): ConfirmationStatus {
  const confirmations = getWorkflowConfirmations(path);
  return confirmations.confirmed;
}

export function updateStageConfirmation(
  path: string, 
  stage: keyof ConfirmationStatus, 
  confirmed: boolean
): void {
  const confirmations = getWorkflowConfirmations(path);
  confirmations.confirmed[stage] = confirmed;
  
  const filePath = join(path, CONFIRMATION_FILE);
  writeFileSync(filePath, JSON.stringify(confirmations, null, 2));
}

export function updateStageSkipped(
  path: string, 
  stage: keyof SkipStatus, 
  skipped: boolean
): void {
  const confirmations = getWorkflowConfirmations(path);
  confirmations.skipped[stage] = skipped;
  
  const filePath = join(path, CONFIRMATION_FILE);
  writeFileSync(filePath, JSON.stringify(confirmations, null, 2));
}

export function isStageConfirmed(
  path: string, 
  stage: keyof ConfirmationStatus
): boolean {
  const confirmations = getWorkflowConfirmations(path);
  return confirmations.confirmed[stage];
}

export function isStageSkipped(
  path: string, 
  stage: keyof SkipStatus
): boolean {
  const confirmations = getWorkflowConfirmations(path);
  return confirmations.skipped[stage];
}