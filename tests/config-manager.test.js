/**
 * ConfigManager 单元测试
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { ConfigManager } from '../src/config/config-manager.js';

test('ConfigManager - 初始化配置', () => {
  const manager = new ConfigManager();
  const config = manager.getConfig();
  
  assert.ok(config.url);
  assert.ok(typeof config.heartbeatInterval === 'number');
  assert.ok(typeof config.idleTimeout === 'number');
  assert.ok(Array.isArray(Object.keys(config.headers)));
});

test('ConfigManager - 更新配置', async () => {
  const manager = new ConfigManager();
  manager.setAutoSave(false); // 测试时禁用自动保存
  
  await manager.updateConfig({
    url: 'ws://test.com',
    heartbeatInterval: 5000
  }, false); // 不保存到文件
  
  const config = manager.getConfig();
  assert.strictEqual(config.url, 'ws://test.com');
  assert.strictEqual(config.heartbeatInterval, 5000);
});

test('ConfigManager - 更新请求头', async () => {
  const manager = new ConfigManager();
  manager.setAutoSave(false);
  
  await manager.updateConfig({
    headers: { 'Authorization': 'Bearer token123' }
  }, false);
  
  const config = manager.getConfig();
  assert.strictEqual(config.headers.Authorization, 'Bearer token123');
});

test('ConfigManager - 配置验证 - 有效配置', async () => {
  const manager = new ConfigManager();
  manager.setAutoSave(false);
  
  await manager.updateConfig({
    url: 'ws://localhost:8080',
    heartbeatInterval: 30000,
    idleTimeout: 300000
  }, false);
  
  const validation = manager.validateConfig();
  assert.strictEqual(validation.valid, true);
  assert.strictEqual(validation.errors.length, 0);
});

test('ConfigManager - 配置验证 - 无效配置', async () => {
  const manager = new ConfigManager();
  manager.setAutoSave(false);
  
  await manager.updateConfig({
    url: '',
    heartbeatInterval: 500
  }, false);
  
  const validation = manager.validateConfig();
  assert.strictEqual(validation.valid, false);
  assert.ok(validation.errors.length > 0);
});

test('ConfigManager - 重置配置', () => {
  const manager = new ConfigManager();
  manager.updateConfig({
    url: 'ws://test.com',
    heartbeatInterval: 10000
  });
  
  manager.resetConfig();
  const config = manager.getConfig();
  assert.notStrictEqual(config.url, 'ws://test.com');
});

test('ConfigManager - 心跳消息配置', async () => {
  const manager = new ConfigManager();
  manager.setAutoSave(false);
  
  await manager.updateConfig({
    heartbeatType: 'message',
    heartbeatMessage: '{"type": "ping"}'
  }, false);
  
  const config = manager.getConfig();
  assert.strictEqual(config.heartbeatType, 'message');
  assert.strictEqual(config.heartbeatMessage, '{"type": "ping"}');
});

test('ConfigManager - 心跳类型配置', async () => {
  const manager = new ConfigManager();
  manager.setAutoSave(false);
  
  await manager.updateConfig({
    heartbeatType: 'ping'
  }, false);
  
  const config = manager.getConfig();
  assert.strictEqual(config.heartbeatType, 'ping');
});

test('ConfigManager - URL 参数配置', async () => {
  const manager = new ConfigManager();
  manager.setAutoSave(false);
  
  await manager.updateConfig({
    urlParams: [{ key: 'token', value: 'abc123' }, { key: 'version', value: '1.0' }]
  }, false);
  
  const config = manager.getConfig();
  assert.ok(Array.isArray(config.urlParams));
  assert.strictEqual(config.urlParams.length, 2);
  assert.strictEqual(config.urlParams[0].key, 'token');
  assert.strictEqual(config.urlParams[0].value, 'abc123');
});

test('ConfigManager - 默认心跳消息为 ping', () => {
  const manager = new ConfigManager();
  const config = manager.getConfig();
  
  assert.strictEqual(config.heartbeatMessage, 'ping');
  assert.strictEqual(config.heartbeatType, 'message');
});
