/**
 * 文件处理器
 * 处理文件读取、Base64 编码、文件信息提取等
 */

import fs from 'fs/promises';
import path from 'path';

export class FileHandler {
  constructor(maxFileSize = 10485760) {
    this.maxFileSize = maxFileSize; // 默认 10MB
  }

  /**
   * 读取文件并转换为 Base64
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object>} { data: string, info: Object }
   */
  async readFileAsBase64(filePath) {
    try {
      const stats = await fs.stat(filePath);
      if (stats.size > this.maxFileSize) {
        throw new Error(`文件大小超过限制: ${stats.size} 字节 (最大: ${this.maxFileSize} 字节)`);
      }

      const buffer = await fs.readFile(filePath);
      const base64 = buffer.toString('base64');
      const ext = path.extname(filePath).toLowerCase();
      const name = path.basename(filePath);

      return {
        data: base64,
        info: {
          name,
          size: stats.size,
          type: this.getMimeType(ext),
          extension: ext,
          lastModified: stats.mtime
        }
      };
    } catch (error) {
      throw new Error(`读取文件失败: ${error.message}`);
    }
  }

  /**
   * 读取文件为 Buffer
   * @param {string} filePath - 文件路径
   * @returns {Promise<Buffer>} 文件 Buffer
   */
  async readFileAsBuffer(filePath) {
    try {
      const stats = await fs.stat(filePath);
      if (stats.size > this.maxFileSize) {
        throw new Error(`文件大小超过限制: ${stats.size} 字节 (最大: ${this.maxFileSize} 字节)`);
      }

      return await fs.readFile(filePath);
    } catch (error) {
      throw new Error(`读取文件失败: ${error.message}`);
    }
  }

  /**
   * 获取文件信息
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object>} 文件信息对象
   */
  async getFileInfo(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const name = path.basename(filePath);

      return {
        name,
        size: stats.size,
        type: this.getMimeType(ext),
        extension: ext,
        lastModified: stats.mtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      };
    } catch (error) {
      throw new Error(`获取文件信息失败: ${error.message}`);
    }
  }

  /**
   * 根据扩展名获取 MIME 类型
   * @param {string} ext - 文件扩展名
   * @returns {string} MIME 类型
   */
  getMimeType(ext) {
    const mimeTypes = {
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.zip': 'application/zip',
      '.mp3': 'audio/mpeg',
      '.mp4': 'video/mp4',
      '.wav': 'audio/wav'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * 验证文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object>} { valid: boolean, error?: string }
   */
  async validateFile(filePath) {
    try {
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        return { valid: false, error: '路径不是文件' };
      }
      if (stats.size > this.maxFileSize) {
        return {
          valid: false,
          error: `文件大小超过限制: ${stats.size} 字节 (最大: ${this.maxFileSize} 字节)`
        };
      }
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * 将 Base64 数据转换为 Buffer
   * @param {string} base64 - Base64 字符串
   * @returns {Buffer} Buffer 对象
   */
  base64ToBuffer(base64) {
    try {
      return Buffer.from(base64, 'base64');
    } catch (error) {
      throw new Error(`Base64 转换失败: ${error.message}`);
    }
  }

  /**
   * 将 Buffer 转换为 Base64
   * @param {Buffer} buffer - Buffer 对象
   * @returns {string} Base64 字符串
   */
  bufferToBase64(buffer) {
    try {
      return buffer.toString('base64');
    } catch (error) {
      throw new Error(`Base64 编码失败: ${error.message}`);
    }
  }
}
