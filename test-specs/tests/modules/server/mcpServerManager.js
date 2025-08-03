#!/usr/bin/env node

/**
 * MCP 服务器生命周期管理
 * 纯函数化的服务器管理，遵循单一职责原则
 */

import { spawn } from 'child_process';

/**
 * 启动 MCP 服务器
 * @param {Object} config - 服务器配置
 * @returns {Promise<{server: ChildProcess, messageHandler: MessageHandler}>}
 */
export async function startServer(config) {
  const { serverPath, serverCwd, initTimeout = 1000 } = config;
  
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: serverCwd
  });

  // 等待服务器启动
  await new Promise(resolve => setTimeout(resolve, initTimeout));
  
  // 创建消息处理器
  const messageHandler = createMessageHandler(server);
  
  return { server, messageHandler };
}

/**
 * 停止 MCP 服务器
 * @param {ChildProcess} server - 服务器进程
 * @returns {Promise<void>}
 */
export async function stopServer(server) {
  if (!server || server.killed) {
    return;
  }
  
  return new Promise((resolve) => {
    server.on('exit', () => resolve());
    server.kill();
    
    // 超时强制退出
    setTimeout(() => {
      if (!server.killed) {
        server.kill('SIGKILL');
      }
      resolve();
    }, 5000);
  });
}

/**
 * 初始化 MCP 连接
 * @param {Function} sendRequest - 发送请求的函数
 * @returns {Promise<Object>} 初始化响应
 */
export async function initializeConnection(sendRequest) {
  return sendRequest('initialize', {
    protocolVersion: '0.1.0',
    capabilities: {},
    clientInfo: {
      name: 'modular-test-runner',
      version: '1.0.0'
    }
  });
}

/**
 * 检查服务器是否就绪
 * @param {Object} initResponse - 初始化响应
 * @returns {boolean}
 */
export function isServerReady(initResponse) {
  return !!(initResponse && initResponse.result);
}

/**
 * 创建消息处理器
 * @param {ChildProcess} server - 服务器进程
 * @returns {Object} 消息处理器
 */
function createMessageHandler(server) {
  let buffer = '';
  const pendingRequests = new Map();
  
  // 处理服务器输出
  server.stdout.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const msg = JSON.parse(line);
          const pending = pendingRequests.get(msg.id);
          if (pending) {
            pending.resolve(msg);
            pendingRequests.delete(msg.id);
          }
        } catch (e) {
          // 忽略非 JSON 行
        }
      }
    }
  });
  
  return {
    pendingRequests,
    sendMessage: (message) => {
      server.stdin.write(JSON.stringify(message) + '\n');
    }
  };
}