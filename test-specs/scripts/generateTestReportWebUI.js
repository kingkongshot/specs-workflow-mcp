#!/usr/bin/env node
/**
 * Generate WebUI for test reports
 * Parse markdown test reports and create an HTML grid view
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse markdown file to extract test case information
function parseTestCaseMarkdown(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Extract title from first line
    const title = lines[0]?.replace(/^#\s+/, '') || 'Unknown Test';
    
    // Extract test file name
    const fileNameMatch = content.match(/\*\*测试文件\*\*:\s*`([^`]+)`/);
    const fileName = fileNameMatch?.[1] || path.basename(filePath);
    
    // Extract test result
    const resultMatch = content.match(/\*\*测试结果\*\*:\s*(✅ 通过|❌ 失败)/);
    const result = resultMatch?.[1]?.includes('通过') ? 'passed' : 'failed';
    
    // Extract timestamp
    const timestampMatch = content.match(/\*\*生成时间\*\*:\s*(.+)/);
    const timestamp = timestampMatch?.[1] || '';
    
    // Extract operation type
    const operationMatch = content.match(/### 操作类型:\s*(\w+)/);
    const operation = operationMatch?.[1] || 'unknown';
    
    // Extract error reasons if failed
    const errorReasons = [];
    if (result === 'failed') {
      const errorSection = content.match(/## ❌ 测试失败原因\n\n([\s\S]+?)(?=\n##|$)/);
      if (errorSection) {
        const reasons = errorSection[1].split(/\n\d+\.\s+/).filter(Boolean);
        errorReasons.push(...reasons.map(r => r.trim()));
      }
    }
    
    // Extract actual response
    let actualResponse = {};
    const actualResponseMatch = content.match(/## 📥 实际响应.*?\n\n```json\n([\s\S]+?)\n```/);
    if (actualResponseMatch) {
      try {
        actualResponse = JSON.parse(actualResponseMatch[1]);
      } catch (e) {
        // Keep empty object if parse fails
      }
    }
    
    // Extract expected response
    let expectedResponse = {};
    const expectedResponseMatch = content.match(/## 📋 期望的响应格式.*?\n\n```json\n([\s\S]+?)\n```/);
    if (expectedResponseMatch) {
      try {
        expectedResponse = JSON.parse(expectedResponseMatch[1]);
      } catch (e) {
        // Keep empty object if parse fails
      }
    }
    
    // Extract display text
    let displayText = '';
    
    // Find the start and end positions more reliably
    const displayTextStart = content.indexOf('### 实际的显示文本:\n```text\n');
    if (displayTextStart !== -1) {
      const startPos = displayTextStart + '### 实际的显示文本:\n```text\n'.length;
      const endMarker = '\n```\n\n### 期望的显示文本格式:';
      const endPos = content.indexOf(endMarker, startPos);
      
      if (endPos !== -1) {
        displayText = content.substring(startPos, endPos);
      } else {
        // Fallback: look for any ``` after the start
        const altEndPos = content.indexOf('\n```', startPos);
        if (altEndPos !== -1) {
          displayText = content.substring(startPos, altEndPos);
        }
      }
    }
    
    // Determine category from filename
    const category = path.basename(filePath).split('-')[0];
    
    return {
      id: path.basename(filePath, '.md'),
      title,
      fileName,
      category,
      operation,
      result,
      errorReasons,
      actualResponse,
      expectedResponse,
      displayText,
      timestamp
    };
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
    return null;
  }
}

// Parse test report summary
function parseTestReportSummary(reportPath) {
  try {
    const content = fs.readFileSync(reportPath, 'utf8');
    
    const totalMatch = content.match(/总测试数:\s*(\d+)/);
    const passedMatch = content.match(/✅ 通过:\s*(\d+)/);
    const failedMatch = content.match(/❌ 失败:\s*(\d+)/);
    const passRateMatch = content.match(/📈 通过率:\s*([\d.]+)%/);
    
    return {
      totalTests: parseInt(totalMatch?.[1] || '0'),
      passedTests: parseInt(passedMatch?.[1] || '0'),
      failedTests: parseInt(failedMatch?.[1] || '0'),
      passRate: parseFloat(passRateMatch?.[1] || '0')
    };
  } catch (error) {
    console.error('Error parsing test report summary:', error);
    return {};
  }
}

// Generate HTML for test report
function generateHTML(report) {
  // Group test cases by category
  const categorizedTests = report.testCases.reduce((acc, test) => {
    if (!acc[test.category]) {
      acc[test.category] = [];
    }
    acc[test.category].push(test);
    return acc;
  }, {});
  
  // Generate test case cards
  const testCards = Object.entries(categorizedTests).map(([category, tests]) => `
    <div class="category-section">
      <h2 class="category-title">${category.toUpperCase()} Tests (${tests.length})</h2>
      <div class="grid">
        ${tests.map(test => `
          <div class="test-card ${test.result}">
            <div class="test-header">
              <h3>${test.title}</h3>
              <span class="test-result ${test.result}">${test.result === 'passed' ? '✅ 通过' : '❌ 失败'}</span>
            </div>
            
            <div class="test-info">
              <div class="info-item">
                <span class="label">测试文件:</span> <code>${test.fileName}</code>
              </div>
              <div class="info-item">
                <span class="label">操作类型:</span> <code>${test.operation}</code>
              </div>
            </div>
            
            ${test.errorReasons.length > 0 ? `
            <div class="error-section">
              <h4>失败原因:</h4>
              <ul class="error-list">
                ${test.errorReasons.map(reason => `<li>${reason}</li>`).join('')}
              </ul>
            </div>
            ` : ''}
            
            <details class="response-details" open>
              <summary>响应详情</summary>
              
              <div class="response-section">
                <h4>实际响应 (JSON 数据结构):</h4>
                <p class="section-description">MCP 工具返回的完整 JSON 响应，包含结构化数据</p>
                <pre class="response-content">${JSON.stringify(test.actualResponse, null, 2)}</pre>
              </div>
              
              ${test.displayText ? `
              <div class="display-text-section">
                <h4>显示文本 (用户看到的内容):</h4>
                <p class="section-description">从响应中提取的人类可读文本，即 content[0].text 的内容</p>
                <pre class="display-text">${test.displayText}</pre>
              </div>
              ` : ''}
            </details>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Specs-MCP 测试报告 - ${report.timestamp}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            background: #f6f8fa;
            color: #24292e;
            line-height: 1.6;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        h1 {
            text-align: center;
            font-size: 2.5em;
            margin-bottom: 10px;
            color: #0366d6;
        }
        
        .subtitle {
            text-align: center;
            color: #586069;
            margin-bottom: 30px;
            font-size: 1.1em;
        }
        
        .summary-box {
            background: white;
            border: 1px solid #e1e4e8;
            border-radius: 8px;
            padding: 30px;
            margin-bottom: 40px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 30px;
            text-align: center;
        }
        
        .stat-item {
            padding: 20px;
            background: #f6f8fa;
            border-radius: 8px;
        }
        
        .stat-number {
            font-size: 3em;
            font-weight: bold;
            display: block;
            margin-bottom: 5px;
        }
        
        .stat-number.total { color: #0366d6; }
        .stat-number.passed { color: #28a745; }
        .stat-number.failed { color: #dc3545; }
        .stat-number.rate { color: #6f42c1; }
        
        .stat-label {
            color: #586069;
            font-size: 1em;
        }
        
        .category-section {
            margin-bottom: 50px;
        }
        
        .category-title {
            font-size: 1.8em;
            color: #24292e;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e1e4e8;
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .test-card {
            background: white;
            border: 1px solid #e1e4e8;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            transition: all 0.3s ease;
        }
        
        .test-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            transform: translateY(-2px);
        }
        
        .test-card.passed {
            border-left: 4px solid #28a745;
        }
        
        .test-card.failed {
            border-left: 4px solid #dc3545;
        }
        
        .test-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
        }
        
        .test-header h3 {
            color: #24292e;
            font-size: 1.2em;
            flex: 1;
            margin-right: 10px;
        }
        
        .test-result {
            font-size: 0.9em;
            font-weight: bold;
            white-space: nowrap;
        }
        
        .test-result.passed { color: #28a745; }
        .test-result.failed { color: #dc3545; }
        
        .test-info {
            margin-bottom: 15px;
        }
        
        .info-item {
            margin-bottom: 5px;
            font-size: 0.9em;
        }
        
        .label {
            color: #586069;
            font-weight: 500;
        }
        
        code {
            background: #f3f4f6;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
            font-size: 0.85em;
        }
        
        .error-section {
            background: #fff5f5;
            border: 1px solid #feb2b2;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 15px;
        }
        
        .error-section h4 {
            color: #c53030;
            font-size: 1em;
            margin-bottom: 10px;
        }
        
        .error-list {
            list-style: none;
            padding-left: 0;
        }
        
        .error-list li {
            color: #742a2a;
            font-size: 0.9em;
            margin-bottom: 5px;
            padding-left: 20px;
            position: relative;
        }
        
        .error-list li:before {
            content: "•";
            position: absolute;
            left: 5px;
            color: #dc3545;
        }
        
        .response-details {
            margin-top: 15px;
            border-top: 1px solid #e1e4e8;
            padding-top: 15px;
        }
        
        .response-details summary {
            cursor: pointer;
            color: #0366d6;
            font-weight: 500;
            font-size: 0.95em;
            padding: 5px 0;
        }
        
        .response-details summary:hover {
            text-decoration: underline;
        }
        
        .response-section, .display-text-section {
            margin-top: 15px;
        }
        
        .response-section h4, .display-text-section h4 {
            color: #24292e;
            font-size: 0.95em;
            margin-bottom: 4px;
        }
        
        .section-description {
            color: #586069;
            font-size: 0.85em;
            margin-bottom: 10px;
            font-style: italic;
        }
        
        pre {
            background: #f6f8fa;
            border: 1px solid #e1e4e8;
            border-radius: 6px;
            padding: 12px;
            overflow-x: auto;
            font-size: 0.85em;
            font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        
        .response-content {
            max-height: 400px;
            overflow-y: auto;
            overflow-x: auto;
            white-space: pre;
        }
        
        .display-text {
            background: #f0f9ff;
            border-color: #bae6fd;
            white-space: pre-wrap;
        }
        
        .timestamp {
            text-align: center;
            color: #586069;
            font-size: 0.9em;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e1e4e8;
        }
        
        @media (max-width: 768px) {
            .grid {
                grid-template-columns: 1fr;
            }
            
            .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Specs-MCP 测试报告</h1>
        <p class="subtitle">生成时间：${report.timestamp}</p>
        
        <div class="summary-box">
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-number total">${report.totalTests}</span>
                    <span class="stat-label">总测试数</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number passed">${report.passedTests}</span>
                    <span class="stat-label">通过</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number failed">${report.failedTests}</span>
                    <span class="stat-label">失败</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number rate">${report.passRate.toFixed(1)}%</span>
                    <span class="stat-label">通过率</span>
                </div>
            </div>
        </div>
        
        ${testCards}
        
        <div class="timestamp">
            报告生成于 ${new Date().toLocaleString('zh-CN')}
        </div>
    </div>
</body>
</html>`;
}

// Main function
export function generateTestReportWebUI(reportDir) {
  console.log('🔍 解析测试报告目录:', reportDir);
  
  if (!fs.existsSync(reportDir)) {
    console.error('❌ 报告目录不存在:', reportDir);
    return;
  }
  
  // Parse test report summary
  const summaryPath = path.join(reportDir, 'test-report.md');
  const summary = parseTestReportSummary(summaryPath);
  
  // Get all test case files
  const files = fs.readdirSync(reportDir)
    .filter(f => f.endsWith('.md') && f !== 'test-report.md')
    .sort();
  
  // Parse all test cases
  const testCases = [];
  for (const file of files) {
    const testCase = parseTestCaseMarkdown(path.join(reportDir, file));
    if (testCase) {
      testCases.push(testCase);
    }
  }
  
  console.log(`✅ 解析了 ${testCases.length} 个测试用例`);
  
  // Create test report object
  const report = {
    timestamp: path.basename(reportDir).replace('test-', ''),
    totalTests: summary.totalTests || testCases.length,
    passedTests: summary.passedTests || testCases.filter(t => t.result === 'passed').length,
    failedTests: summary.failedTests || testCases.filter(t => t.result === 'failed').length,
    passRate: summary.passRate || 0,
    testCases
  };
  
  // Generate HTML
  const html = generateHTML(report);
  
  // Write HTML file
  const outputPath = path.join(reportDir, 'test-report.html');
  fs.writeFileSync(outputPath, html, 'utf8');
  
  console.log('✅ 测试报告网页已生成:', outputPath);
  console.log('🚀 在浏览器中打开查看详细测试结果');
}

// CLI support
if (import.meta.url === `file://${process.argv[1]}`) {
  const reportDir = process.argv[2];
  if (!reportDir) {
    console.error('用法: tsx generateTestReportWebUI.ts <报告目录>');
    process.exit(1);
  }
  generateTestReportWebUI(reportDir);
}