/**
 * Document templates - using OpenAPI as single source of truth
 */

import { openApiLoader } from './openApiLoader.js';
import { isObject, isArray } from './typeGuards.js';

// Format template, replace variables
function formatTemplate(template: unknown, values: { [key: string]: unknown }): string {
  const lines: string[] = [];
  
  if (!isObject(template)) {
    throw new Error('Invalid template format');
  }
  
  const title = template.title;
  if (typeof title === 'string') {
    lines.push(`# ${interpolate(title, values)}`);
    lines.push('');
  }
  
  const sections = template.sections;
  if (isArray(sections)) {
    for (const section of sections) {
      if (isObject(section)) {
        if (typeof section.content === 'string') {
          lines.push(interpolate(section.content, values));
        } else if (typeof section.placeholder === 'string') {
          lines.push(section.placeholder);
        }
        lines.push('');
      }
    }
  }
  
  return lines.join('\n');
}

// Variable interpolation
function interpolate(template: string, values: { [key: string]: unknown }): string {
  return template.replace(/\${([^}]+)}/g, (match, key) => {
    const keys = key.split('.');
    let value: unknown = values;
    
    for (const k of keys) {
      if (isObject(value) && k in value) {
        value = value[k];
      } else {
        return match;
      }
    }
    
    return String(value);
  });
}

// Get requirements document template
export function getRequirementsTemplate(featureName: string, introduction: string): string {
  // Ensure spec is loaded
  openApiLoader.loadSpec();
  const template = openApiLoader.getDocumentTemplate('requirements');
  if (!template) {
    throw new Error('Requirements template not found in OpenAPI specification');
  }

  return formatTemplate(template, { featureName, introduction });
}

// Get design document template
export function getDesignTemplate(featureName: string): string {
  // Ensure spec is loaded
  openApiLoader.loadSpec();
  const template = openApiLoader.getDocumentTemplate('design');
  if (!template) {
    throw new Error('Design template not found in OpenAPI specification');
  }

  return formatTemplate(template, { featureName });
}

// Get tasks list template
export function getTasksTemplate(featureName: string): string {
  // Ensure spec is loaded
  openApiLoader.loadSpec();
  const template = openApiLoader.getDocumentTemplate('tasks');
  if (!template) {
    throw new Error('Tasks template not found in OpenAPI specification');
  }

  return formatTemplate(template, { featureName });
}

// Get skipped marker template
export function getSkippedTemplate(featureName: string, stageName: string): string {
  // Ensure spec is loaded
  openApiLoader.loadSpec();
  const template = openApiLoader.getDocumentTemplate('skipped');
  if (!template) {
    throw new Error('Skipped template not found in OpenAPI specification');
  }

  return formatTemplate(template, { featureName, stageName });
}