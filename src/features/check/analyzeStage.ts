/**
 * Analyze workflow stage
 */

import { join } from 'path';
import { WorkflowStatus, WorkflowStage, getStageFileName, getStageName } from '../shared/documentStatus.js';
import { isStageConfirmed, isStageSkipped, ConfirmationStatus, SkipStatus } from '../shared/confirmationStatus.js';
import { openApiLoader } from '../shared/openApiLoader.js';
import { isDocumentEdited } from '../shared/documentAnalyzer.js';
import { isObject, hasProperty } from '../shared/typeGuards.js';

export interface StageAnalysis {
  canProceed: boolean;
  needsConfirmation: boolean;
  reason?: string;
  suggestions: string[];
  guide?: unknown; // Writing guide provided when document is not edited
}

export interface StageStatus {
  exists: boolean;
  confirmed: boolean;
  skipped: boolean;
  displayStatus: string;
}

export function analyzeStage(
  path: string,
  stage: WorkflowStage,
  status: WorkflowStatus
): StageAnalysis {
  if (stage === 'completed') {
    return {
      canProceed: false,
      needsConfirmation: false,
      reason: 'All stages completed',
      suggestions: []
    };
  }
  
  const stageData = status[stage as keyof WorkflowStatus];
  // Type guard to handle 'completed' stage
  const isCompletedStage = (s: WorkflowStage): s is 'completed' => s === 'completed';
  const confirmed = isCompletedStage(stage) ? false : isStageConfirmed(path, stage as keyof ConfirmationStatus);
  const skipped = isCompletedStage(stage) ? false : isStageSkipped(path, stage as keyof SkipStatus);
  
  // If stage is skipped or confirmed, can proceed
  if (confirmed || skipped) {
    return {
      canProceed: true,
      needsConfirmation: false,
      suggestions: [`${getStageName(stage)} completed, can proceed to next stage`]
    };
  }
  
  // Check if document exists
  if (!stageData || !stageData.exists) {
    return {
      canProceed: false,
      needsConfirmation: false,
      reason: `${getStageName(stage)} does not exist`,
      suggestions: [`Create ${getStageName(stage)}`],
      guide: getStageGuide(stage)
    };
  }
  
  // Check if document has been edited
  const fileName = getStageFileName(stage);
  const filePath = join(path, fileName);
  const edited = isDocumentEdited(filePath);
  
  if (!edited) {
    // Document exists but not edited
    return {
      canProceed: false,
      needsConfirmation: false,
      reason: `${getStageName(stage)} not edited yet (still contains template markers)`,
      suggestions: [
        `Please edit ${fileName} and remove all <template-*> markers`,
        'Fill in actual content before using check operation'
      ],
      guide: getStageGuide(stage)
    };
  }
  
  // Document edited but not confirmed
  return {
    canProceed: false,
    needsConfirmation: true,
    reason: `${getStageName(stage)} edited but not confirmed yet`,
    suggestions: ['Please use confirm operation to confirm this stage is complete'],
    guide: getStageGuide(stage)
  };
}

export function getStageStatus(
  stage: string,
  status: WorkflowStatus,
  path: string
): StageStatus {
  const stageData = status[stage as keyof WorkflowStatus];
  const exists = stageData?.exists || false;
  const confirmed = exists && stage !== 'completed' ? isStageConfirmed(path, stage as keyof ConfirmationStatus) : false;
  const skipped = exists && stage !== 'completed' ? isStageSkipped(path, stage as keyof SkipStatus) : false;
  
  const globalConfig = openApiLoader.getGlobalConfig();
  const statusTextConfig = isObject(globalConfig) && hasProperty(globalConfig, 'status_text') && isObject(globalConfig.status_text) ? globalConfig.status_text : {};
  const statusText = {
    not_created: typeof statusTextConfig.not_created === 'string' ? statusTextConfig.not_created : 'Not created',
    not_confirmed: typeof statusTextConfig.not_confirmed === 'string' ? statusTextConfig.not_confirmed : 'Pending confirmation',
    completed: typeof statusTextConfig.completed === 'string' ? statusTextConfig.completed : 'Completed',
    skipped: typeof statusTextConfig.skipped === 'string' ? statusTextConfig.skipped : 'Skipped'
  };
  
  let displayStatus = statusText.not_created;
  if (exists) {
    if (skipped) {
      displayStatus = statusText.skipped;
    } else if (confirmed) {
      displayStatus = statusText.completed;
    } else {
      displayStatus = statusText.not_confirmed;
    }
  }
  
  return {
    exists,
    confirmed,
    skipped,
    displayStatus
  };
}


function getStageGuide(stage: WorkflowStage): unknown {
  const guideMap: Record<WorkflowStage, string> = {
    requirements: 'requirements-guide',
    design: 'design-guide',
    tasks: 'tasks-guide',
    completed: ''
  };
  
  const guideId = guideMap[stage];
  if (!guideId) return null;
  
  // Get resource from OpenAPI - already in MCP format
  const resource = openApiLoader.getSharedResource(guideId);
  return resource || null;
}