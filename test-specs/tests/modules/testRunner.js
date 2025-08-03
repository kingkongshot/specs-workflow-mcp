#!/usr/bin/env node

/**
 * 模块化测试运行器主入口
 * 使用函数组合模式整合各个模块
 */

import { startServer, stopServer, initializeConnection, isServerReady } from './server/mcpServerManager.js';
import { sendRequest, createIdGenerator } from './server/messageHandler.js';
import { loadTestCases, countTestCases, validateTestCase } from './loader/testCaseLoader.js';
import { loadExpectedResponses } from './loader/expectedResponseLoader.js';
import { validateResponse } from './validator/responseValidator.js';
import * as consoleReporter from './reporter/consoleReporter.js';
import { generateReport, generateDetailedComparison, saveReport } from './reporter/markdownReporter.js';
import { copyDirectory, cleanupDirectories, exists, ensureDirectory } from './utils/fileOperations.js';
import { resolveTestPath, generateReportPaths, generateComparisonFilePath, getTempDir } from './utils/pathResolver.js';
import { createTestRunConfig } from './utils/configManager.js';
import { generateTestReportWebUI } from '../../scripts/generateTestReportWebUI.js';
import path from 'path';

/**
 * 运行测试的主函数
 * @param {Object} options - 运行选项
 * @returns {Promise<Object>} 测试结果
 */
export async function runTests(options = {}) {
  const { testGroup } = options;
  
  // 创建配置
  const config = createTestRunConfig(options);
  
  // 初始化测试状态
  const testState = {
    config,
    testResults: [],
    server: null,
    messageHandler: null,
    idGenerator: createIdGenerator(),
    expectedResponses: null
  };
  
  try {
    // 创建临时目录
    const tempDir = getTempDir();
    await ensureDirectory(tempDir);
    
    // 执行测试流程
    await loadExpectedResponsesStep(testState);
    await loadTestCasesStep(testState, testGroup);
    await startServerStep(testState);
    await runAllTestsStep(testState);
    await generateReportsStep(testState);
    
    return {
      success: true,
      results: testState.testResults,
      summary: generateSummary(testState.testResults)
    };
    
  } catch (error) {
    console.error('测试运行失败:', error);
    return {
      success: false,
      error: error.message,
      results: testState.testResults
    };
    
  } finally {
    // 清理资源
    await cleanupStep(testState);
  }
}

/**
 * 加载预期响应
 * @param {Object} state - 测试状态
 */
async function loadExpectedResponsesStep(state) {
  state.expectedResponses = await loadExpectedResponses(
    state.config.paths.expectedResponses
  );
}

/**
 * 加载测试用例
 * @param {Object} state - 测试状态
 * @param {string} testGroup - 测试组
 */
async function loadTestCasesStep(state, testGroup) {
  const testCases = await loadTestCases(
    state.config.paths.testCases,
    testGroup
  );
  
  const stats = countTestCases(testCases);
  
  if (stats.total === 0) {
    throw new Error('未找到任何测试用例');
  }
  
  state.testCases = testCases;
  state.testStats = stats;
  
  console.log(`\n📊 加载了 ${stats.total} 个测试用例`);
  if (stats.groups > 1) {
    console.log(`   分布在 ${stats.groups} 个测试组中`);
  }
}

/**
 * 启动服务器
 * @param {Object} state - 测试状态
 */
async function startServerStep(state) {
  consoleReporter.printServerStarting(state.config);
  
  // 使用 temp 目录作为 MCP 服务器的工作目录
  const tempDir = getTempDir();
  
  const { server, messageHandler } = await startServer({
    serverPath: state.config.paths.mcpServer,
    serverCwd: tempDir,
    initTimeout: state.config.server.initTimeout
  });
  
  state.server = server;
  state.messageHandler = messageHandler;
  
  // 创建发送请求的便捷函数
  state.sendRequest = (method, params) => {
    return sendRequest(
      messageHandler,
      method,
      params,
      state.idGenerator
    );
  };
  
  // 初始化连接
  const initResponse = await initializeConnection(state.sendRequest);
  
  if (!isServerReady(initResponse)) {
    throw new Error('服务器初始化失败');
  }
  
  consoleReporter.printServerInitialized();
}

/**
 * 运行所有测试
 * @param {Object} state - 测试状态
 */
async function runAllTestsStep(state) {
  consoleReporter.printRunningInfo(state.testGroup);
  
  let totalIndex = 0;
  const totalTests = state.testStats.total;
  
  for (const [groupName, groupCases] of Object.entries(state.testCases)) {
    if (groupCases.length === 0) continue;
    
    consoleReporter.printGroupStart(groupName, groupCases.length);
    
    for (const testCase of groupCases) {
      totalIndex++;
      
      if (state.config.reporting.includeTimings) {
        consoleReporter.printProgress(totalIndex, totalTests);
      }
      
      const result = await runSingleTest(state, groupName, testCase);
      state.testResults.push(result);
      
      // 检查是否需要停止
      if (!result.passed && state.config.behavior.stopOnFirstError) {
        console.log('\n⚠️  配置为在第一个错误时停止，终止测试运行');
        return;
      }
    }
  }
}

/**
 * 运行单个测试
 * @param {Object} state - 测试状态
 * @param {string} groupName - 测试组名
 * @param {Object} testCase - 测试用例
 * @returns {Promise<Object>} 测试结果
 */
async function runSingleTest(state, groupName, testCase) {
  consoleReporter.printTestStart(testCase);
  
  try {
    // 验证测试用例结构
    const validation = validateTestCase(testCase);
    if (!validation.valid) {
      throw new Error(`测试用例无效: ${validation.errors.join(', ')}`);
    }
    
    // 准备测试环境
    await setupTest(testCase.setup, state.config);
    
    // 处理请求参数
    const requestParams = prepareRequestParams(testCase.request.params);
    
    // 发送请求
    consoleReporter.printRequest({
      method: testCase.request.method,
      params: requestParams
    });
    
    const response = await state.sendRequest(
      testCase.request.method,
      requestParams
    );
    
    consoleReporter.printResponseReceived();
    
    // 验证响应
    const validationResult = await validateResponse(
      testCase,
      response,
      state.expectedResponses
    );
    
    // 构建测试结果
    const result = {
      group: groupName,
      test: testCase.name,
      file: testCase.filename,
      passed: validationResult.passed,
      errors: validationResult.errors,
      validation: validationResult,
      testCase: testCase
    };
    
    consoleReporter.printTestResult(result);
    
    // 不再在每个测试后清理，而是在所有测试完成后统一清理 temp 目录
    
    return result;
    
  } catch (error) {
    consoleReporter.printTestError(error);
    
    return {
      group: groupName,
      test: testCase.name,
      file: testCase.filename,
      passed: false,
      errors: [error.message],
      testCase: testCase
    };
  }
}

/**
 * 准备测试环境
 * @param {Object} setup - 设置配置
 * @param {Object} config - 测试配置
 */
async function setupTest(setup, config) {
  if (!setup) return;
  
  // 清理目录
  if (setup.cleanup) {
    const cleanupPaths = setup.cleanup.map(resolveTestPath);
    await cleanupDirectories(cleanupPaths);
  }
  
  // 复制测试夹具
  if (setup.fixtures && setup.target) {
    const fixturesRelativePath = setup.fixtures.replace('fixtures/', '');
    const targetPath = resolveTestPath(setup.target);
    
    // 使用配置中的夹具目录
    const fullFixturesPath = path.join(config.paths.fixtures, fixturesRelativePath);
      
    if (await exists(fullFixturesPath)) {
      await copyDirectory(fullFixturesPath, targetPath);
      
      if (config.debug.enabled) {
        console.log(`📁 复制夹具到: ${targetPath}`);
      }
    }
  }
}

/**
 * 清理测试环境
 * @param {Array<string>} cleanup - 要清理的路径
 */
async function cleanupTest(cleanup) {
  if (!cleanup || !Array.isArray(cleanup)) return;
  
  const cleanupPaths = cleanup.map(resolveTestPath);
  await cleanupDirectories(cleanupPaths);
}

/**
 * 准备请求参数
 * @param {Object} params - 原始参数
 * @returns {Object} 处理后的参数
 */
function prepareRequestParams(params) {
  const processed = { ...params };
  
  // 不转换路径参数，让 MCP 服务器使用相对路径
  // 这样可以确保文件创建在 MCP 服务器的工作目录中
  
  return processed;
}

/**
 * 生成报告
 * @param {Object} state - 测试状态
 */
async function generateReportsStep(state) {
  consoleReporter.printSummary(state.testResults);
  
  if (!state.config.reporting.generateMarkdown) {
    return;
  }
  
  // 生成报告路径
  const reportPaths = generateReportPaths(new Date().toISOString());
  
  // 生成主报告
  const { content, metadata } = generateReport(
    state.testResults,
    reportPaths.timestamp
  );
  
  await saveReport(content, reportPaths.mainReport);
  
  // 生成详细对比文件
  await generateDetailedComparisons(
    state.testResults,
    reportPaths.dir
  );
  
  consoleReporter.printReportGenerated(
    reportPaths.mainReport,
    reportPaths.dir
  );
  
  // 生成测试报告网页
  try {
    await generateTestReportWebUI(reportPaths.dir);
  } catch (error) {
    console.error('生成测试报告网页时出错:', error);
  }
}

/**
 * 生成详细对比文件
 * @param {Array} testResults - 测试结果
 * @param {string} reportDir - 报告目录
 */
async function generateDetailedComparisons(testResults, reportDir) {
  await Promise.all(
    testResults.map(async (result) => {
      const comparison = generateDetailedComparison(result);
      const filePath = generateComparisonFilePath(
        reportDir,
        result.group,
        result.file
      );
      await saveReport(comparison, filePath);
    })
  );
}

/**
 * 清理步骤
 * @param {Object} state - 测试状态
 */
async function cleanupStep(state) {
  if (state.server) {
    await stopServer(state.server);
  }
  
  // 如果配置为清理，则清理整个 temp 目录
  if (state.config.behavior.cleanupAfterRun) {
    const tempDir = getTempDir();
    await cleanupDirectories([tempDir]);
  }
}

/**
 * 生成测试摘要
 * @param {Array} testResults - 测试结果
 * @returns {Object} 摘要信息
 */
function generateSummary(testResults) {
  const total = testResults.length;
  const passed = testResults.filter(r => r.passed).length;
  const failed = total - passed;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
  
  return {
    total,
    passed,
    failed,
    passRate,
    byGroup: groupResultsByGroup(testResults)
  };
}

/**
 * 按组分类测试结果
 * @param {Array} testResults - 测试结果
 * @returns {Object} 分组统计
 */
function groupResultsByGroup(testResults) {
  const groups = {};
  
  for (const result of testResults) {
    if (!groups[result.group]) {
      groups[result.group] = {
        total: 0,
        passed: 0,
        failed: 0
      };
    }
    
    groups[result.group].total++;
    if (result.passed) {
      groups[result.group].passed++;
    } else {
      groups[result.group].failed++;
    }
  }
  
  return groups;
}

// 导出命令行接口
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const testGroup = args[0];
  
  runTests({ testGroup })
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('未处理的错误:', error);
      process.exit(1);
    });
}