#!/usr/bin/env node

/**
 * 响应验证器主模块
 * 组合各种验证逻辑，提供统一的验证接口
 */

import { performAdditionalCheck } from './additionalChecks.js';
import { generateExpectedResponseFromSchema } from '../loader/expectedResponseLoader.js';
import { StrictConformanceValidator } from './openApiConformanceValidator.js';
import path from 'path';
import fs from 'fs';

// 创建全局严格模式 OpenAPI 验证器实例
const openApiValidator = new StrictConformanceValidator(
  path.resolve(process.cwd(), '../api/spec-workflow.openapi.yaml')
);

// 初始化时加载 OpenAPI 规范
openApiValidator.loadSpec().catch(error => {
  console.error('警告: 无法加载 OpenAPI 规范:', error.message);
});

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
  
  // 非错误响应必须包含 structuredContent，否则立即失败
  if (response.structuredContent === undefined) {
    return {
      passed: false,
      errors: ['响应缺少 structuredContent 字段，无法进行结构化校验'],
      actualResponse: response,
      expectedResponse: null,
      openApiValidation: null
    };
  }

  // 验证成功响应（需要显式满足 OpenAPI 一致性和附加检查条件）
  return validateSuccessResponse(
    response,
    operation,
    expectedResponses,
    additional_checks,
    testCase  // 传递完整的测试用例以便判断响应类型
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
    openApiValidation: null
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
  // 默认失败：收到非预期错误响应时立即判失败，需要主动满足期望条件才通过
  const errorText = response?.content?.[0]?.text || 'Unknown error';
  const result = {
    passed: false,
    errors: [
      '收到非预期错误响应 (isError=true)。请修复服务端错误或在测试用例中显式声明 expect.error=true。',
      `错误信息: ${errorText}`
    ],
    warnings: [],
    actualResponse: response,
    expectedResponse: { isError: true },
    openApiValidation: null
  };

  // 仅作为辅助：执行不依赖 structuredContent 的额外检查，便于定位问题，但不改变默认失败结论
  if (additionalChecks) {
    for (const check of additionalChecks) {
      if (!check.path || !check.path.startsWith('structuredContent.')) {
        const checkResult = await performAdditionalCheck(check, response);
        if (!checkResult.passed) {
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
 * @param {Object} testCase - 完整的测试用例（用于判断响应类型）
 * @returns {Promise<Object>} 验证结果
 */
async function validateSuccessResponse(response, operation, expectedResponses, additionalChecks, testCase) {
  let expected;
  
  // 对于 complete_task 操作，根据请求参数自动推断响应类型
  if (operation === 'complete_task' && testCase?.request?.params?.arguments?.action) {
    const taskNumber = testCase.request.params.arguments.action.taskNumber;
    
    // 如果 taskNumber 是数组，使用批量响应 schema
    if (Array.isArray(taskNumber)) {
      expected = expectedResponses[operation]?.batch;
    } else {
      // 如果 taskNumber 是字符串，使用单个响应 schema
      expected = expectedResponses[operation]?.single;
    }
  } else {
    // 其他操作使用 success 响应（保持向后兼容）
    expected = expectedResponses[operation]?.success;
  }
  
  if (!expected) {
    const responseType = operation === 'complete_task' ? 
      (Array.isArray(testCase?.request?.params?.arguments?.action?.taskNumber) ? 'batch' : 'single') : 
      'success';
    return {
      passed: false,
      errors: [`未找到 ${operation}.${responseType} 的预期响应定义`],
      actualResponse: response,
      expectedResponse: null,
      openApiValidation: null
    };
  }
  
  const result = {
    passed: true,
    errors: [],
    warnings: [],
    actualResponse: response,
    expectedResponse: generateExpectedResponseFromSchema(expected.schema),
    openApiValidation: null
  };
  
  // 执行 OpenAPI 一致性验证（主要验证）
  try {
    const validationResult = openApiValidator.validateResponse(operation, response.structuredContent, testCase);
    result.openApiValidation = validationResult;
    
    // 保存验证详情到临时目录（用于调试）
    if (process.env.TEST_CLEANUP_AFTER_RUN === 'false' || !validationResult.valid) {
      try {
        const tempDir = path.join(process.cwd(), 'temp', 'openapi-validation-details');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const timestamp = Date.now();
        const testName = testCase?.name || 'unknown';
        const safeName = testName.replace(/[^\w-]/g, '_').substring(0, 50);
        const filename = `validation-${operation}-${safeName}-${timestamp}.json`;
        const filepath = path.join(tempDir, filename);
        
        const report = openApiValidator.generateConformanceReport(operation, response.structuredContent, testCase);
        fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
        
        // 如果验证失败，添加文件引用到警告中
        if (!validationResult.valid) {
          result.warnings.push(`[OpenAPI 验证详情] 保存到: temp/openapi-validation-details/${filename}`);
        }
      } catch (saveError) {
        // 静默忽略保存错误
      }
    }
    
    if (!validationResult.valid) {
      result.passed = false;
      result.errors.push('[OpenAPI 一致性验证] 响应不符合 OpenAPI 规范:');
      
      // 添加验证错误
      validationResult.errors.forEach(error => {
        result.errors.push(`  - ${error}`);
      });
      
      // 添加警告信息
      if (validationResult.warnings && validationResult.warnings.length > 0) {
        validationResult.warnings.forEach(warning => {
          result.warnings.push(`  - ${warning}`);
        });
      }
      
      // 添加一致性检查的详细信息
      if (validationResult.conformance) {
        const conformance = validationResult.conformance;
        if (!conformance.structure?.valid) {
          result.errors.push('  [结构验证失败]');
        }
        if (!conformance.values?.valid) {
          result.errors.push('  [值验证失败]');
        }
        if (!conformance.completeness?.valid) {
          result.errors.push('  [完整性验证失败]');
        }
      }
    }
  } catch (error) {
    // OpenAPI 验证出错不应该导致整个测试失败，记录警告
    result.warnings.push(`OpenAPI 验证出错: ${error.message}`);
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