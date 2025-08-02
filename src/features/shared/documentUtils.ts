/**
 * Shared utilities for document processing
 */

import { readFileSync } from 'fs';

export interface DocumentInfo {
  featureName: string;
  introduction: string;
}

export function extractDocumentInfo(requirementsPath: string): DocumentInfo {
  try {
    const content = readFileSync(requirementsPath, 'utf-8');
    const lines = content.split('\n');
    
    // Extract feature name
    const titleLine = lines.find(line => line.startsWith('# '));
    const featureName = titleLine 
      ? titleLine.replace('# ', '').replace(' - Requirements Document', '').trim()
      : 'Unnamed Feature';
    
    // Extract project background
    const backgroundIndex = lines.findIndex(line => line.includes('## Project Background'));
    let introduction = '';
    
    if (backgroundIndex !== -1) {
      for (let i = backgroundIndex + 1; i < lines.length; i++) {
        if (lines[i].startsWith('##')) break;
        if (lines[i].trim()) {
          introduction += lines[i] + '\n';
        }
      }
    }
    
    return {
      featureName,
      introduction: introduction.trim() || 'No description'
    };
  } catch {
    return {
      featureName: 'Unnamed Feature',
      introduction: 'No description'
    };
  }
}