#!/usr/bin/env node

/**
 * 配置管理器
 * 负责加载和管理测试配置
 */

import { loadTestEnv, getTestConfig } from '../../env-loader.js';
import * as pathResolver from './pathResolver.js';

/**
 * 加载测试配置
 * @returns {Object} 配置对象
 */
export function loadConfig() {
  // 加载环境变量
  loadTestEnv();
  
  // 获取基础配置
  const baseConfig = getTestConfig();
  
  // 扩展配置
  const config = {
    ...baseConfig,
    paths: {
      ...baseConfig.paths,
      testCases: baseConfig.paths.casesDir,
      fixtures: baseConfig.paths.fixturesDir,
      generated: pathResolver.getGeneratedDir(),
      reports: baseConfig.paths.reportsDir,
      expectedResponses: pathResolver.getExpectedResponsesPath(),
      mcpServer: baseConfig.paths.mcpServer
    },
    server: {
      initTimeout: 1000,
      shutdownTimeout: 5000,
      ...baseConfig.server
    },
    validation: {
      strictMode: true,
      allowAdditionalProperties: false,
      ...baseConfig.validation
    },
    reporting: {
      generateMarkdown: true,
      generateJson: false,
      includeTimings: true,
      ...baseConfig.reporting
    }
  };
  
  return config;
}

/**
 * 验证配置
 * @param {Object} config - 配置对象
 * @returns {Object} 验证结果
 */
export function validateConfig(config) {
  const errors = [];
  const warnings = [];
  
  // 必需的路径检查
  const requiredPaths = [
    'testCases',
    'fixtures',
    'generated',
    'expectedResponses',
    'mcpServer'
  ];
  
  for (const pathKey of requiredPaths) {
    if (!config.paths?.[pathKey]) {
      errors.push(`缺少必需的路径配置: paths.${pathKey}`);
    }
  }
  
  // MCP 配置检查
  if (!config.mcp?.serverCwd) {
    errors.push('缺少必需的配置: mcp.serverCwd');
  }
  
  // 调试配置检查
  if (config.debug?.verbose && !config.debug?.enabled) {
    warnings.push('debug.verbose 设置为 true，但 debug.enabled 为 false');
  }
  
  // 行为配置检查
  if (config.behavior?.stopOnFirstError && config.behavior?.continueOnError) {
    errors.push('behavior.stopOnFirstError 和 behavior.continueOnError 不能同时为 true');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 获取默认配置
 * @returns {Object} 默认配置
 */
export function getDefaultConfig() {
  return {
    paths: {
      testCases: './test-cases',
      fixtures: './fixtures',
      generated: './generated',
      reports: './reports',
      expectedResponses: './generated/openapi-expected-responses.json',
      mcpServer: '../dist/index.js'
    },
    mcp: {
      serverCwd: process.cwd(),
      protocol: '0.1.0',
      clientInfo: {
        name: 'modular-test-runner',
        version: '1.0.0'
      }
    },
    server: {
      initTimeout: 1000,
      shutdownTimeout: 5000,
      messageTimeout: 30000
    },
    debug: {
      enabled: false,
      verbose: false,
      logMessages: false
    },
    behavior: {
      cleanupAfterRun: true,
      stopOnFirstError: false,
      continueOnError: true,
      retryFailedTests: false,
      maxRetries: 0
    },
    validation: {
      strictMode: true,
      allowAdditionalProperties: false,
      coerceTypes: false
    },
    reporting: {
      generateMarkdown: true,
      generateJson: false,
      includeTimings: true,
      includeDebugInfo: false
    }
  };
}

/**
 * 合并配置
 * @param {Object} baseConfig - 基础配置
 * @param {Object} overrides - 覆盖配置
 * @returns {Object} 合并后的配置
 */
export function mergeConfig(baseConfig, overrides) {
  return deepMerge(baseConfig, overrides);
}

/**
 * 深度合并对象
 * @param {Object} target - 目标对象
 * @param {Object} source - 源对象
 * @returns {Object} 合并后的对象
 */
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (isObject(source[key]) && isObject(target[key])) {
        result[key] = deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
}

/**
 * 检查是否为普通对象
 * @param {any} obj - 要检查的值
 * @returns {boolean}
 */
function isObject(obj) {
  return obj && typeof obj === 'object' && !Array.isArray(obj);
}

/**
 * 从环境变量创建配置覆盖
 * @returns {Object} 配置覆盖对象
 */
export function getEnvOverrides() {
  const overrides = {};
  
  // 调试配置
  if (process.env.TEST_DEBUG === 'true') {
    overrides.debug = {
      enabled: true,
      verbose: process.env.TEST_DEBUG_VERBOSE === 'true'
    };
  }
  
  // 行为配置
  if (process.env.TEST_CLEANUP_AFTER_RUN === 'false') {
    overrides.behavior = {
      ...overrides.behavior,
      cleanupAfterRun: false
    };
  }
  
  if (process.env.TEST_STOP_ON_ERROR === 'true') {
    overrides.behavior = {
      ...overrides.behavior,
      stopOnFirstError: true,
      continueOnError: false
    };
  }
  
  // 报告配置
  if (process.env.TEST_REPORT_JSON === 'true') {
    overrides.reporting = {
      ...overrides.reporting,
      generateJson: true
    };
  }
  
  return overrides;
}

/**
 * 创建测试运行配置
 * @param {Object} options - 运行选项
 * @returns {Object} 完整的配置对象
 */
export function createTestRunConfig(options = {}) {
  // 加载基础配置
  const baseConfig = loadConfig();
  
  // 获取环境变量覆盖
  const envOverrides = getEnvOverrides();
  
  // 合并所有配置
  const config = mergeConfig(
    mergeConfig(baseConfig, envOverrides),
    options
  );
  
  // 验证最终配置
  const validation = validateConfig(config);
  if (!validation.valid) {
    throw new Error(`配置验证失败:\n${validation.errors.join('\n')}`);
  }
  
  // 显示警告
  if (validation.warnings.length > 0) {
    console.warn('配置警告:');
    validation.warnings.forEach(warning => {
      console.warn(`  - ${warning}`);
    });
  }
  
  return config;
}