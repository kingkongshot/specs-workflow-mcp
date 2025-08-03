#!/usr/bin/env node

/**
 * 路径解析工具
 * 提供测试相关的路径解析功能
 */

import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前模块的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 解析测试路径
 * @param {string} relativePath - 相对路径
 * @returns {string} 绝对路径
 */
export function resolveTestPath(relativePath) {
  // 如果已经是绝对路径，直接返回
  if (path.isAbsolute(relativePath)) {
    return relativePath;
  }
  
  // 使用环境变量中的测试临时目录
  const tempDir = process.env.TEST_TEMP_DIR;
  if (!tempDir) {
    throw new Error('TEST_TEMP_DIR 环境变量未设置');
  }
  
  // 移除开头的 ./ 如果存在
  const cleanPath = relativePath.startsWith('./') ? relativePath.slice(2) : relativePath;
  
  return path.join(tempDir, cleanPath);
}

/**
 * 获取测试用例目录路径
 * @returns {string} 测试用例目录的绝对路径
 */
export function getTestCasesDir() {
  return process.env.TEST_CASES_DIR || path.join(process.env.TEST_ROOT_DIR || __dirname, 'test-cases');
}

/**
 * 获取夹具目录路径
 * @returns {string} 夹具目录的绝对路径
 */
export function getFixturesDir() {
  return process.env.TEST_FIXTURES_DIR || path.join(process.env.TEST_ROOT_DIR || __dirname, 'fixtures');
}

/**
 * 获取生成文件目录路径
 * @returns {string} 生成文件目录的绝对路径
 */
export function getGeneratedDir() {
  return process.env.TEST_GENERATED_DIR || path.join(process.env.TEST_ROOT_DIR || __dirname, 'generated');
}

/**
 * 获取报告目录路径
 * @returns {string} 报告目录的绝对路径
 */
export function getReportsDir() {
  return process.env.TEST_REPORTS_DIR || path.join(process.env.TEST_ROOT_DIR || __dirname, 'reports');
}

/**
 * 获取临时目录路径
 * @returns {string} 临时目录的绝对路径
 */
export function getTempDir() {
  return process.env.TEST_TEMP_DIR || path.join(process.env.TEST_ROOT_DIR || __dirname, 'temp');
}

/**
 * 生成报告路径
 * @param {string} timestamp - 时间戳
 * @returns {Object} 报告路径信息
 */
export function generateReportPaths(timestamp) {
  const formattedTimestamp = timestamp
    .replace(/[:.]/g, '-')
    .slice(0, -5);
  
  const reportDir = path.join(getReportsDir(), `test-${formattedTimestamp}`);
  const reportFile = path.join(reportDir, 'test-report.md');
  
  return {
    dir: reportDir,
    mainReport: reportFile,
    timestamp: formattedTimestamp
  };
}

/**
 * 生成详细对比文件路径
 * @param {string} reportDir - 报告目录
 * @param {string} group - 测试组
 * @param {string} testFile - 测试文件名
 * @returns {string} 对比文件路径
 */
export function generateComparisonFilePath(reportDir, group, testFile) {
  const filename = `${group}-${testFile.replace('.yaml', '')}.md`;
  return path.join(reportDir, filename);
}

/**
 * 获取预期响应文件路径
 * @returns {string} 预期响应文件的绝对路径
 */
export function getExpectedResponsesPath() {
  return path.join(getGeneratedDir(), 'openapi-expected-responses.json');
}

/**
 * 获取 MCP 服务器路径
 * @returns {string} MCP 服务器的绝对路径
 */
export function getMcpServerPath() {
  return process.env.MCP_SERVER_PATH || path.join(process.env.PROJECT_ROOT_DIR || __dirname, 'dist/index.js');
}

/**
 * 获取 MCP 服务器工作目录
 * @returns {string} MCP 服务器的工作目录
 */
export function getMcpServerCwd() {
  return process.env.MCP_SERVER_CWD || process.env.PROJECT_ROOT_DIR || path.join(__dirname, '../../../..');
}

/**
 * 规范化路径
 * @param {string} filePath - 文件路径
 * @returns {string} 规范化后的路径
 */
export function normalizePath(filePath) {
  return path.normalize(filePath);
}

/**
 * 获取相对路径
 * @param {string} from - 起始路径
 * @param {string} to - 目标路径
 * @returns {string} 相对路径
 */
export function getRelativePath(from, to) {
  return path.relative(from, to);
}

/**
 * 解析路径信息
 * @param {string} filePath - 文件路径
 * @returns {Object} 路径信息
 */
export function parsePathInfo(filePath) {
  const parsed = path.parse(filePath);
  
  return {
    dir: parsed.dir,
    base: parsed.base,
    name: parsed.name,
    ext: parsed.ext,
    isAbsolute: path.isAbsolute(filePath)
  };
}

/**
 * 确保路径使用正斜杠（用于跨平台兼容）
 * @param {string} filePath - 文件路径
 * @returns {string} 使用正斜杠的路径
 */
export function ensureForwardSlashes(filePath) {
  return filePath.replace(/\\/g, '/');
}

/**
 * 验证路径是否在允许的范围内
 * @param {string} filePath - 要验证的路径
 * @param {string} basePath - 基础路径
 * @returns {boolean} 是否在允许范围内
 */
export function isPathWithinBase(filePath, basePath) {
  const resolvedPath = path.resolve(filePath);
  const resolvedBase = path.resolve(basePath);
  
  return resolvedPath.startsWith(resolvedBase);
}