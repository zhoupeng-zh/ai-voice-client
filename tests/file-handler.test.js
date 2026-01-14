/**
 * FileHandler 单元测试
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { FileHandler } from '../src/utils/file-handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDir = path.join(__dirname, 'temp');

// 确保测试目录存在
async function ensureTestDir() {
  try {
    await fs.mkdir(testDir, { recursive: true });
  } catch (error) {
    // 目录可能已存在
  }
}

// 清理测试文件
async function cleanupTestFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // 忽略错误
  }
}

test('FileHandler - 获取 MIME 类型', () => {
  const handler = new FileHandler();
  
  assert.strictEqual(handler.getMimeType('.txt'), 'text/plain');
  assert.strictEqual(handler.getMimeType('.json'), 'application/json');
  assert.strictEqual(handler.getMimeType('.png'), 'image/png');
  assert.strictEqual(handler.getMimeType('.unknown'), 'application/octet-stream');
});

test('FileHandler - Base64 转换', () => {
  const handler = new FileHandler();
  
  const text = 'hello world';
  const buffer = Buffer.from(text, 'utf8');
  const base64 = handler.bufferToBase64(buffer);
  const decoded = handler.base64ToBuffer(base64);
  
  assert.strictEqual(decoded.toString('utf8'), text);
});

test('FileHandler - 读取文件为 Base64', async () => {
  await ensureTestDir();
  const handler = new FileHandler();
  const testFile = path.join(testDir, 'test.txt');
  const testContent = 'test content';
  
  await fs.writeFile(testFile, testContent, 'utf8');
  
  const result = await handler.readFileAsBase64(testFile);
  
  assert.ok(result.data);
  assert.ok(result.info);
  assert.strictEqual(result.info.name, 'test.txt');
  assert.ok(result.info.size > 0);
  
  await cleanupTestFile(testFile);
});

test('FileHandler - 读取文件为 Buffer', async () => {
  await ensureTestDir();
  const handler = new FileHandler();
  const testFile = path.join(testDir, 'test.bin');
  const testContent = Buffer.from([1, 2, 3, 4, 5]);
  
  await fs.writeFile(testFile, testContent);
  
  const result = await handler.readFileAsBuffer(testFile);
  
  assert.ok(Buffer.isBuffer(result));
  assert.strictEqual(result.length, testContent.length);
  
  await cleanupTestFile(testFile);
});

test('FileHandler - 获取文件信息', async () => {
  await ensureTestDir();
  const handler = new FileHandler();
  const testFile = path.join(testDir, 'info.txt');
  const testContent = 'test';
  
  await fs.writeFile(testFile, testContent, 'utf8');
  
  const info = await handler.getFileInfo(testFile);
  
  assert.strictEqual(info.name, 'info.txt');
  assert.ok(info.size > 0);
  assert.strictEqual(info.isFile, true);
  assert.strictEqual(info.isDirectory, false);
  
  await cleanupTestFile(testFile);
});

test('FileHandler - 验证文件', async () => {
  await ensureTestDir();
  const handler = new FileHandler(100); // 100 字节限制
  const testFile = path.join(testDir, 'small.txt');
  
  await fs.writeFile(testFile, 'small', 'utf8');
  
  const validation = await handler.validateFile(testFile);
  assert.strictEqual(validation.valid, true);
  
  await cleanupTestFile(testFile);
});

test('FileHandler - 文件大小限制', async () => {
  await ensureTestDir();
  const handler = new FileHandler(10); // 10 字节限制
  const testFile = path.join(testDir, 'large.txt');
  
  await fs.writeFile(testFile, 'this is a large file content', 'utf8');
  
  const validation = await handler.validateFile(testFile);
  assert.strictEqual(validation.valid, false);
  assert.ok(validation.error.includes('超过限制'));
  
  await cleanupTestFile(testFile);
});
