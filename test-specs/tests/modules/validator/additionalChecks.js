#!/usr/bin/env node

/**
 * 额外检查模块
 * 提供各种额外的验证检查功能
 */

import { promises as fs } from 'fs';
import { getValueByPath } from './responseValidator.js';
import { resolveTestPath } from '../utils/pathResolver.js';

/**
 * 执行额外检查
 * @param {Object} check - 检查配置
 * @param {Object} data - 要检查的数据
 * @returns {Promise<Object>} 检查结果
 */
export async function performAdditionalCheck(check, data) {
  const checkFunctions = {
    'file_exists': checkFileExists,
    'file_not_exists': checkFileNotExists,
    'file_contains': checkFileContains,
    'file_content': checkFileContent,
    'value_equals': checkValueEquals,
    'value_in_range': checkValueInRange,
    'value_contains': checkValueContains,
    'array_equals': checkArrayEquals,
    'array_contains': checkArrayContains
  };
  
  const checkFunction = checkFunctions[check.type];
  
  if (!checkFunction) {
    return {
      passed: false,
      error: `未知的检查类型: ${check.type}`
    };
  }
  
  return checkFunction(check, data);
}

/**
 * 检查文件是否存在
 * @param {Object} check - 检查配置
 * @returns {Promise<Object>} 检查结果
 */
async function checkFileExists(check) {
  try {
    const absPath = resolveTestPath(check.path);
    await fs.access(absPath);
    return { passed: true };
  } catch {
    return {
      passed: false,
      error: `文件不存在: ${check.path}`
    };
  }
}

/**
 * 检查文件是否不存在
 * @param {Object} check - 检查配置
 * @returns {Promise<Object>} 检查结果
 */
async function checkFileNotExists(check) {
  try {
    const absPath = resolveTestPath(check.path);
    await fs.access(absPath);
    return {
      passed: false,
      error: `文件不应该存在: ${check.path}`
    };
  } catch {
    return { passed: true };
  }
}

/**
 * 检查文件是否包含特定内容
 * @param {Object} check - 检查配置
 * @returns {Promise<Object>} 检查结果
 */
async function checkFileContains(check) {
  // 检查必要的参数
  if (!check.path) {
    return {
      passed: false,
      error: `测试配置错误: file_contains 检查缺少 path 字段`
    };
  }
  if (check.content === undefined) {
    return {
      passed: false,
      error: `测试配置错误: file_contains 检查缺少 content 字段`
    };
  }
  
  try {
    const absPath = resolveTestPath(check.path);
    const content = await fs.readFile(absPath, 'utf-8');
    
    if (content.includes(check.content)) {
      return { passed: true };
    } else {
      return {
        passed: false,
        error: `文件 ${check.path} 不包含: ${check.content}`
      };
    }
  } catch {
    return {
      passed: false,
      error: `无法读取文件: ${check.path}`
    };
  }
}

/**
 * 检查文件内容（支持 JSON 和文本文件）
 * @param {Object} check - 检查配置
 * @returns {Promise<Object>} 检查结果
 */
async function checkFileContent(check) {
  try {
    const absPath = resolveTestPath(check.path);
    const content = await fs.readFile(absPath, 'utf-8');
    
    // 根据文件扩展名判断处理方式
    if (check.path.endsWith('.json')) {
      return checkJsonFileContent(content, check);
    } else {
      return checkTextFileContent(content, check);
    }
  } catch (e) {
    return {
      passed: false,
      error: `无法读取文件: ${check.path} - ${e.message}`
    };
  }
}

/**
 * 检查 JSON 文件内容
 * @param {string} content - 文件内容
 * @param {Object} check - 检查配置
 * @returns {Object} 检查结果
 */
function checkJsonFileContent(content, check) {
  try {
    const jsonContent = JSON.parse(content);
    let targetObject = jsonContent;
    
    // 如果指定了 parent_key，先导航到父对象
    if (check.parent_key) {
      targetObject = jsonContent[check.parent_key];
      if (!targetObject) {
        return {
          passed: false,
          error: `文件 ${check.path} 中找不到键: ${check.parent_key}`
        };
      }
    }
    
    const contentStr = JSON.stringify(targetObject);
    
    if (contentStr.includes(check.contains)) {
      return { passed: true };
    } else {
      return {
        passed: false,
        error: `文件 ${check.path} 的 ${check.parent_key || 'root'} 不包含: ${check.contains}`
      };
    }
  } catch (parseError) {
    return {
      passed: false,
      error: `无法解析 JSON 文件: ${check.path} - ${parseError.message}`
    };
  }
}

/**
 * 检查文本文件内容
 * @param {string} content - 文件内容
 * @param {Object} check - 检查配置
 * @returns {Object} 检查结果
 */
function checkTextFileContent(content, check) {
  if (content.includes(check.contains)) {
    return { passed: true };
  } else {
    return {
      passed: false,
      error: `文件 ${check.path} 不包含: ${check.contains}`
    };
  }
}

/**
 * 检查值是否相等
 * @param {Object} check - 检查配置
 * @param {Object} data - 数据对象
 * @returns {Object} 检查结果
 */
function checkValueEquals(check, data) {
  // 检查期望值是否配置
  if (!check.hasOwnProperty('value')) {
    return {
      passed: false,
      error: `测试配置错误: value_equals 检查缺少 value 字段`
    };
  }
  
  const actualValue = getValueByPath(data, check.path);
  
  if (actualValue === check.value) {
    return { passed: true };
  } else {
    return {
      passed: false,
      error: `值不匹配: ${check.path} = ${JSON.stringify(actualValue)} (期望: ${JSON.stringify(check.value)})`
    };
  }
}

/**
 * 检查值是否在范围内
 * @param {Object} check - 检查配置
 * @param {Object} data - 数据对象
 * @returns {Object} 检查结果
 */
function checkValueInRange(check, data) {
  // 检查必要的范围参数
  if (check.min === undefined || check.max === undefined) {
    return {
      passed: false,
      error: `测试配置错误: value_in_range 检查缺少 min 或 max 字段`
    };
  }
  
  const value = getValueByPath(data, check.path);
  
  if (typeof value === 'number' && value >= check.min && value <= check.max) {
    return { passed: true };
  } else {
    return {
      passed: false,
      error: `值不在范围内: ${check.path} = ${value} (期望: ${check.min}-${check.max})`
    };
  }
}

/**
 * 检查值是否包含特定内容
 * @param {Object} check - 检查配置
 * @param {Object} data - 数据对象
 * @returns {Object} 检查结果
 */
function checkValueContains(check, data) {
  const value = getValueByPath(data, check.path);
  // 兼容两种字段名：value 或 contains
  const expectedContent = check.value || check.contains;
  
  // 检查期望值是否为 undefined
  if (expectedContent === undefined) {
    return {
      passed: false,
      error: `测试配置错误: value_contains 检查缺少期望值 (value 或 contains 字段)`
    };
  }
  
  if (value && String(value).includes(expectedContent)) {
    return { passed: true };
  } else {
    return {
      passed: false,
      error: `值不包含: ${check.path} = ${value} (期望包含: ${expectedContent})`
    };
  }
}

/**
 * 检查数组是否完全相等
 * @param {Object} check - 检查配置
 * @param {Object} data - 数据对象
 * @returns {Object} 检查结果
 */
function checkArrayEquals(check, data) {
  const actualArray = getValueByPath(data, check.path);
  const expectedArray = check.values || check.value;
  
  // 检查期望值是否存在
  if (!expectedArray) {
    return {
      passed: false,
      error: `测试配置错误: array_equals 检查缺少 values 字段`
    };
  }
  
  // 检查实际值是否为数组
  if (!Array.isArray(actualArray)) {
    return {
      passed: false,
      error: `值不是数组: ${check.path} = ${JSON.stringify(actualArray)}`
    };
  }
  
  // 检查数组长度
  if (actualArray.length !== expectedArray.length) {
    return {
      passed: false,
      error: `数组长度不匹配: ${check.path} 包含 ${actualArray.length} 个元素 (期望: ${expectedArray.length} 个)`
    };
  }
  
  // 检查数组内容（顺序相关）
  const sortedActual = [...actualArray].sort();
  const sortedExpected = [...expectedArray].sort();
  
  for (let i = 0; i < sortedExpected.length; i++) {
    if (sortedActual[i] !== sortedExpected[i]) {
      return {
        passed: false,
        error: `数组内容不匹配: ${check.path} = [${actualArray.join(', ')}] (期望: [${expectedArray.join(', ')}])`
      };
    }
  }
  
  return { passed: true };
}

/**
 * 检查数组是否包含特定元素
 * @param {Object} check - 检查配置
 * @param {Object} data - 数据对象
 * @returns {Object} 检查结果
 */
function checkArrayContains(check, data) {
  const actualArray = getValueByPath(data, check.path);
  const expectedValues = check.values || check.value;
  
  // 检查期望值是否存在
  if (!expectedValues) {
    return {
      passed: false,
      error: `测试配置错误: array_contains 检查缺少 values 字段`
    };
  }
  
  // 确保期望值是数组
  const valuesToCheck = Array.isArray(expectedValues) ? expectedValues : [expectedValues];
  
  // 检查实际值是否为数组
  if (!Array.isArray(actualArray)) {
    return {
      passed: false,
      error: `值不是数组: ${check.path} = ${JSON.stringify(actualArray)}`
    };
  }
  
  // 检查每个期望值是否存在于实际数组中
  const missingValues = valuesToCheck.filter(v => !actualArray.includes(v));
  
  if (missingValues.length > 0) {
    return {
      passed: false,
      error: `数组缺少元素: ${check.path} = [${actualArray.join(', ')}] (缺少: [${missingValues.join(', ')}])`
    };
  }
  
  return { passed: true };
}

