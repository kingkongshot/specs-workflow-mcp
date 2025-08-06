#!/usr/bin/env node

/**
 * 从 OpenAPI 规范中提取预期响应格式
 * 用于端到端测试验证
 */

import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class OpenAPIResponseExtractor {
  constructor(openApiPath) {
    this.openApiPath = openApiPath;
    this.spec = null;
  }

  async loadSpec() {
    const content = await fs.readFile(this.openApiPath, 'utf-8');
    this.spec = yaml.load(content);
  }

  /**
   * 提取所有响应示例和模式
   */
  extractResponses() {
    const responses = {
      init: this.extractInitResponses(),
      check: this.extractCheckResponses(),
      skip: this.extractSkipResponses(),
      confirm: this.extractConfirmResponses(),
      complete_task: this.extractCompleteTaskResponses(),
      errors: this.extractErrorResponses()
    };

    return responses;
  }

  /**
   * 提取 init 操作的响应
   */
  extractInitResponses() {
    const initResponse = this.findResponseByExample('InitResponse');
    if (!initResponse) return null;

    return {
      success: {
        schema: this.convertToJsonSchema(initResponse),
        validation: 'json_schema'
      }
    };
  }

  /**
   * 提取 check 操作的响应
   */
  extractCheckResponses() {
    const checkResponse = this.findResponseByExample('CheckResponse');
    if (!checkResponse) return null;

    // 返回纯粹的 JSON Schema，不依赖具体示例值
    return {
      success: {
        schema: this.convertToJsonSchema(checkResponse),
        validation: 'json_schema' // 标记使用 JSON Schema 验证
      }
    };
  }

  /**
   * 提取 skip 操作的响应
   */
  extractSkipResponses() {
    const skipResponse = this.findResponseByExample('SkipResponse');
    if (!skipResponse) return null;

    return {
      success: {
        schema: this.convertToJsonSchema(skipResponse),
        validation: 'json_schema'
      }
    };
  }

  /**
   * 提取 confirm 操作的响应
   */
  extractConfirmResponses() {
    const confirmResponse = this.findResponseByExample('ConfirmResponse');
    if (!confirmResponse) return null;

    return {
      success: {
        schema: this.convertToJsonSchema(confirmResponse),
        validation: 'json_schema'
      }
    };
  }

  /**
   * 提取 complete_task 操作的响应
   */
  extractCompleteTaskResponses() {
    const completeTaskResponse = this.findResponseByExample('CompleteTaskResponse');
    const batchCompleteTaskResponse = this.findResponseByExample('BatchCompleteTaskResponse');
    
    // 支持单个任务和批量任务两种响应格式
    const responses = {};
    
    if (completeTaskResponse) {
      responses.single = {
        schema: this.convertToJsonSchema(completeTaskResponse),
        validation: 'json_schema'
      };
    }
    
    if (batchCompleteTaskResponse) {
      responses.batch = {
        schema: this.convertToJsonSchema(batchCompleteTaskResponse),
        validation: 'json_schema'
      };
    }
    
    return Object.keys(responses).length > 0 ? responses : null;
  }

  /**
   * 提取错误响应
   */
  extractErrorResponses() {
    const errorResponses = this.spec['x-error-responses'];
    if (!errorResponses) return null;

    const responses = {};
    for (const [key, value] of Object.entries(errorResponses)) {
      responses[key] = {
        displayText: value.displayText,
        validation: {
          isError: true,
          contentContains: this.extractKeywordsFromText(value.displayText)
        }
      };
    }

    return responses;
  }

  /**
   * 根据名称查找响应定义
   */
  findResponseByExample(name) {
    const schemas = this.spec.components?.schemas;
    if (!schemas) return null;

    return schemas[name] || null;
  }

  /**
   * 将 OpenAPI Schema 转换为标准 JSON Schema
   */
  convertToJsonSchema(openApiSchema) {
    if (!openApiSchema) return null;

    return this.resolveReferences(openApiSchema);
  }

  /**
   * 解析 $ref 引用并内联完整的 schema
   */
  resolveReferences(schema, visited = new Set()) {
    if (!schema) return null;

    // 如果是引用，解析引用
    if (schema['$ref']) {
      const refPath = schema['$ref'];
      
      // 防止循环引用
      if (visited.has(refPath)) {
        return { type: 'object', description: `Circular reference to ${refPath}` };
      }
      
      visited.add(refPath);
      
      // 解析 #/components/schemas/TypeName 格式的引用
      const typeName = refPath.split('/').pop();
      const referencedSchema = this.spec.components?.schemas?.[typeName];
      
      if (referencedSchema) {
        const resolved = this.resolveReferences(referencedSchema, visited);
        visited.delete(refPath);
        return resolved;
      }
      
      visited.delete(refPath);
      return { type: 'object', description: `Unresolved reference: ${refPath}` };
    }

    // 如果是对象，递归处理属性
    if (schema.type === 'object' || schema.properties) {
      const result = {
        type: schema.type || 'object',
        properties: {},
        required: schema.required || [],
        additionalProperties: schema.additionalProperties !== undefined ? schema.additionalProperties : true
      };
      
      // 保留 nullable 属性
      if (schema.nullable === true) {
        result.nullable = true;
      }

      if (schema.properties) {
        for (const [key, prop] of Object.entries(schema.properties)) {
          result.properties[key] = this.resolveReferences(prop, visited);
        }
      }

      return result;
    }

    // 如果是数组，递归处理 items
    if (schema.type === 'array' && schema.items) {
      return {
        type: 'array',
        items: this.resolveReferences(schema.items, visited)
      };
    }

    // 如果有 enum 值，保留它们
    if (schema.enum) {
      return {
        type: schema.type || 'string',
        enum: schema.enum
      };
    }

    // 如果有 const 值，保留它
    if (schema.const !== undefined) {
      return {
        type: schema.type || typeof schema.const,
        const: schema.const
      };
    }

    // 基本类型，构建结果对象
    const result = {
      type: schema.type || 'string'
    };
    
    // 保留可选属性
    if (schema.description !== undefined) result.description = schema.description;
    if (schema.nullable === true) result.nullable = true;
    if (schema.pattern !== undefined) result.pattern = schema.pattern;
    if (schema.minLength !== undefined) result.minLength = schema.minLength;
    if (schema.maxLength !== undefined) result.maxLength = schema.maxLength;
    if (schema.minimum !== undefined) result.minimum = schema.minimum;
    if (schema.maximum !== undefined) result.maximum = schema.maximum;
    
    return result;
  }

  /**
   * 根据状态确定场景名称
   */
  determineScenario(stage, statusType) {
    if (statusType === 'not_edited') return 'not_edited';
    if (statusType === 'ready_to_confirm') return 'ready_to_confirm';
    if (statusType === 'completed') return 'completed';
    if (stage === 'requirements' && statusType === 'in_progress') return 'requirements_in_progress';
    if (stage === 'design') return 'design_stage';
    if (stage === 'tasks') return 'tasks_stage';
    return 'unknown';
  }

  /**
   * 创建验证规则
   */
  createValidationRules(schema, example = null) {
    const rules = {
      required_fields: [],
      expected_values: {},
      field_types: {}
    };

    // 从 schema 提取必需字段
    if (schema.required) {
      rules.required_fields = schema.required;
    }

    // 从 properties 提取字段类型
    if (schema.properties) {
      for (const [field, props] of Object.entries(schema.properties)) {
        if (props.type) {
          rules.field_types[field] = props.type;
        }

        // 如果有固定值（const），添加到预期值
        if (props.const !== undefined) {
          rules.expected_values[field] = props.const;
        }

        // 递归处理嵌套对象
        if (props.properties && props.required) {
          rules[`${field}_required`] = props.required;
        }
      }
    }

    // 如果有示例，提取一些预期值
    if (example) {
      if (example.stage) rules.expected_values.stage = example.stage;
      if (example.status?.type) rules.expected_values['status.type'] = example.status.type;
      if (example.progress?.overall !== undefined) {
        rules.expected_values['progress.overall'] = example.progress.overall;
      }
    }

    return rules;
  }

  /**
   * 从文本中提取关键词
   */
  extractKeywordsFromText(text) {
    const keywords = [];
    
    // 提取一些关键词
    if (text.includes('Error')) keywords.push('Error');
    if (text.includes('Invalid')) keywords.push('Invalid');
    if (text.includes('does not exist')) keywords.push('does not exist');
    if (text.includes('required')) keywords.push('required');
    
    return keywords;
  }

  /**
   * 保存提取的响应到文件
   */
  async saveExtractedResponses(outputPath) {
    const responses = this.extractResponses();
    await fs.writeFile(
      outputPath,
      JSON.stringify(responses, null, 2),
      'utf-8'
    );
    console.log(`✅ 已从 OpenAPI 规范提取响应格式到: ${outputPath}`);
  }
}

// 如果直接运行
if (import.meta.url === `file://${process.argv[1]}`) {
  async function main() {
    const extractor = new OpenAPIResponseExtractor(
      path.join(__dirname, '../../api/spec-workflow.openapi.yaml')
    );
    
    await extractor.loadSpec();
    
    await extractor.saveExtractedResponses(
      path.join(__dirname, '../generated/openapi-expected-responses.json')
    );
    
    // 显示提取的内容示例
    const responses = extractor.extractResponses();
    console.log('\n📋 提取的响应示例:');
    console.log('\ninit.success:', JSON.stringify(responses.init?.success?.validation, null, 2));
    console.log('\ncheck scenarios:', Object.keys(responses.check || {}));
  }
  
  main().catch(console.error);
}

export default OpenAPIResponseExtractor;