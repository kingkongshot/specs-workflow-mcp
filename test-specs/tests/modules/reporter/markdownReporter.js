#!/usr/bin/env node

/**
 * Markdown 报告生成器
 * 负责生成 Markdown 格式的测试报告
 */

import { promises as fs } from 'fs';
import path from 'path';

/**
 * 生成测试报告
 * @param {Array} testResults - 测试结果数组
 * @param {string} timestamp - 时间戳
 * @returns {Object} 报告内容和元数据
 */
export function generateReport(testResults, timestamp = new Date().toISOString()) {
  const passed = testResults.filter(r => r.passed).length;
  const total = testResults.length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
  const status = passed === total ? '✅ PASSED' : '❌ FAILED';
  
  // 按组分类结果
  const groupedResults = groupTestResults(testResults);
  
  // 生成报告内容
  const content = generateReportContent({
    timestamp,
    status,
    passRate,
    total,
    passed,
    failed: total - passed,
    groupedResults
  });
  
  return {
    content,
    metadata: {
      timestamp,
      passed,
      total,
      passRate,
      groupedResults
    }
  };
}

/**
 * 生成报告内容
 * @param {Object} data - 报告数据
 * @returns {string} Markdown 内容
 */
function generateReportContent(data) {
  const {
    timestamp,
    status,
    passRate,
    total,
    passed,
    failed,
    groupedResults
  } = data;
  
  let content = `# Specs-MCP 测试报告

**生成时间**: ${new Date(timestamp).toLocaleString('zh-CN')}  
**测试状态**: ${status}  
**通过率**: ${passRate}%

## 📊 测试统计

- **总测试数**: ${total}
- **✅ 通过**: ${passed}
- **❌ 失败**: ${failed}

## 📋 测试结果详情

`;

  // 生成各组的详细结果
  for (const [group, results] of Object.entries(groupedResults)) {
    content += generateGroupSection(group, results);
  }
  
  content += generateFooter();
  
  return content;
}

/**
 * 生成测试组的报告部分
 * @param {string} group - 组名
 * @param {Array} results - 该组的测试结果
 * @returns {string} Markdown 内容
 */
function generateGroupSection(group, results) {
  let section = `### ${group}\n\n`;
  
  for (const result of results) {
    const icon = result.passed ? '✅' : '❌';
    const detailFile = `${group}-${result.file.replace('.yaml', '')}.md`;
    
    section += `- ${icon} **${result.test}**\n`;
    section += `  - 文件: \`${result.file}\`\n`;
    section += `  - 详细对比: [${detailFile}](${detailFile})\n`;
    
    if (!result.passed && result.errors) {
      section += `  - 错误概要:\n`;
      
      // 只显示前3个错误
      const errorSummary = result.errors.slice(0, 3);
      errorSummary.forEach(err => {
        section += `    - ${err}\n`;
      });
      
      if (result.errors.length > 3) {
        section += `    - ... (详见对比文件)\n`;
      }
    }
    
    section += '\n';
  }
  
  return section;
}

/**
 * 生成报告页脚
 * @returns {string} Markdown 内容
 */
function generateFooter() {
  return `## 🔧 测试配置

- **测试框架**: 基于 OpenAPI Schema 验证的端到端测试
- **验证方式**: JSON Schema 验证 (AJV)
- **单一真相源**: \`/api/spec-workflow.openapi.yaml\`

---
*报告由 specs-mcp 模块化测试运行器自动生成*
`;
}

/**
 * 生成详细的对比文件
 * @param {Object} testResult - 单个测试结果
 * @returns {string} Markdown 内容
 */
export function generateDetailedComparison(testResult) {
  const {
    test,
    file,
    passed,
    validation,
    testCase,
    errors
  } = testResult;
  
  if (!validation) {
    return generateErrorComparison(testResult);
  }
  
  const {
    actualResponse,
    expectedResponse,
    schemaValidation
  } = validation;
  
  return generateComparisonContent({
    test,
    file,
    passed,
    testCase,
    errors,
    actualResponse,
    expectedResponse,
    schemaValidation
  });
}

/**
 * 生成对比内容
 * @param {Object} data - 对比数据
 * @returns {string} Markdown 内容
 */
function generateComparisonContent(data) {
  const {
    test,
    file,
    passed,
    testCase,
    errors,
    actualResponse,
    expectedResponse,
    schemaValidation
  } = data;
  
  let content = `# ${test}

**测试文件**: \`${file}\`  
**测试结果**: ${passed ? '✅ 通过' : '❌ 失败'}  
**生成时间**: ${new Date().toLocaleString('zh-CN')}

## 📋 测试配置 (Test Configuration)

### 操作类型: ${testCase?.expect?.operation || 'unknown'}
`;

  // 添加测试配置信息
  content += generateTestConfigSection(testCase);
  
  // 添加失败原因
  if (!passed && errors && errors.length > 0) {
    content += generateFailureSection(errors);
  }
  
  // 添加响应对比
  content += generateResponseSection(actualResponse, expectedResponse);
  
  // 添加 Schema 验证结果
  content += generateSchemaValidationSection(schemaValidation);
  
  return content;
}

/**
 * 生成测试配置部分
 * @param {Object} testCase - 测试用例
 * @returns {string} Markdown 内容
 */
function generateTestConfigSection(testCase) {
  let section = '';
  
  // 错误检查配置
  if (testCase?.expect?.error) {
    section += `\n### 期望错误响应: 是\n`;
    
    if (testCase?.expect?.error_checks) {
      section += `\n**错误检查项:**\n`;
      testCase.expect.error_checks.forEach((check, index) => {
        section += formatCheckItem(check, index + 1);
      });
    }
  }
  
  // 额外检查配置
  if (testCase?.expect?.additional_checks) {
    section += `\n### 额外检查项:\n`;
    testCase.expect.additional_checks.forEach((check, index) => {
      section += formatCheckItem(check, index + 1);
    });
  }
  
  return section;
}

/**
 * 格式化检查项
 * @param {Object} check - 检查项
 * @param {number} index - 索引
 * @returns {string} 格式化的检查项
 */
function formatCheckItem(check, index) {
  let item = `${index}. ${check.description || check.type}\n`;
  item += `   - 类型: ${check.type}\n`;
  
  if (check.path) item += `   - 路径: ${check.path}\n`;
  if (check.value !== undefined) item += `   - 期望值: ${JSON.stringify(check.value)}\n`;
  if (check.contains) item += `   - 包含: "${check.contains}"\n`;
  if (check.min !== undefined) item += `   - 最小值: ${check.min}\n`;
  if (check.max !== undefined) item += `   - 最大值: ${check.max}\n`;
  
  return item;
}

/**
 * 生成失败原因部分
 * @param {Array} errors - 错误列表
 * @returns {string} Markdown 内容
 */
function generateFailureSection(errors) {
  let section = `
## ❌ 测试失败原因

`;
  
  errors.forEach((error, index) => {
    section += `${index + 1}. ${error}\n`;
  });
  
  return section;
}

/**
 * 生成响应对比部分
 * @param {Object} actualResponse - 实际响应
 * @param {Object} expectedResponse - 期望响应
 * @returns {string} Markdown 内容
 */
function generateResponseSection(actualResponse, expectedResponse) {
  return `
## 📥 实际响应 (Actual Response)

\`\`\`json
${JSON.stringify(actualResponse, null, 2)}
\`\`\`

## 📋 期望的响应格式 (Expected Response Schema)

\`\`\`json
${JSON.stringify(expectedResponse, null, 2)}
\`\`\`

## 🔍 结构化内容对比 (StructuredContent Comparison)

### 实际的 structuredContent:
\`\`\`json
${JSON.stringify(actualResponse?.structuredContent, null, 2)}
\`\`\`

### 期望的 structuredContent:
\`\`\`json
${JSON.stringify(expectedResponse, null, 2)}
\`\`\`

## 📝 显示文本内容 (Display Text)

### 实际的显示文本:
\`\`\`text
${actualResponse?.structuredContent?.displayText || actualResponse?.content?.[0]?.text || '(无显示文本)'}
\`\`\`

### 期望的显示文本格式:
\`\`\`text
${expectedResponse?.displayText || '(无期望文本)'}
\`\`\`
`;
}

/**
 * 生成 Schema 验证结果部分
 * @param {Object} schemaValidation - Schema 验证结果
 * @returns {string} Markdown 内容
 */
function generateSchemaValidationSection(schemaValidation) {
  let section = `
## ✅ Schema 验证结果

**验证状态**: ${schemaValidation?.passed ? '✅ 通过' : '❌ 失败'}

`;
  
  if (schemaValidation && !schemaValidation.passed) {
    section += `### 🚫 验证错误详情

`;
    schemaValidation.errors.forEach((error, index) => {
      section += formatSchemaError(error, index + 1);
    });
  }
  
  section += `## 📐 JSON Schema (用于验证)

\`\`\`json
${JSON.stringify(schemaValidation?.schema, null, 2)}
\`\`\`

---
*此文件由 specs-mcp 测试运行器自动生成*
`;
  
  return section;
}

/**
 * 格式化 Schema 错误
 * @param {Object} error - Schema 错误
 * @param {number} index - 索引
 * @returns {string} 格式化的错误信息
 */
function formatSchemaError(error, index) {
  return `**错误 ${index}:**
- **路径**: \`${error.instancePath || 'root'}\`
- **消息**: ${error.message}
- **期望**: ${error.schemaPath ? `\`${error.schemaPath}\`` : 'N/A'}
- **实际值**: \`${JSON.stringify(error.data)}\`

`;
}

/**
 * 生成错误对比（当没有验证信息时）
 * @param {Object} testResult - 测试结果
 * @returns {string} Markdown 内容
 */
function generateErrorComparison(testResult) {
  const { test, file, passed, errors } = testResult;
  
  return `# ${test}

**测试文件**: \`${file}\`  
**测试结果**: ${passed ? '✅ 通过' : '❌ 失败'}  
**生成时间**: ${new Date().toLocaleString('zh-CN')}

## ❌ 测试执行错误

${errors && errors.length > 0 ? errors.join('\n\n') : '未知错误'}

---
*此文件由 specs-mcp 测试运行器自动生成*
`;
}

/**
 * 保存报告到文件
 * @param {string} content - 报告内容
 * @param {string} filePath - 文件路径
 * @returns {Promise<void>}
 */
export async function saveReport(content, filePath) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * 按组分类测试结果
 * @param {Array} testResults - 测试结果数组
 * @returns {Object} 分组后的结果
 */
function groupTestResults(testResults) {
  const groups = {};
  
  for (const result of testResults) {
    if (!groups[result.group]) {
      groups[result.group] = [];
    }
    groups[result.group].push(result);
  }
  
  return groups;
}