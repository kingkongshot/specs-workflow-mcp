#!/usr/bin/env node

/**
 * 预期响应加载器
 * 负责加载和管理预期响应定义
 */

import { promises as fs } from 'fs';
import path from 'path';

/**
 * 加载预期响应定义
 * @param {string} responsesPath - 预期响应文件路径
 * @returns {Promise<Object>} 预期响应对象
 */
export async function loadExpectedResponses(responsesPath) {
  try {
    const content = await fs.readFile(responsesPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`无法加载预期响应文件: ${error.message}`);
  }
}

/**
 * 获取特定操作的预期响应
 * @param {Object} expectedResponses - 预期响应集合
 * @param {string} operation - 操作名称
 * @param {string} type - 响应类型 (success/error)
 * @returns {Object|null} 预期响应或 null
 */
export function getExpectedResponse(expectedResponses, operation, type = 'success') {
  if (!expectedResponses || !operation) {
    return null;
  }
  
  const operationResponses = expectedResponses[operation];
  if (!operationResponses) {
    return null;
  }
  
  return operationResponses[type] || null;
}

/**
 * 根据 JSON Schema 生成期望的响应示例
 * @param {Object} schema - JSON Schema 对象
 * @returns {Object} 生成的示例对象
 */
export function generateExpectedResponseFromSchema(schema) {
  if (!schema || typeof schema !== 'object') {
    return null;
  }
  
  return generateFromSchema(schema);
}

/**
 * 递归生成 Schema 示例
 * @param {Object} schemaObj - Schema 对象
 * @returns {any} 生成的值
 */
function generateFromSchema(schemaObj) {
  if (!schemaObj || typeof schemaObj !== 'object') {
    return null;
  }

  // 处理 const 值
  if (schemaObj.const !== undefined) {
    return schemaObj.const;
  }

  // 处理 enum 值
  if (schemaObj.enum && schemaObj.enum.length > 0) {
    return schemaObj.enum[0];
  }

  // 根据类型生成值
  switch (schemaObj.type) {
    case 'object':
      return generateObject(schemaObj);
      
    case 'array':
      return generateArray(schemaObj);
      
    case 'string':
      return generateString(schemaObj);
      
    case 'number':
    case 'integer':
      return generateNumber(schemaObj);
      
    case 'boolean':
      return false;
      
    default:
      // 处理多类型情况（如 ["string", "null"]）
      if (Array.isArray(schemaObj.type)) {
        const primaryType = schemaObj.type.find(t => t !== 'null');
        return generateFromSchema({ ...schemaObj, type: primaryType });
      }
      return null;
  }
}

/**
 * 生成对象示例
 * @param {Object} schemaObj - Schema 对象
 * @returns {Object} 生成的对象
 */
function generateObject(schemaObj) {
  const obj = {};
  
  if (schemaObj.properties) {
    for (const [key, prop] of Object.entries(schemaObj.properties)) {
      obj[key] = generateFromSchema(prop);
    }
  }
  
  return obj;
}

/**
 * 生成数组示例
 * @param {Object} schemaObj - Schema 对象
 * @returns {Array} 生成的数组
 */
function generateArray(schemaObj) {
  if (schemaObj.items) {
    // 生成一个示例数组项
    return [generateFromSchema(schemaObj.items)];
  }
  return [];
}

/**
 * 生成字符串示例
 * @param {Object} schemaObj - Schema 对象
 * @returns {string} 生成的字符串
 */
function generateString(schemaObj) {
  if (schemaObj.description) {
    return `<${schemaObj.description}>`;
  }
  if (schemaObj.pattern) {
    return `<matches: ${schemaObj.pattern}>`;
  }
  return 'string';
}

/**
 * 生成数字示例
 * @param {Object} schemaObj - Schema 对象
 * @returns {number} 生成的数字
 */
function generateNumber(schemaObj) {
  if (schemaObj.minimum !== undefined) {
    return schemaObj.minimum;
  }
  if (schemaObj.maximum !== undefined) {
    return schemaObj.maximum;
  }
  return 0;
}

/**
 * 验证预期响应定义的完整性
 * @param {Object} expectedResponses - 预期响应集合
 * @param {Array<string>} requiredOperations - 必需的操作列表
 * @returns {Object} 验证结果
 */
export function validateExpectedResponses(expectedResponses, requiredOperations) {
  const errors = [];
  const warnings = [];
  
  // 检查必需的操作
  for (const operation of requiredOperations) {
    if (!expectedResponses[operation]) {
      errors.push(`缺少操作的预期响应定义: ${operation}`);
    } else {
      // 检查是否有响应定义
      // complete_task 需要 single 或 batch，其他操作需要 success
      if (operation === 'complete_task') {
        if (!expectedResponses[operation].single && !expectedResponses[operation].batch) {
          warnings.push(`操作 ${operation} 缺少响应定义（需要 single 或 batch）`);
        }
      } else {
        if (!expectedResponses[operation].success) {
          warnings.push(`操作 ${operation} 缺少 success 响应定义`);
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}