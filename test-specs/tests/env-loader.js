import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 加载测试环境变量
 */
export function loadTestEnv() {
  const envPath = join(__dirname, '..', '.env.test');
  
  if (!existsSync(envPath)) {
    console.error('❌ 测试环境配置文件不存在:', envPath);
    console.error('请确保 .env.test 文件存在');
    process.exit(1);
  }
  
  try {
    const envContent = readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // 跳过空行和注释
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }
      
      // 解析环境变量
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      
      if (key && value !== undefined) {
        // 只设置未定义的环境变量，允许命令行覆盖
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
    
    // 验证必需的环境变量
    const required = [
      'TEST_ROOT_DIR',
      'PROJECT_ROOT_DIR',
      'MCP_SERVER_PATH',
      'TEST_WORK_DIR',
      'MCP_SERVER_CWD'
    ];
    
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      console.error('❌ 缺少必需的环境变量:', missing.join(', '));
      process.exit(1);
    }
    
    // 创建必要的目录
    const dirsToCreate = [
      process.env.TEST_TEMP_DIR,
      process.env.TEST_REPORTS_DIR
    ];
    
    // 这里只是加载环境变量，目录创建由测试运行器处理
    
  } catch (error) {
    console.error('❌ 加载环境变量失败:', error.message);
    process.exit(1);
  }
}

/**
 * 获取测试配置
 */
export function getTestConfig() {
  return {
    // 路径配置
    paths: {
      testRoot: process.env.TEST_ROOT_DIR,
      projectRoot: process.env.PROJECT_ROOT_DIR,
      mcpServer: process.env.MCP_SERVER_PATH,
      workDir: process.env.TEST_WORK_DIR,
      fixturesDir: process.env.TEST_FIXTURES_DIR,
      casesDir: process.env.TEST_CASES_DIR,
      reportsDir: process.env.TEST_REPORTS_DIR,
      tempDir: process.env.TEST_TEMP_DIR
    },
    
    // MCP 配置
    mcp: {
      serverCwd: process.env.MCP_SERVER_CWD,
      timeout: parseInt(process.env.MCP_SERVER_TIMEOUT || '10000'),
      protocolVersion: process.env.MCP_PROTOCOL_VERSION || '0.1.0'
    },
    
    // 测试行为
    behavior: {
      cleanupAfterRun: process.env.TEST_CLEANUP_AFTER_RUN === 'true',
      verboseMode: process.env.TEST_VERBOSE_MODE === 'true',
      parallelExecution: process.env.TEST_PARALLEL_EXECUTION === 'true',
      maxRetries: parseInt(process.env.TEST_MAX_RETRIES || '0')
    },
    
    // 报告配置
    report: {
      format: process.env.TEST_REPORT_FORMAT || 'markdown',
      includeDetails: process.env.TEST_REPORT_INCLUDE_DETAILS === 'true',
      timestampFormat: process.env.TEST_REPORT_TIMESTAMP_FORMAT || 'YYYY-MM-DD-HH-mm-ss'
    },
    
    // 调试配置
    debug: {
      enabled: process.env.TEST_DEBUG_MODE === 'true',
      logLevel: process.env.TEST_LOG_LEVEL || 'info',
      captureMcpLogs: process.env.TEST_CAPTURE_MCP_LOGS === 'true'
    },
    
    // 超时配置
    timeouts: {
      testCase: parseInt(process.env.TEST_CASE_TIMEOUT || '30000'),
      setup: parseInt(process.env.TEST_SETUP_TIMEOUT || '5000'),
      cleanup: parseInt(process.env.TEST_CLEANUP_TIMEOUT || '5000')
    }
  };
}

/**
 * 将相对路径转换为绝对路径
 * @param {string} relativePath - 相对路径
 * @returns {string} 绝对路径
 */
export function resolveTestPath(relativePath) {
  if (!relativePath) return relativePath;
  
  // 如果已经是绝对路径，直接返回
  if (relativePath.startsWith('/')) {
    return relativePath;
  }
  
  // 相对于测试工作目录解析
  return join(process.env.TEST_WORK_DIR, relativePath);
}