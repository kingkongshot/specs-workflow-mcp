/**
 * Generate next stage document
 */

import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { WorkflowStage, getNextStage, getStageFileName } from '../shared/documentStatus.js';
import { getDesignTemplate, getTasksTemplate } from '../shared/documentTemplates.js';
import { extractDocumentInfo } from '../shared/documentUtils.js';

export interface NextDocumentResult {
  generated: boolean;
  alreadyExists?: boolean;
  message: string;
  fileName?: string;
  filePath?: string;
  guide?: unknown;
}

export async function generateNextDocument(
  path: string,
  currentStage: WorkflowStage
): Promise<NextDocumentResult> {
  const nextStage = getNextStage(currentStage);
  
  if (nextStage === 'completed') {
    return {
      generated: false,
      message: 'All documents completed'
    };
  }
  
  const fileName = getStageFileName(nextStage);
  const filePath = join(path, fileName);
  
  if (existsSync(filePath)) {
    return {
      generated: false,
      alreadyExists: true,
      message: `${fileName} already exists`,
      fileName,
      filePath
    };
  }
  
  // Extract feature information
  const documentInfo = extractDocumentInfo(join(path, 'requirements.md'));
  
  // Generate document content
  let content: string;
  
  switch (nextStage) {
    case 'design':
      content = getDesignTemplate(documentInfo.featureName);
      // guideType = 'design'; // \u672a\u4f7f\u7528
      break;
    case 'tasks':
      content = getTasksTemplate(documentInfo.featureName);
      // guideType = 'implementation'; // \u672a\u4f7f\u7528
      break;
    default:
      return {
        generated: false,
        message: `Unknown document type: ${nextStage}`
      };
  }
  
  try {
    writeFileSync(filePath, content, 'utf-8');
    
    return {
      generated: true,
      message: `Generated ${fileName}`,
      fileName,
      filePath,
      guide: undefined // Guide resources are now handled via OpenAPI shared resources
    };
  } catch (error) {
    return {
      generated: false,
      message: `Failed to generate document: ${error}`
    };
  }
}

