#!/usr/bin/env tsx
/**
 * Generate TypeScript type definitions from OpenAPI specification
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read OpenAPI specification
const specPath = path.join(__dirname, '../api/spec-workflow.openapi.yaml');
const spec = yaml.load(fs.readFileSync(specPath, 'utf8')) as any;

// Generate TypeScript types
function generateTypes(): string {
  const types: string[] = [];
  
  types.push('// Auto-generated type definitions - do not modify manually');
  types.push('// Generated from api/spec-workflow.openapi.yaml');
  types.push('');
  
  // Generate types for schemas
  for (const [schemaName, schema] of Object.entries(spec.components.schemas)) {
    types.push(generateSchemaType(schemaName, schema));
    types.push('');
  }
  
  // Generate extended types
  types.push('// Extended type definitions');
  types.push('export interface ErrorResponse {');
  types.push('  displayText: string;');
  types.push('  variables?: Record<string, any>;');
  types.push('}');
  types.push('');
  
  types.push('export interface ContentCheckRules {');
  types.push('  minLength?: number;');
  types.push('  requiredSections?: string[];');
  types.push('  optionalSections?: string[];');
  types.push('  minTasks?: number;');
  types.push('  taskFormat?: string;');
  types.push('  requiresEstimate?: boolean;');
  types.push('}');
  
  return types.join('\n');
}

function generateSchemaType(name: string, schema: any): string {
  const lines: string[] = [];
  
  lines.push(`export interface ${name} {`);
  
  if (schema.properties) {
    for (const [propName, prop] of Object.entries(schema.properties) as [string, any][]) {
      const required = schema.required?.includes(propName) || false;
      const optional = required ? '' : '?';
      const type = getTypeScriptType(prop);
      const comment = prop.description ? `  // ${prop.description}` : '';
      
      lines.push(`  ${propName}${optional}: ${type};${comment}`);
    }
  }
  
  // Handle oneOf
  if (schema.oneOf) {
    lines.push('  // oneOf:');
    schema.oneOf.forEach((item: any) => {
      if (item.$ref) {
        const refType = item.$ref.split('/').pop();
        lines.push(`  // - ${refType}`);
      }
    });
  }
  
  lines.push('}');
  
  return lines.join('\n');
}

function getTypeScriptType(prop: any): string {
  if (prop.$ref) {
    return prop.$ref.split('/').pop();
  }
  
  if (prop.oneOf) {
    const types = prop.oneOf.map((item: any) => {
      if (item.$ref) {
        return item.$ref.split('/').pop();
      }
      return getTypeScriptType(item);
    });
    return types.join(' | ');
  }
  
  if (prop.enum) {
    return prop.enum.map((v: any) => `'${v}'`).join(' | ');
  }
  
  switch (prop.type) {
    case 'string':
      if (prop.const) {
        return `'${prop.const}'`;
      }
      return 'string';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array':
      if (prop.items) {
        return `${getTypeScriptType(prop.items)}[]`;
      }
      return 'any[]';
    case 'object':
      if (prop.properties) {
        const props = Object.entries(prop.properties)
          .map(([k, v]: [string, any]) => `${k}: ${getTypeScriptType(v)}`)
          .join('; ');
        return `{ ${props} }`;
      }
      return 'Record<string, any>';
    default:
      return 'any';
  }
}

// Generate type file
const types = generateTypes();
const outputPath = path.join(__dirname, '../src/features/shared/openApiTypes.ts');
fs.writeFileSync(outputPath, types, 'utf8');

console.log('✅ TypeScript types generated to:', outputPath);