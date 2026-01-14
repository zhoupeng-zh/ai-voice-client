/**
 * 配置管理器
 * 管理 WebSocket 连接配置，包括连接地址、请求头、心跳间隔等
 */

import { loadConfig as loadConfigFromFile, saveConfig as saveConfigToFile } from '../utils/config-storage.js';

export class ConfigManager {
  constructor() {
    this.config = {
      url: process.env.WS_DEFAULT_URL || 'ws://localhost:8080',
      urlParams: [],
      headers: {},
      heartbeatInterval: parseInt(process.env.WS_DEFAULT_HEARTBEAT_INTERVAL) || 30000,
      heartbeatMessage: process.env.WS_DEFAULT_HEARTBEAT_MESSAGE || 'ping', // 默认心跳消息
      heartbeatType: process.env.WS_DEFAULT_HEARTBEAT_TYPE || 'message', // 默认使用消息类型
      idleTimeout: parseInt(process.env.WS_DEFAULT_IDLE_TIMEOUT) || 300000,
      reconnectDelay: 1000,
      maxReconnectDelay: 30000,
      reconnectDecay: 1.5,
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB
    };
    this.autoSave = true; // 是否自动保存
  }

  /**
   * 从文件加载配置
   * @returns {Promise<void>}
   */
  async loadFromFile() {
    try {
      const savedConfig = await loadConfigFromFile();
      if (savedConfig) {
        // 合并保存的配置，保留默认值，不保存到文件（避免递归）
        await this.updateConfig(savedConfig, false);
        console.log('已从文件加载配置');
      }
    } catch (error) {
      console.error('加载配置文件失败:', error.message);
    }
  }

  /**
   * 保存配置到文件
   * @returns {Promise<boolean>}
   */
  async saveToFile() {
    if (!this.autoSave) {
      return false;
    }
    try {
      // 只保存用户可配置的项
      const configToSave = {
        url: this.config.url,
        urlParams: this.config.urlParams || [],
        headers: this.config.headers,
        heartbeatInterval: this.config.heartbeatInterval,
        heartbeatMessage: this.config.heartbeatMessage,
        heartbeatType: this.config.heartbeatType,
        idleTimeout: this.config.idleTimeout
      };
      const success = await saveConfigToFile(configToSave);
      if (success) {
        console.log('配置已保存到文件');
      }
      return success;
    } catch (error) {
      console.error('保存配置文件失败:', error.message);
      return false;
    }
  }

  /**
   * 设置自动保存
   * @param {boolean} enabled - 是否启用自动保存
   */
  setAutoSave(enabled) {
    this.autoSave = enabled;
  }

  /**
   * 获取配置
   * @returns {Object} 配置对象
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * 更新配置（同步版本）
   * @param {Object} newConfig - 新配置对象
   */
  updateConfigSync(newConfig) {
    if (newConfig.url !== undefined) {
      this.config.url = newConfig.url;
    }
    if (newConfig.urlParams !== undefined) {
      this.config.urlParams = Array.isArray(newConfig.urlParams) ? newConfig.urlParams : [];
    }
    if (newConfig.headers !== undefined) {
      if (Array.isArray(newConfig.headers)) {
        // 如果是数组，转换为对象
        this.config.headers = {};
        newConfig.headers.forEach(header => {
          if (header.key) {
            this.config.headers[header.key] = header.value || '';
          }
        });
      } else {
        this.config.headers = { ...this.config.headers, ...newConfig.headers };
      }
    }
    if (newConfig.heartbeatInterval !== undefined) {
      this.config.heartbeatInterval = Math.max(1000, parseInt(newConfig.heartbeatInterval));
    }
    if (newConfig.heartbeatMessage !== undefined) {
      this.config.heartbeatMessage = newConfig.heartbeatMessage;
    }
    if (newConfig.heartbeatType !== undefined) {
      this.config.heartbeatType = newConfig.heartbeatType;
    }
    if (newConfig.idleTimeout !== undefined) {
      this.config.idleTimeout = Math.max(0, parseInt(newConfig.idleTimeout));
    }
    if (newConfig.reconnectDelay !== undefined) {
      this.config.reconnectDelay = Math.max(100, parseInt(newConfig.reconnectDelay));
    }
    if (newConfig.maxReconnectDelay !== undefined) {
      this.config.maxReconnectDelay = Math.max(1000, parseInt(newConfig.maxReconnectDelay));
    }
    if (newConfig.reconnectDecay !== undefined) {
      this.config.reconnectDecay = Math.max(1.0, parseFloat(newConfig.reconnectDecay));
    }
    if (newConfig.maxFileSize !== undefined) {
      this.config.maxFileSize = Math.max(0, parseInt(newConfig.maxFileSize));
    }
  }

  /**
   * 更新配置
   * @param {Object} newConfig - 新配置对象
   * @param {boolean} saveToFile - 是否保存到文件，默认 true
   */
  async updateConfig(newConfig, saveToFile = true) {
    this.updateConfigSync(newConfig);

    // 自动保存到文件
    if (saveToFile) {
      await this.saveToFile();
    }
  }

  /**
   * 重置配置为默认值
   */
  resetConfig() {
    this.config = {
      url: process.env.WS_DEFAULT_URL || 'ws://localhost:8080',
      urlParams: [],
      headers: {},
      heartbeatInterval: parseInt(process.env.WS_DEFAULT_HEARTBEAT_INTERVAL) || 30000,
      heartbeatMessage: process.env.WS_DEFAULT_HEARTBEAT_MESSAGE || 'ping',
      heartbeatType: process.env.WS_DEFAULT_HEARTBEAT_TYPE || 'message',
      idleTimeout: parseInt(process.env.WS_DEFAULT_IDLE_TIMEOUT) || 300000,
      reconnectDelay: 1000,
      maxReconnectDelay: 30000,
      reconnectDecay: 1.5,
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760
    };
  }

  /**
   * 验证配置
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validateConfig() {
    const errors = [];

    if (!this.config.url || typeof this.config.url !== 'string') {
      errors.push('连接地址无效');
    }

    if (this.config.heartbeatInterval < 1000) {
      errors.push('心跳间隔必须大于等于 1000 毫秒');
    }

    if (this.config.idleTimeout < 0) {
      errors.push('空闲超时时间不能为负数');
    }

    if (this.config.reconnectDelay < 100) {
      errors.push('重连延迟必须大于等于 100 毫秒');
    }

    if (this.config.maxReconnectDelay < this.config.reconnectDelay) {
      errors.push('最大重连延迟必须大于等于初始重连延迟');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
