/**
 * ConfigStorage 单元测试
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadConfig, saveConfig, deleteConfig, getConfigPath } from '../src/utils/config-storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testConfigFile = path.join(__dirname, '../config.json');

// 测试后清理
test.after(async () => {
  try {
    await deleteConfig();
  } catch (error) {
    // 忽略错误
  }
});

test('ConfigStorage - 保存和加载配置', async () => {
  const testConfig = {
    url: 'ws://test.example.com',
    heartbeatInterval: 20000,
    heartbeatMessage: 'test-ping'
  };

  // 保存配置
  const saveResult = await saveConfig(testConfig);
  assert.strictEqual(saveResult, true);

  // 加载配置
  const loadedConfig = await loadConfig();
  assert.ok(loadedConfig);
  assert.strictEqual(loadedConfig.url, testConfig.url);
  assert.strictEqual(loadedConfig.heartbeatInterval, testConfig.heartbeatInterval);
  assert.strictEqual(loadedConfig.heartbeatMessage, testConfig.heartbeatMessage);
});

test('ConfigStorage - 加载不存在的配置', async () => {
  // 确保文件不存在
  await deleteConfig();

  const loadedConfig = await loadConfig();
  assert.strictEqual(loadedConfig, null);
});

test('ConfigStorage - 删除配置', async () => {
  // 先保存一个配置
  await saveConfig({ url: 'ws://test.com' });

  // 删除配置
  const deleteResult = await deleteConfig();
  assert.strictEqual(deleteResult, true);

  // 验证文件已删除
  const loadedConfig = await loadConfig();
  assert.strictEqual(loadedConfig, null);
});

test('ConfigStorage - 获取配置文件路径', () => {
  const configPath = getConfigPath();
  assert.ok(configPath);
  assert.ok(configPath.endsWith('config.json'));
});
