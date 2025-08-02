/**
 * Document content analyzer
 * Uses XML markers to detect if document has been edited
 */

import { readFileSync, existsSync } from 'fs';

// XML marker definitions - matching actual template placeholders
export const TEMPLATE_MARKERS = {
  REQUIREMENTS_START: '<template-requirements>',
  REQUIREMENTS_END: '</template-requirements>',
  DESIGN_START: '<template-design>',
  DESIGN_END: '</template-design>',
  TASKS_START: '<template-tasks>',
  TASKS_END: '</template-tasks>'
};

/**
 * Analyze if document has been edited
 * Determined by checking if XML template markers exist
 */
export function isDocumentEdited(filePath: string): boolean {
  if (!existsSync(filePath)) {
    return false;
  }
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    
    // Check if contains any template markers
    const hasTemplateMarkers = Object.values(TEMPLATE_MARKERS).some(marker => 
      content.includes(marker)
    );
    
    // If no template markers, it means it has been edited
    return !hasTemplateMarkers;
  } catch {
    return false;
  }
}

