#!/usr/bin/env node

/**
 * 控制台报告器
 * 负责在控制台输出测试结果
 */

/**
 * 打印测试开始信息
 * @param {Object} testCase - 测试用例
 */
export function printTestStart(testCase) {
  console.log(`\n📋 测试: ${testCase.name}`);
  
  if (testCase.description) {
    console.log(`   ${testCase.description}`);
  }
  
  if (testCase.filename) {
    console.log(`   文件: ${testCase.filename}`);
  }
  
  console.log('-----------------------------------');
}

/**
 * 打印请求信息
 * @param {Object} request - 请求对象
 */
export function printRequest(request) {
  console.log('\n📤 发送请求:');
  console.log(`   方法: ${request.method}`);
  
  if (request.params?.name) {
    console.log(`   工具: ${request.params.name}`);
  }
  
  if (request.params?.arguments?.action?.type) {
    console.log(`   操作: ${request.params.arguments.action.type}`);
  }
}

/**
 * 打印响应接收信息
 */
export function printResponseReceived() {
  console.log('\n📥 收到响应');
}

/**
 * 打印测试结果
 * @param {Object} result - 测试结果
 */
export function printTestResult(result) {
  if (result.passed) {
    console.log('\n✅ 测试通过');
  } else {
    console.log('\n❌ 测试失败');
    
    if (result.errors && result.errors.length > 0) {
      result.errors.forEach(err => console.log(`   - ${err}`));
    }
  }
}

/**
 * 打印测试执行错误
 * @param {Error} error - 错误对象
 */
export function printTestError(error) {
  console.log('\n❌ 测试执行错误:', error.message);
}

/**
 * 打印测试摘要
 * @param {Array} testResults - 测试结果数组
 */
export function printSummary(testResults) {
  const passed = testResults.filter(r => r.passed).length;
  const total = testResults.length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 测试报告');
  console.log('='.repeat(50) + '\n');
  
  console.log(`总测试数: ${total}`);
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${total - passed}`);
  console.log(`📈 通过率: ${passRate}%`);
}

/**
 * 按组打印测试结果
 * @param {Object} groupedResults - 按组分类的测试结果
 */
export function printGroupedResults(groupedResults) {
  for (const [group, results] of Object.entries(groupedResults)) {
    console.log(`\n${group}:`);
    
    for (const result of results) {
      const icon = result.passed ? '✅' : '❌';
      console.log(`  ${icon} ${result.test} (${result.file})`);
      
      if (!result.passed && result.errors) {
        result.errors.forEach(err => console.log(`     - ${err}`));
      }
    }
  }
}

/**
 * 打印服务器启动信息
 * @param {Object} config - 配置对象
 */
export function printServerStarting(config) {
  console.log('🚀 启动 MCP 服务器...\n');
  
  if (config.debug?.enabled) {
    console.log('📍 MCP 服务器配置:');
    console.log(`   路径: ${config.paths.mcpServer}`);
    console.log(`   工作目录: ${config.mcp.serverCwd}`);
  }
}

/**
 * 打印服务器初始化成功
 */
export function printServerInitialized() {
  console.log('✅ MCP 连接初始化成功\n');
}

/**
 * 打印运行信息
 * @param {string} testGroup - 测试组名称
 */
export function printRunningInfo(testGroup) {
  console.log('🚀 运行模块化端到端测试');
  console.log('====================================');
  
  if (testGroup) {
    console.log(`\n指定测试组: ${testGroup}`);
  }
}

/**
 * 打印测试组开始
 * @param {string} groupName - 测试组名称
 * @param {number} testCount - 测试数量
 */
export function printGroupStart(groupName, testCount) {
  console.log(`\n🧪 运行测试组: ${groupName} (${testCount} 个测试)`);
  console.log('==================================');
}

/**
 * 打印报告生成信息
 * @param {string} reportPath - 报告路径
 * @param {string} reportDir - 报告目录
 */
export function printReportGenerated(reportPath, reportDir) {
  console.log(`\n📄 测试报告已生成: ${reportPath}`);
  console.log(`📁 详细对比文件位于: ${reportDir}/`);
}

/**
 * 创建进度条
 * @param {number} current - 当前进度
 * @param {number} total - 总数
 * @param {number} width - 进度条宽度
 * @returns {string} 进度条字符串
 */
export function createProgressBar(current, total, width = 30) {
  const percentage = total > 0 ? (current / total) : 0;
  const filled = Math.round(width * percentage);
  const empty = width - filled;
  
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const percentStr = `${(percentage * 100).toFixed(0)}%`;
  
  return `[${bar}] ${percentStr} (${current}/${total})`;
}

/**
 * 打印测试进度
 * @param {number} current - 当前测试索引
 * @param {number} total - 总测试数
 */
export function printProgress(current, total) {
  const progress = createProgressBar(current, total);
  console.log(`\n进度: ${progress}`);
}