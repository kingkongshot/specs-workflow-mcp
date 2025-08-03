#!/usr/bin/env node

/**
 * 响应验证器主模块
 * 组合各种验证逻辑，提供统一的验证接口
 */

import { validateSchema } from './schemaValidator.js';
import { performAdditionalCheck } from './additionalChecks.js';
import { generateExpectedResponseFromSchema } from '../loader/expectedResponseLoader.js';

/**
 * 验证响应
 * @param {Object} testCase - 测试用例
 * @param {Object} actualResponse - 实际响应
 * @param {Object} expectedResponses - 预期响应定义集合
 * @returns {Promise<Object>} 验证结果
 */
export async function validateResponse(testCase, actualResponse, expectedResponses) {
  const { operation, error, error_checks, additional_checks } = testCase.expect;
  const response = actualResponse.result;
  
  // 处理错误响应的情况
  if (error === true) {
    return validateErrorResponse(response, error_checks, additional_checks);
  }
  
  // 处理非预期的错误响应
  if (response.isError === true) {
    return handleUnexpectedError(response, additional_checks);
  }
  
  // 验证成功响应
  return validateSuccessResponse(
    response,
    operation,
    expectedResponses,
    additional_checks
  );
}

/**
 * 验证错误响应
 * @param {Object} response - 响应对象
 * @param {Array} errorChecks - 错误检查项
 * @param {Array} additionalChecks - 额外检查项
 * @returns {Promise<Object>} 验证结果
 */
async function validateErrorResponse(response, errorChecks, additionalChecks) {
  const result = {
    passed: true,
    errors: [],
    actualResponse: response,
    expectedResponse: { isError: true },
    schemaValidation: null
  };
  
  // 验证是否确实是错误响应
  if (response.isError !== true) {
    result.passed = false;
    result.errors.push('期望错误响应，但收到成功响应');
    return result;
  }
  
  // 执行错误检查
  if (errorChecks) {
    for (const check of errorChecks) {
      const checkResult = await performErrorCheck(check, response);
      if (!checkResult.passed) {
        result.passed = false;
        result.errors.push(checkResult.error);
      }
    }
  }
  
  // 执行额外检查
  if (additionalChecks) {
    for (const check of additionalChecks) {
      const checkResult = await performAdditionalCheck(check, response);
      if (!checkResult.passed) {
        result.passed = false;
        result.errors.push(checkResult.error);
      }
    }
  }
  
  return result;
}

/**
 * 处理非预期的错误响应
 * @param {Object} response - 响应对象
 * @param {Array} additionalChecks - 额外检查项
 * @returns {Promise<Object>} 验证结果
 */
async function handleUnexpectedError(response, additionalChecks) {
  const result = {
    passed: true,
    errors: [],
    warnings: [],
    actualResponse: response,
    expectedResponse: { isError: true },
    schemaValidation: null
  };
  
  // 只执行不依赖 structuredContent 的额外检查
  if (additionalChecks) {
    for (const check of additionalChecks) {
      if (!check.path || !check.path.startsWith('structuredContent.')) {
        const checkResult = await performAdditionalCheck(check, response);
        if (!checkResult.passed) {
          result.passed = false;
          result.errors.push(checkResult.error);
        }
      }
    }
  }
  
  return result;
}

/**
 * 验证成功响应
 * @param {Object} response - 响应对象
 * @param {string} operation - 操作名称
 * @param {Object} expectedResponses - 预期响应定义集合
 * @param {Array} additionalChecks - 额外检查项
 * @returns {Promise<Object>} 验证结果
 */
async function validateSuccessResponse(response, operation, expectedResponses, additionalChecks) {
  const expected = expectedResponses[operation]?.success;
  
  if (!expected) {
    return {
      passed: false,
      errors: [`未找到 ${operation}.success 的预期响应定义`],
      actualResponse: response,
      expectedResponse: null,
      schemaValidation: null
    };
  }
  
  const result = {
    passed: true,
    errors: [],
    warnings: [],
    actualResponse: response,
    expectedResponse: generateExpectedResponseFromSchema(expected.schema),
    schemaValidation: null
  };
  
  // 进行 JSON Schema 验证
  if (expected.validation === 'json_schema') {
    const schemaValidation = validateSchema(response.structuredContent, expected.schema);
    result.schemaValidation = schemaValidation;
    
    if (!schemaValidation.passed) {
      result.passed = false;
      result.errors.push('JSON Schema 验证失败:');
      schemaValidation.errors.forEach(error => {
        result.errors.push(`  - ${error.instancePath || 'root'}: ${error.message}`);
      });
    }
  }
  
  // 执行额外检查
  if (additionalChecks) {
    for (const check of additionalChecks) {
      const checkResult = await performAdditionalCheck(check, response);
      if (!checkResult.passed) {
        result.passed = false;
        result.errors.push(checkResult.error);
      }
    }
  }
  
  return result;
}

/**
 * 执行错误检查
 * @param {Object} check - 检查项
 * @param {Object} response - 响应对象
 * @returns {Promise<Object>} 检查结果
 */
async function performErrorCheck(check, response) {
  switch (check.type) {
    case 'error_message':
      const errorText = response.content?.[0]?.text || '';
      if (!errorText.toLowerCase().includes(check.contains.toLowerCase())) {
        return {
          passed: false,
          error: `错误信息不包含: ${check.contains}`
        };
      }
      return { passed: true };
      
    case 'no_files_created':
      // 委托给 additionalChecks 模块
      return performAdditionalCheck({
        type: 'file_not_exists',
        path: check.path
      }, response);
      
    default:
      return performAdditionalCheck(check, response);
  }
}

/**
 * 从对象中根据路径获取值
 * @param {Object} obj - 源对象
 * @param {string} path - 点分隔的路径
 * @returns {any} 获取到的值
 */
export function getValueByPath(obj, path) {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    // 处理数组索引
    const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, arrayName, index] = arrayMatch;
      if (current && typeof current === 'object' && arrayName in current && Array.isArray(current[arrayName])) {
        current = current[arrayName][parseInt(index, 10)];
      } else {
        return undefined;
      }
    } else if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  
  return current;
}