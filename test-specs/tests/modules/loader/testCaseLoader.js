#!/usr/bin/env node

/**
 * 测试用例加载器
 * 负责从文件系统加载和解析测试用例
 */

import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';

/**
 * 加载测试用例
 * @param {string} testCasesDir - 测试用例目录路径
 * @param {string} testGroup - 可选的测试组名称
 * @returns {Promise<Object>} 测试用例集合
 */
export async function loadTestCases(testCasesDir, testGroup = null) {
  if (testGroup) {
    return loadSingleGroup(testCasesDir, testGroup);
  }
  
  return loadAllGroups(testCasesDir);
}

/**
 * 加载单个测试组
 * @param {string} testCasesDir - 测试用例目录
 * @param {string} groupName - 测试组名称
 * @returns {Promise<Object>} 测试用例集合
 */
async function loadSingleGroup(testCasesDir, groupName) {
  const groupDir = path.join(testCasesDir, groupName);
  const testCases = await loadTestFilesFromDir(groupDir);
  
  return { [groupName]: testCases };
}

/**
 * 加载所有测试组
 * @param {string} testCasesDir - 测试用例目录
 * @returns {Promise<Object>} 测试用例集合
 */
async function loadAllGroups(testCasesDir) {
  const testCases = {};
  
  try {
    const entries = await fs.readdir(testCasesDir, { withFileTypes: true });
    const dirs = entries.filter(entry => entry.isDirectory());
    
    await Promise.all(
      dirs.map(async (dir) => {
        const groupDir = path.join(testCasesDir, dir.name);
        testCases[dir.name] = await loadTestFilesFromDir(groupDir);
      })
    );
  } catch (error) {
    throw new Error(`无法读取测试用例目录: ${error.message}`);
  }
  
  return testCases;
}

/**
 * 从目录加载测试文件
 * @param {string} dir - 目录路径
 * @returns {Promise<Array>} 测试用例数组
 */
async function loadTestFilesFromDir(dir) {
  try {
    const files = await fs.readdir(dir);
    const yamlFiles = files
      .filter(isYamlFile)
      .sort();
    
    const testCases = await Promise.all(
      yamlFiles.map(file => loadTestFile(path.join(dir, file), file))
    );
    
    return testCases.filter(Boolean); // 过滤掉加载失败的用例
  } catch (error) {
    console.error(`无法加载测试目录 ${dir}:`, error.message);
    return [];
  }
}

/**
 * 加载单个测试文件
 * @param {string} filePath - 文件路径
 * @param {string} filename - 文件名
 * @returns {Promise<Object|null>} 测试用例对象或 null
 */
async function loadTestFile(filePath, filename) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const testCase = yaml.load(content);
    
    // 添加文件名信息
    return {
      ...testCase,
      filename
    };
  } catch (error) {
    console.error(`无法加载测试文件 ${filePath}:`, error.message);
    return null;
  }
}

/**
 * 判断是否为 YAML 文件
 * @param {string} filename - 文件名
 * @returns {boolean}
 */
function isYamlFile(filename) {
  return filename.endsWith('.yaml') || filename.endsWith('.yml');
}

/**
 * 验证测试用例结构
 * @param {Object} testCase - 测试用例
 * @returns {Object} 验证结果
 */
export function validateTestCase(testCase) {
  const errors = [];
  
  // 必需字段检查
  if (!testCase.name) {
    errors.push('缺少必需字段: name');
  }
  
  if (!testCase.request) {
    errors.push('缺少必需字段: request');
  } else {
    if (!testCase.request.method) {
      errors.push('缺少必需字段: request.method');
    }
    if (!testCase.request.params) {
      errors.push('缺少必需字段: request.params');
    }
  }
  
  if (!testCase.expect) {
    errors.push('缺少必需字段: expect');
  } else {
    if (!testCase.expect.operation) {
      errors.push('缺少必需字段: expect.operation');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 统计测试用例
 * @param {Object} testCases - 测试用例集合
 * @returns {Object} 统计信息
 */
export function countTestCases(testCases) {
  let total = 0;
  const byGroup = {};
  
  for (const [group, cases] of Object.entries(testCases)) {
    const count = cases.length;
    byGroup[group] = count;
    total += count;
  }
  
  return {
    total,
    byGroup,
    groups: Object.keys(testCases).length
  };
}