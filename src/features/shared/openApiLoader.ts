import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { isObject } from './typeGuards.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// OpenAPI specification type definitions
export interface OpenApiSpec {
  paths: {
    '/spec': {
      post: {
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: {
                  $ref: string;
                };
              };
            };
          };
        };
      };
    };
  };
  components: {
    schemas: Record<string, unknown>;
  };
  'x-error-responses': Record<string, {
    displayText: string;
  }>;
  'x-shared-resources': Record<string, {
    uri: string;
    title?: string;
    mimeType: string;
    text?: string;
  }>;
  'x-global-config': unknown;
  'x-document-templates': Record<string, unknown>;
  'x-task-guidance-template'?: {
    separator: string;
    header: string;
    instructions: {
      prefix: string;
      taskFocus: string;
      progressTracking: string;
      workflow: string;
    };
    prompts: {
      firstTask: string;
      nextTask: string;
      continueTask: string;
      batchContinue: string;
    };
    completionMessages: {
      taskCompleted: string;
      allCompleted: string;
      alreadyCompleted: string;
      batchSucceeded: string;
      batchCompleted: string;
    };
  };
}

// Singleton pattern for loading OpenAPI specification
export class OpenApiLoader {
  private static instance: OpenApiLoader;
  private spec: OpenApiSpec | null = null;
  private examples: Map<string, unknown[]> = new Map();

  private constructor() {}

  static getInstance(): OpenApiLoader {
    if (!OpenApiLoader.instance) {
      OpenApiLoader.instance = new OpenApiLoader();
    }
    return OpenApiLoader.instance;
  }

  // Load OpenAPI specification
  loadSpec(): OpenApiSpec {
    if (this.spec) {
      return this.spec;
    }

    const specPath = path.join(__dirname, '../../../api/spec-workflow.openapi.yaml');
    const specContent = fs.readFileSync(specPath, 'utf8');
    this.spec = yaml.load(specContent) as OpenApiSpec;

    // Parse and cache all examples
    this.cacheExamples();

    return this.spec;
  }

  // Cache all response examples
  private cacheExamples(): void {
    if (!this.spec) return;

    const schemas = this.spec.components.schemas;
    for (const [schemaName, schema] of Object.entries(schemas)) {
      if (!isObject(schema)) continue;
      if ('examples' in schema && Array.isArray(schema.examples)) {
        this.examples.set(schemaName, schema.examples);
      }
    }
  }

  // Get response example
  getResponseExample(responseType: string, criteria?: Record<string, unknown>): unknown {
    const examples = this.examples.get(responseType);
    if (!examples || examples.length === 0) {
      return null;
    }

    // If no filter criteria, return the first example
    if (!criteria) {
      return examples[0];
    }

    // Filter examples by criteria
    for (const example of examples) {
      let matches = true;
      for (const [key, value] of Object.entries(criteria)) {
        if (this.getNestedValue(example, key) !== value) {
          matches = false;
          break;
        }
      }
      if (matches) {
        return example;
      }
    }

    // No match found, return the first one
    return examples[0];
  }

  // Get error response template
  getErrorResponse(errorType: string): string | null {
    if (!this.spec || !this.spec['x-error-responses']) {
      return null;
    }
    
    const errorResponse = this.spec['x-error-responses'][errorType];
    return errorResponse?.displayText || null;
  }


  // Get progress calculation rules
  getProgressRules(): unknown {
    if (!this.spec) return null;

    const progressSchema = this.spec.components.schemas.Progress;
    if (isObject(progressSchema) && 'x-progress-rules' in progressSchema) {
      return progressSchema['x-progress-rules'];
    }
    return null;
  }

  // Utility function: get nested object value
  private getNestedValue(obj: unknown, path: string): unknown {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (isObject(current) && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  // Replace template variables
  static replaceVariables(template: string, variables: Record<string, unknown>): string {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
      result = result.replace(regex, String(value));
    }
    
    return result;
  }

  // Get shared resource - directly return MCP format
  getSharedResource(resourceId: string): { uri: string; title?: string; mimeType: string; text?: string } | null {
    if (!this.spec || !this.spec['x-shared-resources']) {
      return null;
    }
    
    return this.spec['x-shared-resources'][resourceId] || null;
  }

  // Get global configuration
  getGlobalConfig(): unknown {
    if (!this.spec) return {};
    return this.spec['x-global-config'] || {};
  }

  // Get document template
  getDocumentTemplate(templateType: string): unknown {
    if (!this.spec) return null;
    return this.spec['x-document-templates']?.[templateType] || null;
  }

  // Resolve resource list - no conversion needed, use MCP format directly
  resolveResources(resources?: Array<unknown>): Array<{ uri: string; title?: string; mimeType: string; text?: string }> | undefined {
    if (!resources || resources.length === 0) {
      return undefined;
    }

    const resolved: Array<{ uri: string; title?: string; mimeType: string; text?: string }> = [];
    
    for (const resource of resources) {
      if (isObject(resource) && 'ref' in resource && typeof resource.ref === 'string') {
        // Get from shared resources - already in MCP format
        const sharedResource = this.getSharedResource(resource.ref);
        if (sharedResource) {
          resolved.push(sharedResource);
        }
      }
    }

    return resolved.length > 0 ? resolved : undefined;
  }

  // Get task guidance template
  getTaskGuidanceTemplate(): OpenApiSpec['x-task-guidance-template'] | null {
    if (!this.spec) return null;
    return this.spec['x-task-guidance-template'] || null;
  }
}

export const openApiLoader = OpenApiLoader.getInstance();