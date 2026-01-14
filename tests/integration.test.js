/**
 * 集成测试
 * 测试整个系统的集成功能
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { WebSocketController } from '../src/controllers/websocket-controller.js';
import { MessageFormatter } from '../src/utils/message-formatter.js';
import { FileHandler } from '../src/utils/file-handler.js';

test('集成测试 - WebSocketController 初始化', () => {
  const controller = new WebSocketController();
  
  const status = controller.getStatus();
  assert.ok(status);
  assert.ok(status.state);
  assert.ok(status.config);
});

test('集成测试 - 配置更新和验证', async () => {
  const controller = new WebSocketController();
  controller.configManager.setAutoSave(false); // 测试时禁用自动保存
  
  const result = await controller.updateConfig({
    url: 'ws://test.example.com',
    heartbeatInterval: 20000
  });
  
  assert.strictEqual(result.success, true);
  
  const status = controller.getStatus();
  const config = status.config;
  assert.strictEqual(config.url, 'ws://test.example.com');
  assert.strictEqual(config.heartbeatInterval, 20000);
});

test('集成测试 - 消息格式化集成', () => {
  const controller = new WebSocketController();
  const formatter = new MessageFormatter();
  
  const data = { message: 'test', id: 1 };
  const formatted = formatter.format(data, 'json');
  const parsed = formatter.parse(formatted, 'json');
  
  assert.strictEqual(parsed.message, 'test');
  assert.strictEqual(parsed.id, 1);
});

test('集成测试 - 文件处理集成', async () => {
  const handler = new FileHandler();
  const formatter = new MessageFormatter();
  
  // 创建测试文件
  const testContent = 'test file content';
  const testBuffer = Buffer.from(testContent, 'utf8');
  const base64 = handler.bufferToBase64(testBuffer);
  
  // 格式化包含文件的消息
  const messageData = {
    type: 'file',
    file: {
      name: 'test.txt',
      data: base64
    }
  };
  
  const formatted = formatter.format(messageData, 'json');
  const parsed = formatter.parse(formatted, 'json');
  
  assert.strictEqual(parsed.type, 'file');
  assert.strictEqual(parsed.file.name, 'test.txt');
  assert.ok(parsed.file.data);
});

test('集成测试 - 消息历史管理', () => {
  const controller = new WebSocketController();
  
  // 获取初始消息
  const initialMessages = controller.getMessages();
  assert.ok(Array.isArray(initialMessages));
  
  // 清空消息
  const clearResult = controller.clearMessages();
  assert.strictEqual(clearResult.success, true);
  
  const afterClear = controller.getMessages();
  assert.strictEqual(afterClear.length, 0);
});

// 注意：实际的 WebSocket 连接测试需要运行中的服务器
// 这些可以在手动测试或 E2E 测试中完成
