/**
 * WebSocketClient 单元测试
 * 注意：这些测试需要 WebSocket 服务器运行，或者使用模拟
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { WebSocketClient } from '../src/services/websocket-client.js';
import { ConfigManager } from '../src/config/config-manager.js';

test('WebSocketClient - 创建客户端', () => {
  const config = new ConfigManager();
  const client = new WebSocketClient(config);
  
  assert.ok(client);
  assert.strictEqual(client.getState(), 'CLOSED');
});

test('WebSocketClient - 获取连接状态', () => {
  const config = new ConfigManager();
  const client = new WebSocketClient(config);
  
  const state = client.getState();
  assert.ok(['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'].includes(state));
});

test('WebSocketClient - 消息历史', () => {
  const config = new ConfigManager();
  const client = new WebSocketClient(config);
  
  const history = client.getMessageHistory();
  assert.ok(Array.isArray(history));
  assert.strictEqual(history.length, 0);
});

test('WebSocketClient - 清空消息历史', () => {
  const config = new ConfigManager();
  const client = new WebSocketClient(config);
  
  client.clearMessageHistory();
  const history = client.getMessageHistory();
  assert.strictEqual(history.length, 0);
});

test('WebSocketClient - 断开连接（未连接状态）', () => {
  const config = new ConfigManager();
  const client = new WebSocketClient(config);
  
  // 应该不会抛出错误
  assert.doesNotThrow(() => {
    client.disconnect();
  });
});

// 注意：实际的连接测试需要 WebSocket 服务器
// 这些测试可以在集成测试中完成
