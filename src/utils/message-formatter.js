/**
 * 消息格式化器
 * 支持多种消息格式：JSON、文本、二进制等，支持自定义格式化函数
 */

export class MessageFormatter {
  constructor() {
    this.formatters = {
      json: this.formatJson.bind(this),
      text: this.formatText.bind(this),
      binary: this.formatBinary.bind(this),
      custom: null
    };
  }

  /**
   * JSON 格式格式化
   * @param {Object} data - 要格式化的数据
   * @returns {string} 格式化后的 JSON 字符串
   */
  formatJson(data) {
    try {
      if (typeof data === 'string') {
        // 尝试解析为 JSON，如果失败则作为普通文本处理
        try {
          const parsed = JSON.parse(data);
          return JSON.stringify(parsed);
        } catch {
          return JSON.stringify({ message: data });
        }
      }
      return JSON.stringify(data);
    } catch (error) {
      throw new Error(`JSON 格式化失败: ${error.message}`);
    }
  }

  /**
   * 文本格式格式化
   * @param {string} data - 要格式化的文本
   * @returns {string} 格式化后的文本
   */
  formatText(data) {
    if (typeof data !== 'string') {
      return String(data);
    }
    return data;
  }

  /**
   * 二进制格式格式化
   * @param {Buffer|string} data - 要格式化的数据
   * @returns {Buffer} 格式化后的 Buffer
   */
  formatBinary(data) {
    if (Buffer.isBuffer(data)) {
      return data;
    }
    if (typeof data === 'string') {
      // 尝试检测是否为 Base64 编码的字符串
      // Base64 字符串通常只包含 A-Z, a-z, 0-9, +, /, = 字符，且长度是4的倍数
      // 为了减少误判，要求长度至少为 8 个字符，或者包含 Base64 特有的字符（+ 或 /）
      const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
      const hasBase64Chars = /[+/]/.test(data);
      const isLongEnough = data.length >= 8;
      
      if (base64Pattern.test(data) && data.length > 0 && data.length % 4 === 0 && (hasBase64Chars || isLongEnough)) {
        try {
          // 尝试解码为 Buffer
          const decoded = Buffer.from(data, 'base64');
          // 验证解码结果是否合理（至少包含一些可打印字符或非空）
          // 如果解码后的数据看起来不合理，回退到 UTF-8
          if (decoded.length === 0) {
            return Buffer.from(data, 'utf8');
          }
          return decoded;
        } catch {
          // 如果解码失败，作为 UTF-8 处理
          return Buffer.from(data, 'utf8');
        }
      }
      // 不是 Base64，作为 UTF-8 处理
      return Buffer.from(data, 'utf8');
    }
    return Buffer.from(String(data));
  }

  /**
   * 设置自定义格式化函数
   * @param {Function} formatter - 自定义格式化函数
   */
  setCustomFormatter(formatter) {
    if (typeof formatter !== 'function') {
      throw new Error('自定义格式化器必须是一个函数');
    }
    this.formatters.custom = formatter;
  }

  /**
   * 格式化消息
   * @param {*} data - 要格式化的数据
   * @param {string} format - 格式类型：'json' | 'text' | 'binary' | 'custom'
   * @param {Object} options - 格式化选项
   * @returns {string|Buffer} 格式化后的消息
   */
  format(data, format = 'text', options = {}) {
    if (format === 'custom' && this.formatters.custom) {
      try {
        return this.formatters.custom(data, options);
      } catch (error) {
        throw new Error(`自定义格式化失败: ${error.message}`);
      }
    }

    if (!this.formatters[format]) {
      throw new Error(`不支持的格式类型: ${format}`);
    }

    try {
      return this.formatters[format](data);
    } catch (error) {
      throw new Error(`格式化失败: ${error.message}`);
    }
  }

  /**
   * 解析接收到的消息
   * @param {string|Buffer} data - 接收到的数据
   * @param {string} format - 格式类型
   * @returns {*} 解析后的数据
   */
  parse(data, format = 'text') {
    if (format === 'json') {
      try {
        const str = Buffer.isBuffer(data) ? data.toString('utf8') : data;
        return JSON.parse(str);
      } catch (error) {
        throw new Error(`JSON 解析失败: ${error.message}`);
      }
    }

    if (format === 'binary') {
      return Buffer.isBuffer(data) ? data : Buffer.from(data);
    }

    if (format === 'text') {
      return Buffer.isBuffer(data) ? data.toString('utf8') : String(data);
    }

    return data;
  }

  /**
   * 格式化消息用于显示
   * @param {Object} message - 消息对象
   * @param {string} format - 格式类型
   * @returns {string} 格式化后的显示文本
   */
  formatForDisplay(message, format = 'text') {
    const { data, isBinary, timestamp, type } = message;

    try {
      let content;
      if (isBinary) {
        content = `[二进制数据: ${Buffer.isBuffer(data) ? data.length : data.length} 字节]`;
      } else if (format === 'json') {
        try {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data;
          content = JSON.stringify(parsed, null, 2);
        } catch {
          content = String(data);
        }
      } else {
        content = String(data);
      }

      const time = new Date(timestamp).toLocaleString('zh-CN');
      const typeLabel = type === 'sent' ? '发送' : '接收';
      return `[${time}] ${typeLabel}: ${content}`;
    } catch (error) {
      return `[格式化错误] ${error.message}`;
    }
  }
}
