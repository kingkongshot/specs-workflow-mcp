#!/usr/bin/env node

/**
 * 文件操作工具
 * 提供纯函数化的文件系统操作
 */

import { promises as fs } from 'fs';
import path from 'path';

/**
 * 复制目录
 * @param {string} src - 源目录
 * @param {string} dest - 目标目录
 * @returns {Promise<void>}
 */
export async function copyDirectory(src, dest) {
  // 创建目标目录
  await fs.mkdir(dest, { recursive: true });
  
  // 读取源目录内容
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  // 并行复制所有条目
  await Promise.all(
    entries.map(async (entry) => {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        // 递归复制子目录
        await copyDirectory(srcPath, destPath);
      } else {
        // 复制文件
        await fs.copyFile(srcPath, destPath);
      }
    })
  );
}

/**
 * 清理目录
 * @param {string} dirPath - 要清理的目录路径
 * @returns {Promise<void>}
 */
export async function cleanupDirectory(dirPath) {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (error) {
    // 忽略目录不存在的错误
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * 清理多个目录
 * @param {Array<string>} dirPaths - 目录路径数组
 * @returns {Promise<void>}
 */
export async function cleanupDirectories(dirPaths) {
  await Promise.all(
    dirPaths.map(dirPath => cleanupDirectory(dirPath))
  );
}

/**
 * 确保目录存在
 * @param {string} dirPath - 目录路径
 * @returns {Promise<void>}
 */
export async function ensureDirectory(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * 检查文件或目录是否存在
 * @param {string} filePath - 文件或目录路径
 * @returns {Promise<boolean>}
 */
export async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 读取文件内容
 * @param {string} filePath - 文件路径
 * @param {string} encoding - 编码格式
 * @returns {Promise<string>}
 */
export async function readFile(filePath, encoding = 'utf-8') {
  return fs.readFile(filePath, encoding);
}

/**
 * 写入文件
 * @param {string} filePath - 文件路径
 * @param {string} content - 文件内容
 * @param {string} encoding - 编码格式
 * @returns {Promise<void>}
 */
export async function writeFile(filePath, content, encoding = 'utf-8') {
  // 确保目录存在
  const dir = path.dirname(filePath);
  await ensureDirectory(dir);
  
  // 写入文件
  await fs.writeFile(filePath, content, encoding);
}

/**
 * 获取目录中的所有文件
 * @param {string} dirPath - 目录路径
 * @param {Object} options - 选项
 * @returns {Promise<Array>}
 */
export async function getFiles(dirPath, options = {}) {
  const {
    recursive = false,
    filter = () => true,
    withFileTypes = false
  } = options;
  
  const files = [];
  
  async function scanDir(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && recursive) {
        await scanDir(fullPath);
      } else if (entry.isFile() && filter(entry.name)) {
        files.push(withFileTypes ? { path: fullPath, entry } : fullPath);
      }
    }
  }
  
  await scanDir(dirPath);
  return files;
}

/**
 * 获取文件统计信息
 * @param {string} filePath - 文件路径
 * @returns {Promise<Object>}
 */
export async function getFileStats(filePath) {
  const stats = await fs.stat(filePath);
  
  return {
    size: stats.size,
    isFile: stats.isFile(),
    isDirectory: stats.isDirectory(),
    created: stats.birthtime,
    modified: stats.mtime,
    accessed: stats.atime
  };
}

/**
 * 移动文件或目录
 * @param {string} src - 源路径
 * @param {string} dest - 目标路径
 * @returns {Promise<void>}
 */
export async function move(src, dest) {
  // 确保目标目录存在
  const destDir = path.dirname(dest);
  await ensureDirectory(destDir);
  
  // 重命名（移动）
  await fs.rename(src, dest);
}

/**
 * 创建临时目录
 * @param {string} prefix - 目录前缀
 * @returns {Promise<string>} 临时目录路径
 */
export async function createTempDir(prefix = 'temp') {
  const tempRoot = path.join(process.cwd(), '.temp');
  await ensureDirectory(tempRoot);
  
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const tempDir = path.join(tempRoot, `${prefix}-${timestamp}-${random}`);
  
  await fs.mkdir(tempDir);
  return tempDir;
}

/**
 * 读取 JSON 文件
 * @param {string} filePath - JSON 文件路径
 * @returns {Promise<any>} 解析后的 JSON 对象
 */
export async function readJsonFile(filePath) {
  const content = await readFile(filePath);
  return JSON.parse(content);
}

/**
 * 写入 JSON 文件
 * @param {string} filePath - JSON 文件路径
 * @param {any} data - 要写入的数据
 * @param {number} indent - 缩进空格数
 * @returns {Promise<void>}
 */
export async function writeJsonFile(filePath, data, indent = 2) {
  const content = JSON.stringify(data, null, indent);
  await writeFile(filePath, content);
}