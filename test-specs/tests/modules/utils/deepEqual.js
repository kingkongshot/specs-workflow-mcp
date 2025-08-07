#!/usr/bin/env node

/**
 * 深度比较工具
 * 用于比较两个对象是否深度相等
 */

/**
 * 深度比较两个值
 * @param {any} a - 第一个值
 * @param {any} b - 第二个值
 * @returns {boolean} 是否相等
 */
export function deepEqual(a, b) {
  if (a === b) return true;
  
  if (a === null || b === null) return false;
  if (a === undefined || b === undefined) return false;
  
  // 检查类型
  const typeA = typeof a;
  const typeB = typeof b;
  if (typeA !== typeB) return false;
  
  // 处理基本类型
  if (typeA !== 'object') return a === b;
  
  // 处理数组
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  
  // 如果一个是数组一个不是
  if (Array.isArray(a) || Array.isArray(b)) return false;
  
  // 处理对象
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  
  return true;
}

/**
 * 查找两个对象的差异
 * @param {any} expected - 期望值
 * @param {any} actual - 实际值
 * @param {string} path - 当前路径
 * @returns {Array} 差异列表
 */
export function findDifferences(expected, actual, path = '') {
  const differences = [];
  
  if (expected === actual) return differences;
  
  // 类型不同
  if (typeof expected !== typeof actual) {
    differences.push({
      path: path || 'root',
      expected: expected,
      actual: actual,
      message: `类型不匹配: 期望 ${typeof expected}, 实际 ${typeof actual}`
    });
    return differences;
  }
  
  // 处理 null 和 undefined
  if (expected === null || actual === null || expected === undefined || actual === undefined) {
    if (expected !== actual) {
      differences.push({
        path: path || 'root',
        expected: expected,
        actual: actual,
        message: `值不匹配`
      });
    }
    return differences;
  }
  
  // 处理基本类型
  if (typeof expected !== 'object') {
    if (expected !== actual) {
      differences.push({
        path: path || 'root',
        expected: expected,
        actual: actual,
        message: `值不匹配`
      });
    }
    return differences;
  }
  
  // 处理数组
  if (Array.isArray(expected) && Array.isArray(actual)) {
    if (expected.length !== actual.length) {
      differences.push({
        path: path || 'root',
        expected: `长度 ${expected.length}`,
        actual: `长度 ${actual.length}`,
        message: `数组长度不匹配`
      });
    }
    
    const minLength = Math.min(expected.length, actual.length);
    for (let i = 0; i < minLength; i++) {
      const itemPath = path ? `${path}[${i}]` : `[${i}]`;
      differences.push(...findDifferences(expected[i], actual[i], itemPath));
    }
    
    return differences;
  }
  
  // 如果一个是数组一个不是
  if (Array.isArray(expected) || Array.isArray(actual)) {
    differences.push({
      path: path || 'root',
      expected: Array.isArray(expected) ? 'array' : typeof expected,
      actual: Array.isArray(actual) ? 'array' : typeof actual,
      message: `类型不匹配`
    });
    return differences;
  }
  
  // 处理对象
  const allKeys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
  
  for (const key of allKeys) {
    const keyPath = path ? `${path}.${key}` : key;
    
    if (!(key in expected)) {
      differences.push({
        path: keyPath,
        expected: undefined,
        actual: actual[key],
        message: `额外的属性`
      });
    } else if (!(key in actual)) {
      differences.push({
        path: keyPath,
        expected: expected[key],
        actual: undefined,
        message: `缺少属性`
      });
    } else {
      differences.push(...findDifferences(expected[key], actual[key], keyPath));
    }
  }
  
  return differences;
}