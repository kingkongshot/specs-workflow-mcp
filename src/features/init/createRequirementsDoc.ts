/**
 * Create requirements document
 */

import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getRequirementsTemplate } from '../shared/documentTemplates.js';

export interface CreateResult {
  generated: boolean;
  message: string;
  filePath?: string;
  fileName?: string;
}

export function createRequirementsDocument(
  path: string,
  featureName: string,
  introduction: string
): CreateResult {
  const fileName = 'requirements.md';
  const filePath = join(path, fileName);
  
  if (existsSync(filePath)) {
    return {
      generated: false,
      message: 'Requirements document already exists',
      fileName,
      filePath
    };
  }
  
  try {
    const content = getRequirementsTemplate(featureName, introduction);
    writeFileSync(filePath, content, 'utf-8');
    
    return {
      generated: true,
      message: 'Requirements document',
      fileName,
      filePath
    };
  } catch (error) {
    return {
      generated: false,
      message: `Failed to create document: ${error}`,
      fileName
    };
  }
}