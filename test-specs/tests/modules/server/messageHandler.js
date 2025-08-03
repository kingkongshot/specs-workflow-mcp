#!/usr/bin/env node

/**
 * 消息通信处理
 * 纯函数化的消息处理，负责请求/响应的创建和解析
 */

/**
 * 创建请求消息
 * @param {string} method - 方法名
 * @param {Object} params - 参数
 * @param {number} id - 消息 ID
 * @returns {Object} JSON-RPC 请求对象
 */
export function createRequest(method, params, id) {
  return {
    jsonrpc: '2.0',
    method,
    params,
    id
  };
}

/**
 * 发送请求并等待响应
 * @param {Object} messageHandler - 消息处理器
 * @param {string} method - 方法名
 * @param {Object} params - 参数
 * @param {Function} idGenerator - ID 生成器函数
 * @returns {Promise<Object>} 响应对象
 */
export function sendRequest(messageHandler, method, params, idGenerator) {
  return new Promise((resolve) => {
    const id = idGenerator();
    const request = createRequest(method, params, id);
    
    // 注册待处理请求
    messageHandler.pendingRequests.set(id, { resolve });
    
    // 发送请求
    messageHandler.sendMessage(request);
  });
}

/**
 * 解析消息
 * @param {string} data - 原始数据
 * @returns {Object|null} 解析后的消息或 null
 */
export function parseMessage(data) {
  try {
    const trimmed = data.trim();
    if (!trimmed) return null;
    
    return JSON.parse(trimmed);
  } catch (e) {
    return null;
  }
}

/**
 * 创建 ID 生成器
 * @param {number} initialId - 初始 ID
 * @returns {Function} ID 生成器函数
 */
export function createIdGenerator(initialId = 1) {
  let currentId = initialId;
  return () => currentId++;
}

/**
 * 判断是否为错误响应
 * @param {Object} response - 响应对象
 * @returns {boolean}
 */
export function isErrorResponse(response) {
  return !!(response && (response.error || response.result?.isError));
}

/**
 * 提取响应内容
 * @param {Object} response - 响应对象
 * @returns {Object} 响应内容
 */
export function extractResponseContent(response) {
  if (!response) return null;
  
  if (response.error) {
    return {
      isError: true,
      error: response.error,
      content: null
    };
  }
  
  if (response.result) {
    return {
      isError: response.result.isError || false,
      content: response.result.structuredContent || null,
      raw: response.result
    };
  }
  
  return null;
}