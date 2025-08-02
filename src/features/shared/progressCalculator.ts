/**
 * Progress calculation
 */

import { WorkflowStatus } from './documentStatus.js';
import { getWorkflowConfirmations } from './confirmationStatus.js';

export interface WorkflowProgress {
  percentage: number;
  completedStages: number;
  totalStages: number;
  details: {
    requirements: StageProgress;
    design: StageProgress;
    tasks: StageProgress;
  };
}

interface StageProgress {
  exists: boolean;
  confirmed: boolean;
  skipped: boolean;
}

export function calculateWorkflowProgress(
  path: string,
  status: WorkflowStatus
): WorkflowProgress {
  const confirmations = getWorkflowConfirmations(path);
  
  const details = {
    requirements: getStageProgress(status.requirements, confirmations.confirmed.requirements, confirmations.skipped.requirements),
    design: getStageProgress(status.design, confirmations.confirmed.design, confirmations.skipped.design),
    tasks: getStageProgress(status.tasks, confirmations.confirmed.tasks, confirmations.skipped.tasks)
  };
  
  const stages = [details.requirements, details.design, details.tasks];
  const completedStages = stages.filter(s => s.confirmed || s.skipped).length;
  const totalStages = stages.length;
  
  // Simplified progress calculation: each stage takes 1/3
  // const stageProgress = 100 / totalStages; // \u672a\u4f7f\u7528
  let totalProgress = 0;
  
  // Requirements stage: 30%
  if (details.requirements.confirmed || details.requirements.skipped) {
    totalProgress += 30;
  }
  
  // Design stage: 30%
  if (details.design.confirmed || details.design.skipped) {
    totalProgress += 30;
  }
  
  // Tasks stage: 40% (only if confirmed, not skipped)
  // Skipping tasks doesn't count as progress since it's essential for development
  if (details.tasks.confirmed) {
    totalProgress += 40;
  }
  
  return {
    percentage: Math.round(totalProgress),
    completedStages,
    totalStages,
    details
  };
}

function getStageProgress(
  status: { exists: boolean },
  confirmed: boolean,
  skipped: boolean
): StageProgress {
  return {
    exists: status.exists,
    confirmed,
    skipped
  };
}