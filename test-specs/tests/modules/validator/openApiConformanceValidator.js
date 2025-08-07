#!/usr/bin/env node

/**
 * 严格模式 OpenAPI 一致性验证器
 * 核心原则：所有响应必须与 OpenAPI 定义完全一致，不允许任何偏差
 */

import { promises as fs } from 'fs';
import yaml from 'js-yaml';
import Ajv from 'ajv';
import { deepEqual } from '../utils/deepEqual.js';

/**
 * 严格模式 OpenAPI 一致性验证器
 * 验证实际响应是否与 OpenAPI 规范完全一致，不允许任何偏差
 */
export class StrictConformanceValidator {
  constructor(openApiPath) {
    this.openApiPath = openApiPath;
    this.spec = null;
    this.strictMode = true;
    this.ajv = new Ajv({ 
      strict: false,
      allErrors: true,
      verbose: true
    });
  }
  
  /**
   * 加载 OpenAPI 规范
   */
  async loadSpec() {
    const content = await fs.readFile(this.openApiPath, 'utf-8');
    this.spec = yaml.load(content);
    return this.spec;
  }
  
  /**
   * 验证响应与 OpenAPI 的完全一致性
   * @param {string} operation - 操作名称 (init/check/confirm/skip/complete_task)
   * @param {Object} actualResponse - 实际响应
   * @param {Object} testCase - 测试用例（可选，用于判断 complete_task 的响应类型）
   * @returns {Object} 验证结果
   */
  validateResponse(operation, actualResponse, testCase) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      conformance: {
        structure: null,
        values: null,
        completeness: null
      }
    };
    
    // 1. 获取 OpenAPI 中定义的响应结构
    let expectedSchema = this.getResponseSchema(operation);
    
    // 对于 complete_task，根据响应内容判断是批量还是单个
    if (operation === 'complete_task' && actualResponse) {
      // 如果响应包含 success 和 completedTasks 字段，说明是批量响应
      if (typeof actualResponse === 'object' && 'success' in actualResponse && 'completedTasks' in actualResponse) {
        expectedSchema = this.spec?.components?.schemas?.BatchCompleteTaskResponse;
      }
    }
    
    if (!expectedSchema) {
      result.valid = false;
      result.errors.push(`OpenAPI 中未定义操作 "${operation}" 的响应结构`);
      return result;
    }
    
    // 2. 结构验证 - 响应必须符合 JSON Schema
    result.conformance.structure = this.validateStructure(actualResponse, expectedSchema);
    if (!result.conformance.structure.valid) {
      result.valid = false;
      result.errors.push(...result.conformance.structure.errors);
    }
    
    // 3. 值验证 - 如果 OpenAPI 定义了示例或枚举，必须匹配
    result.conformance.values = this.validateValues(actualResponse, expectedSchema);
    if (!result.conformance.values.valid) {
      result.valid = false;
      result.errors.push(...result.conformance.values.errors);
    }
    
    // 4. 完整性验证 - 所有必需字段必须存在
    result.conformance.completeness = this.validateCompleteness(actualResponse, expectedSchema);
    if (!result.conformance.completeness.valid) {
      result.valid = false;
      result.errors.push(...result.conformance.completeness.errors);
    }
    
    // 5. 占位符验证 - 不应该有未替换的占位符
    const placeholderCheck = this.checkForPlaceholders(actualResponse);
    if (!placeholderCheck.valid) {
      result.valid = false;
      result.errors.push(...placeholderCheck.errors);
    }
    
    // 6. 额外字段检查 - 响应中不应包含未定义的字段（严格模式：警告视为错误）
    const extraFields = this.findExtraFields(actualResponse, expectedSchema);
    if (extraFields.length > 0) {
      result.valid = false;
      result.errors.push(`严格模式 - 响应包含 OpenAPI 未定义的字段: ${extraFields.join(', ')}`);
    }
    
    // 7. 严格检查 - 响应必须与示例完全一致
    const strictChecks = this.performStrictChecks(operation, actualResponse);
    if (!strictChecks.valid) {
      result.valid = false;
      result.errors.push(...strictChecks.errors);
    }
    
    return result;
  }
  
  /**
   * 获取响应 Schema
   */
  getResponseSchema(operation) {
    // 根据操作类型获取对应的响应定义
    const schemas = this.spec?.components?.schemas;
    if (!schemas) return null;
    
    // 映射操作到响应类型
    const responseMap = {
      'init': 'InitResponse',
      'check': 'CheckResponse',
      'confirm': 'ConfirmResponse',
      'skip': 'SkipResponse',
      'complete_task': 'CompleteTaskResponse'
    };
    
    const responseName = responseMap[operation];
    if (!responseName || !schemas[responseName]) {
      return null;
    }
    
    return schemas[responseName];
  }
  
  /**
   * 验证结构
   */
  validateStructure(actual, schema) {
    const result = { valid: true, errors: [] };
    
    // 使用 AJV 验证 JSON Schema
    const validate = this.ajv.compile(schema);
    const valid = validate(actual);
    
    if (!valid) {
      result.valid = false;
      result.errors = validate.errors.map(err => 
        `结构验证失败 - ${err.instancePath || 'root'}: ${err.message}`
      );
    }
    
    return result;
  }
  
  /**
   * 验证值
   */
  validateValues(actual, schema) {
    const result = { valid: true, errors: [] };
    
    // 递归检查所有字段
    this.validateFieldValues(actual, schema, '', result);
    
    return result;
  }
  
  /**
   * 递归验证字段值
   */
  validateFieldValues(actual, schema, path, result) {
    // 如果定义了枚举，值必须在枚举中
    if (schema.enum && !schema.enum.includes(actual)) {
      result.valid = false;
      result.errors.push(
        `值验证失败 - ${path || 'root'}: 值 "${actual}" 不在允许的枚举 [${schema.enum.join(', ')}] 中`
      );
    }
    
    // 如果定义了常量，值必须匹配
    if (schema.const !== undefined && actual !== schema.const) {
      result.valid = false;
      result.errors.push(
        `值验证失败 - ${path || 'root'}: 期望值 "${schema.const}"，实际值 "${actual}"`
      );
    }
    
    // 如果定义了模式，字符串必须匹配
    if (schema.pattern && typeof actual === 'string') {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(actual)) {
        result.valid = false;
        result.errors.push(
          `值验证失败 - ${path || 'root'}: 值不匹配模式 "${schema.pattern}"`
        );
      }
    }
    
    // 递归检查对象属性
    if (schema.type === 'object' && schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (actual && actual[key] !== undefined) {
          this.validateFieldValues(
            actual[key],
            propSchema,
            path ? `${path}.${key}` : key,
            result
          );
        }
      }
    }
    
    // 递归检查数组元素
    if (schema.type === 'array' && schema.items && Array.isArray(actual)) {
      actual.forEach((item, index) => {
        this.validateFieldValues(
          item,
          schema.items,
          `${path}[${index}]`,
          result
        );
      });
    }
  }
  
  /**
   * 验证完整性
   */
  validateCompleteness(actual, schema) {
    const result = { valid: true, errors: [] };
    
    // 检查所有必需字段
    if (schema.required && Array.isArray(schema.required)) {
      for (const field of schema.required) {
        if (actual[field] === undefined || actual[field] === null) {
          result.valid = false;
          result.errors.push(`完整性验证失败 - 缺少必需字段: ${field}`);
        }
      }
    }
    
    // 递归检查嵌套对象的必需字段
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (actual[key] && propSchema.type === 'object') {
          const nestedResult = this.validateCompleteness(actual[key], propSchema);
          if (!nestedResult.valid) {
            result.valid = false;
            result.errors.push(...nestedResult.errors.map(e => `${key}.${e}`));
          }
        }
      }
    }
    
    return result;
  }
  
  /**
   * 检查占位符
   */
  checkForPlaceholders(obj, path = '') {
    const result = { valid: true, errors: [] };
    
    if (typeof obj === 'string') {
      // 检查各种占位符格式
      const placeholderPatterns = [
        /\$\{[^}]+\}/g,      // ${variable}
        /\{\{[^}]+\}\}/g,    // {{variable}}
        /\[\[[\w\s]+\]\]/g,  // [[VARIABLE]]
      ];
      
      for (const pattern of placeholderPatterns) {
        const matches = obj.match(pattern);
        if (matches) {
          result.valid = false;
          result.errors.push(
            `占位符验证失败 - ${path || 'root'}: 发现未替换的占位符 ${matches.join(', ')}`
          );
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      // 递归检查对象和数组
      for (const [key, value] of Object.entries(obj)) {
        const nestedPath = path ? `${path}.${key}` : key;
        const nestedResult = this.checkForPlaceholders(value, nestedPath);
        if (!nestedResult.valid) {
          result.valid = false;
          result.errors.push(...nestedResult.errors);
        }
      }
    }
    
    return result;
  }
  
  /**
   * 查找额外字段
   */
  findExtraFields(actual, schema, path = '') {
    const extraFields = [];
    
    if (schema.type === 'object' && schema.properties) {
      const definedFields = Object.keys(schema.properties);
      const actualFields = Object.keys(actual || {});
      
      // 如果不允许额外属性，检查额外字段
      if (schema.additionalProperties === false) {
        for (const field of actualFields) {
          if (!definedFields.includes(field)) {
            extraFields.push(path ? `${path}.${field}` : field);
          }
        }
      }
      
      // 递归检查嵌套对象
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (actual[key] && propSchema.type === 'object') {
          const nestedPath = path ? `${path}.${key}` : key;
          const nestedExtras = this.findExtraFields(actual[key], propSchema, nestedPath);
          extraFields.push(...nestedExtras);
        }
      }
    }
    
    return extraFields;
  }
  
  /**
   * 执行严格检查
   */
  performStrictChecks(operation, actualResponse) {
    const result = { valid: true, errors: [] };
    
    // 1. 如果 OpenAPI 定义了示例，响应必须与示例结构完全一致
    const example = this.getResponseExample(operation);
    if (example) {
      const structureMatch = this.compareStructure(actualResponse, example);
      if (!structureMatch.identical) {
        result.valid = false;
        result.errors.push(`严格模式 - 响应结构与 OpenAPI 示例不完全一致: ${structureMatch.differences.join(', ')}`);
      }
    }
    
    // 2. 不允许任何动态生成的内容超出 OpenAPI 定义
    const dynamicContent = this.detectDynamicContent(actualResponse);
    if (dynamicContent.length > 0) {
      const allowedDynamic = this.getAllowedDynamicFields(operation);
      const unauthorized = dynamicContent.filter(f => !allowedDynamic.includes(f));
      if (unauthorized.length > 0) {
        result.valid = false;
        result.errors.push(`严格模式 - 发现未授权的动态内容: ${unauthorized.join(', ')}`);
      }
    }
    
    // 3. 字段顺序必须与 OpenAPI 定义一致
    const orderCheck = this.checkFieldOrder(actualResponse, operation);
    if (!orderCheck.valid) {
      result.valid = false;
      result.errors.push(`严格模式 - 字段顺序不一致: ${orderCheck.message}`);
    }
    
    return result;
  }
  
  /**
   * 比较结构
   */
  compareStructure(actual, expected) {
    const differences = [];
    
    const actualKeys = Object.keys(actual).sort();
    const expectedKeys = Object.keys(expected).sort();
    
    // 检查缺失的键
    const missing = expectedKeys.filter(k => !actualKeys.includes(k));
    if (missing.length > 0) {
      differences.push(`缺失字段: ${missing.join(', ')}`);
    }
    
    // 检查多余的键
    const extra = actualKeys.filter(k => !expectedKeys.includes(k));
    if (extra.length > 0) {
      differences.push(`多余字段: ${extra.join(', ')}`);
    }
    
    // 递归比较嵌套结构
    for (const key of expectedKeys) {
      if (actualKeys.includes(key)) {
        if (typeof expected[key] === 'object' && typeof actual[key] === 'object') {
          const nestedComparison = this.compareStructure(actual[key], expected[key]);
          if (!nestedComparison.identical) {
            differences.push(`${key}: ${nestedComparison.differences.join(', ')}`);
          }
        }
      }
    }
    
    return {
      identical: differences.length === 0,
      differences: differences
    };
  }
  
  /**
   * 获取响应示例
   */
  getResponseExample(operation) {
    const schemas = this.spec?.components?.schemas;
    if (!schemas) return null;
    
    const responseMap = {
      'init': 'InitResponse',
      'check': 'CheckResponse',
      'confirm': 'ConfirmResponse',
      'skip': 'SkipResponse',
      'complete_task': 'CompleteTaskResponse'
    };
    
    const responseName = responseMap[operation];
    if (!responseName || !schemas[responseName]) {
      return null;
    }
    
    // 从 schema 的 examples 或 x-example 扩展中获取示例
    return schemas[responseName].example || schemas[responseName]['x-example'];
  }
  
  /**
   * 检测动态内容
   */
  detectDynamicContent(obj, path = '') {
    const dynamicFields = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const fieldPath = path ? `${path}.${key}` : key;
      
      // 检查是否看起来像动态生成的内容
      if (this.looksLikeDynamic(value)) {
        dynamicFields.push(fieldPath);
      }
      
      // 递归检查
      if (typeof value === 'object' && value !== null) {
        dynamicFields.push(...this.detectDynamicContent(value, fieldPath));
      }
    }
    
    return dynamicFields;
  }
  
  /**
   * 判断是否像动态内容
   */
  looksLikeDynamic(value) {
    if (typeof value !== 'string') return false;
    
    // 包含时间戳
    if (/\d{4}-\d{2}-\d{2}/.test(value)) return true;
    
    // 包含 UUID
    if (/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i.test(value)) return true;
    
    // 包含动态计数
    if (/\d+\s*(个|条|项|次)/.test(value)) return true;
    
    return false;
  }
  
  /**
   * 获取允许的动态字段
   */
  getAllowedDynamicFields(operation) {
    // 从 OpenAPI 的 x-dynamic-fields 扩展中读取
    const schema = this.getResponseSchema(operation);
    return schema?.['x-dynamic-fields'] || [];
  }
  
  /**
   * 检查字段顺序
   */
  checkFieldOrder(actual, operation) {
    const schema = this.getResponseSchema(operation);
    if (!schema?.['x-field-order']) {
      return { valid: true };
    }
    
    const expectedOrder = schema['x-field-order'];
    const actualOrder = Object.keys(actual);
    
    // 比较顺序
    for (let i = 0; i < expectedOrder.length; i++) {
      if (actualOrder[i] !== expectedOrder[i]) {
        return {
          valid: false,
          message: `期望第 ${i + 1} 个字段是 "${expectedOrder[i]}"，实际是 "${actualOrder[i]}"`
        };
      }
    }
    
    return { valid: true };
  }
  
  /**
   * 生成一致性报告
   */
  generateConformanceReport(operation, actualResponse, testCase) {
    const validation = this.validateResponse(operation, actualResponse, testCase);
    
    const report = {
      operation: operation,
      timestamp: new Date().toISOString(),
      conformant: validation.valid,
      summary: {
        totalErrors: validation.errors.length,
        totalWarnings: validation.warnings.length,
        structureValid: validation.conformance.structure?.valid || false,
        valuesValid: validation.conformance.values?.valid || false,
        completenessValid: validation.conformance.completeness?.valid || false
      },
      details: validation
    };
    
    return report;
  }
  
  /**
   * 批量验证多个响应
   */
  async validateBatch(responses) {
    const results = [];
    
    for (const { operation, response } of responses) {
      const report = this.generateConformanceReport(operation, response);
      results.push(report);
    }
    
    // 生成总结
    const summary = {
      total: results.length,
      conformant: results.filter(r => r.conformant).length,
      nonConformant: results.filter(r => !r.conformant).length,
      results: results
    };
    
    return summary;
  }
}

// 导出便利函数
export async function strictValidateAgainstOpenAPI(openApiPath, operation, response, testCase) {
  const validator = new StrictConformanceValidator(openApiPath);
  await validator.loadSpec();
  return validator.validateResponse(operation, response, testCase);
}