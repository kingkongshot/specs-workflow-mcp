#!/usr/bin/env node

/**
 * JSON Schema 验证器
 * 负责 Schema 验证相关的纯函数
 */

import Ajv from 'ajv';

// 创建 AJV 实例（可以被缓存）
const ajv = new Ajv({ 
  allErrors: true,
  strict: false // 允许 OpenAPI 扩展如 nullable
});

/**
 * 验证数据是否符合 JSON Schema
 * @param {any} data - 要验证的数据
 * @param {Object} schema - JSON Schema 定义
 * @returns {Object} 验证结果
 */
export function validateSchema(data, schema) {
  // 预处理 schema，处理 OpenAPI 特定的属性
  const processedSchema = preprocessSchema(schema);
  
  // 编译并验证
  const validate = ajv.compile(processedSchema);
  const isValid = validate(data);
  
  return {
    passed: isValid,
    errors: validate.errors || [],
    schema: schema
  };
}

/**
 * 预处理 schema，将 OpenAPI 的特定属性转换为 JSON Schema 格式
 * @param {Object} schema - 原始 schema
 * @returns {Object} 处理后的 schema
 */
export function preprocessSchema(schema) {
  if (!schema || typeof schema !== 'object') {
    return schema;
  }
  
  // 深拷贝以避免修改原始 schema
  const processed = JSON.parse(JSON.stringify(schema));
  
  // 递归处理所有属性
  processObject(processed);
  
  return processed;
}

/**
 * 递归处理对象中的 OpenAPI 特定属性
 * @param {Object} obj - 要处理的对象
 */
function processObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return;
  }
  
  // 处理 nullable 属性
  if (obj.nullable === true && obj.type) {
    // 将 nullable 转换为 type 数组
    obj.type = [obj.type, 'null'];
    delete obj.nullable;
  }
  
  // 递归处理 properties
  if (obj.properties) {
    Object.values(obj.properties).forEach(processObject);
  }
  
  // 递归处理 items
  if (obj.items) {
    processObject(obj.items);
  }
  
  // 递归处理 allOf, anyOf, oneOf
  ['allOf', 'anyOf', 'oneOf'].forEach(keyword => {
    if (obj[keyword] && Array.isArray(obj[keyword])) {
      obj[keyword].forEach(processObject);
    }
  });
  
  // 递归处理 additionalProperties
  if (obj.additionalProperties && typeof obj.additionalProperties === 'object') {
    processObject(obj.additionalProperties);
  }
}

/**
 * 格式化验证错误信息
 * @param {Array} errors - AJV 错误数组
 * @returns {Array<string>} 格式化后的错误信息
 */
export function formatValidationErrors(errors) {
  if (!errors || !Array.isArray(errors)) {
    return [];
  }
  
  return errors.map(error => {
    const path = error.instancePath || 'root';
    const message = error.message || '未知错误';
    
    // 为常见错误提供更友好的信息
    switch (error.keyword) {
      case 'required':
        return `${path}: 缺少必需字段 '${error.params.missingProperty}'`;
        
      case 'type':
        return `${path}: 类型错误，期望 ${error.params.type}，实际为 ${typeof error.data}`;
        
      case 'enum':
        return `${path}: 值必须是以下之一: ${error.params.allowedValues.join(', ')}`;
        
      case 'pattern':
        return `${path}: 值不匹配正则表达式 ${error.params.pattern}`;
        
      case 'minLength':
        return `${path}: 字符串长度至少为 ${error.params.limit}`;
        
      case 'maxLength':
        return `${path}: 字符串长度最多为 ${error.params.limit}`;
        
      default:
        return `${path}: ${message}`;
    }
  });
}

/**
 * 验证 Schema 定义本身的有效性
 * @param {Object} schema - Schema 定义
 * @returns {Object} 验证结果
 */
export function validateSchemaDefinition(schema) {
  try {
    // 使用 AJV 的 validateSchema 方法
    const valid = ajv.validateSchema(schema);
    
    return {
      valid,
      errors: valid ? [] : ['Schema 定义无效']
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Schema 验证失败: ${error.message}`]
    };
  }
}

/**
 * 合并多个 Schema
 * @param {Array<Object>} schemas - Schema 数组
 * @returns {Object} 合并后的 Schema
 */
export function mergeSchemas(schemas) {
  if (!Array.isArray(schemas) || schemas.length === 0) {
    return {};
  }
  
  if (schemas.length === 1) {
    return schemas[0];
  }
  
  // 使用 allOf 合并多个 Schema
  return {
    allOf: schemas
  };
}