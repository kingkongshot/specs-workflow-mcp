#!/usr/bin/env tsx
/**
 * Validate if MCP responses conform to OpenAPI specification
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load OpenAPI specification
async function loadOpenApiSpec() {
  const specPath = join(__dirname, '../api/spec-workflow.openapi.yaml');
  const specContent = await fs.readFile(specPath, 'utf-8');
  return yaml.load(specContent) as any;
}

// Manually validate response
function validateResponse(response: any, schemaName: string, spec: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const schema = spec.components.schemas[schemaName];
  
  if (!schema) {
    return { valid: false, errors: [`Schema ${schemaName} not found`] };
  }
  
  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in response)) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }
  
  // Check field types
  if (schema.properties) {
    for (const [field, fieldSchema] of Object.entries(schema.properties)) {
      if (field in response) {
        const value = response[field];
        const expectedType = (fieldSchema as any).type;
        
        if (expectedType) {
          const actualType = Array.isArray(value) ? 'array' : typeof value;
          
          if (expectedType === 'integer' && typeof value === 'number') {
            // integer and number are compatible
          } else if (expectedType !== actualType) {
            errors.push(`Field ${field}: expected ${expectedType}, got ${actualType}`);
          }
        }
        
        // Recursively check nested objects
        if ((fieldSchema as any).$ref) {
          const refSchemaName = (fieldSchema as any).$ref.split('/').pop();
          const nestedResult = validateResponse(value, refSchemaName, spec);
          errors.push(...nestedResult.errors.map(e => `${field}.${e}`));
        }
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}

// Test example responses
async function testResponses() {
  const spec = await loadOpenApiSpec();
  
  // Test response examples
  const testCases = [
    {
      name: 'InitResponse',
      response: {
        success: true,
        data: {
          path: '/test/path',
          featureName: 'Test Feature',
          nextAction: 'edit_requirements'
        },
        displayText: 'Initialization successful',
        resources: []
      }
    },
    {
      name: 'CheckResponse',
      response: {
        stage: 'requirements',
        progress: {
          overall: 30,
          requirements: 100,
          design: 0,
          tasks: 0
        },
        status: {
          type: 'ready_to_confirm',
          readyToConfirm: true
        },
        displayText: 'Check passed'
      }
    },
    {
      name: 'SkipResponse',
      response: {
        stage: 'requirements',
        skipped: true,
        displayText: 'Skipped'
      }
    }
  ];
  
  console.log('🧪 Validating OpenAPI response format\n');
  
  for (const testCase of testCases) {
    console.log(`📝 Testing ${testCase.name}:`);
    const result = validateResponse(testCase.response, testCase.name, spec);
    
    if (result.valid) {
      console.log('   ✅ Validation passed');
    } else {
      console.log('   ❌ Validation failed:');
      result.errors.forEach(error => {
        console.log(`      - ${error}`);
      });
    }
    console.log();
  }
  
  // Check Progress definition
  console.log('📊 Progress Schema definition:');
  const progressSchema = spec.components.schemas.Progress;
  console.log('Required fields:', progressSchema.required);
  console.log('Properties:', Object.keys(progressSchema.properties));
  console.log();
  
  // Test Progress
  const progressTest = {
    overall: 30,
    requirements: 100,
    design: 0,
    tasks: 0
  };
  
  const progressResult = validateResponse(progressTest, 'Progress', spec);
  console.log('Progress validation:', progressResult.valid ? '✅ Passed' : '❌ Failed');
  if (!progressResult.valid) {
    progressResult.errors.forEach(error => {
      console.log(`   - ${error}`);
    });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testResponses().catch(console.error);
}