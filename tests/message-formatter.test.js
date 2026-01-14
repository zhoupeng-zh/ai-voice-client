/**
 * MessageFormatter 单元测试
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { MessageFormatter } from '../src/utils/message-formatter.js';

test('MessageFormatter - JSON 格式化', () => {
  const formatter = new MessageFormatter();
  
  const data = { message: 'test', count: 123 };
  const result = formatter.format(data, 'json');
  const parsed = JSON.parse(result);
  
  assert.strictEqual(parsed.message, 'test');
  assert.strictEqual(parsed.count, 123);
});

test('MessageFormatter - 文本格式化', () => {
  const formatter = new MessageFormatter();
  
  const result = formatter.format('hello world', 'text');
  assert.strictEqual(result, 'hello world');
});

test('MessageFormatter - 二进制格式化', () => {
  const formatter = new MessageFormatter();
  
  const result = formatter.format('test', 'binary');
  assert.ok(Buffer.isBuffer(result));
  assert.strictEqual(result.toString('utf8'), 'test');
});

test('MessageFormatter - JSON 解析', () => {
  const formatter = new MessageFormatter();
  
  const jsonStr = '{"key":"value"}';
  const parsed = formatter.parse(jsonStr, 'json');
  
  assert.strictEqual(parsed.key, 'value');
});

test('MessageFormatter - 文本解析', () => {
  const formatter = new MessageFormatter();
  
  const result = formatter.parse('hello', 'text');
  assert.strictEqual(result, 'hello');
});

test('MessageFormatter - 自定义格式化函数', () => {
  const formatter = new MessageFormatter();
  
  formatter.setCustomFormatter((data) => {
    return `CUSTOM:${JSON.stringify(data)}`;
  });
  
  const result = formatter.format({ test: 123 }, 'custom');
  assert.ok(result.startsWith('CUSTOM:'));
});

test('MessageFormatter - 自定义格式化函数错误处理', () => {
  const formatter = new MessageFormatter();
  
  assert.throws(() => {
    formatter.setCustomFormatter('not a function');
  }, /必须是一个函数/);
});

test('MessageFormatter - 格式化显示', () => {
  const formatter = new MessageFormatter();
  
  const message = {
    data: 'test message',
    isBinary: false,
    timestamp: Date.now(),
    type: 'sent'
  };
  
  const display = formatter.formatForDisplay(message, 'text');
  assert.ok(display.includes('test message'));
  assert.ok(display.includes('发送'));
});
