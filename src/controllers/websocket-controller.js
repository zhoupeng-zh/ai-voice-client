/**
 * WebSocket 控制器
 * 管理 WebSocket 客户端实例和操作
 */

import { WebSocketClient } from '../services/websocket-client.js';
import { ConfigManager } from '../config/config-manager.js';
import { MessageFormatter } from '../utils/message-formatter.js';
import { FileHandler } from '../utils/file-handler.js';
import { MessageModel } from '../models/message-model.js';

export class WebSocketController {
  constructor() {
    this.configManager = new ConfigManager();
    this.client = null;
    this.messageFormatter = new MessageFormatter();
    this.fileHandler = new FileHandler();
    this.messageModel = new MessageModel();
    this.sseClients = new Set(); // SSE 客户端集合
    this.setupClient();
    // 异步加载配置文件
    this.loadSavedConfig();
  }

  /**
   * 加载保存的配置
   */
  async loadSavedConfig() {
    await this.configManager.loadFromFile();
  }

  /**
   * 设置 WebSocket 客户端
   */
  setupClient() {
    this.client = new WebSocketClient(this.configManager);

    // 监听客户端事件
    this.client.on('open', () => {
      console.log('WebSocket 连接已建立');
    });

    this.client.on('message', (message) => {
      this.messageModel.addMessage(message);
      this.broadcastSSE('message', message);
    });

    this.client.on('sent', (message) => {
      this.messageModel.addMessage(message);
      this.broadcastSSE('message', message);
    });

    this.client.on('ping', (message) => {
      this.messageModel.addMessage(message);
      this.broadcastSSE('message', message);
    });

    this.client.on('pong', (message) => {
      this.messageModel.addMessage(message);
      this.broadcastSSE('message', message);
    });

    this.client.on('heartbeat', (message) => {
      this.messageModel.addMessage(message);
      this.broadcastSSE('message', message);
    });

    this.client.on('open', () => {
      // 添加连接成功消息
      const openMessage = {
        data: '连接已建立',
        isBinary: false,
        timestamp: Date.now(),
        type: 'open'
      };
      this.messageModel.addMessage(openMessage);
      this.broadcastSSE('message', openMessage);
      
      this.broadcastSSE('status', { state: 'OPEN' });
    });

    this.client.on('close', (data) => {
      console.log('WebSocket 连接已关闭:', data);
      
      // 添加断连消息到消息记录
      const closeMessage = {
        data: `连接已断开 (代码: ${data.code}, 原因: ${data.reason || '无'})`,
        isBinary: false,
        timestamp: Date.now(),
        type: 'close'
      };
      this.messageModel.addMessage(closeMessage);
      this.broadcastSSE('message', closeMessage);
      
      this.broadcastSSE('status', { state: 'CLOSED', data });
    });

    this.client.on('error', (error) => {
      console.error('WebSocket 错误:', error);
      
      // 添加错误消息到消息记录
      const errorMessage = {
        data: `连接错误: ${error.message}`,
        isBinary: false,
        timestamp: Date.now(),
        type: 'error'
      };
      this.messageModel.addMessage(errorMessage);
      this.broadcastSSE('message', errorMessage);
      
      this.broadcastSSE('error', { message: error.message });
    });

    this.client.on('error', (error) => {
      console.error('WebSocket 错误:', error);
    });

    this.client.on('idle-timeout', () => {
      console.log('检测到空闲超时');
    });
  }

  /**
   * 获取连接状态
   * @returns {Object} 状态信息
   */
  getStatus() {
    return {
      state: this.client ? this.client.getState() : 'CLOSED',
      config: this.configManager.getConfig(),
      messageCount: this.messageModel.getMessages().length,
      heartbeatRunning: this.client ? this.client.isHeartbeatRunning() : false
    };
  }

  /**
   * 更新配置
   * @param {Object} config - 配置对象
   * @returns {Object} 更新结果
   */
  async updateConfig(config) {
    try {
      const oldConfig = this.configManager.getConfig();
      await this.configManager.updateConfig(config, true); // 自动保存到文件
      const validation = this.configManager.validateConfig();
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }
      
      // 心跳改为手动控制，不再自动更新
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 连接 WebSocket
   * @param {string} url - 可选的完整URL（包含参数）
   * @returns {Object} 连接结果
   */
  connect(url = null) {
    try {
      // 如果提供了完整URL，更新配置
      if (url) {
        this.configManager.updateConfigSync({ url });
      }
      this.client.connect();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 启动心跳
   * @returns {Object} 启动结果
   */
  startHeartbeat() {
    try {
      if (!this.client || this.client.getState() !== 'OPEN') {
        return { success: false, error: 'WebSocket 未连接' };
      }
      this.client.enableHeartbeat();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 停止心跳
   * @returns {Object} 停止结果
   */
  stopHeartbeat() {
    try {
      if (!this.client || this.client.getState() !== 'OPEN') {
        return { success: false, error: 'WebSocket 未连接' };
      }
      this.client.disableHeartbeat();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 发送单次心跳
   * @returns {Object} 发送结果
   */
  sendSingleHeartbeat() {
    try {
      if (!this.client || this.client.getState() !== 'OPEN') {
        return { success: false, error: 'WebSocket 未连接' };
      }

      const config = this.configManager.getConfig();
      const hbType = config.heartbeatType || 'message';
      const hbMessage = config.heartbeatMessage || 'ping';

      if (hbType === 'message') {
        // 发送自定义心跳消息，使用专门的方法避免重复记录
        const success = this.client.sendHeartbeatMessage(hbMessage);
        if (success) {
          // 心跳消息会通过 sendHeartbeatMessage() 方法自动记录并触发 heartbeat 事件
          // controller 的 heartbeat 事件监听器会自动处理，这里不需要手动添加
          return { success: true };
        } else {
          return { success: false, error: '发送心跳失败' };
        }
      } else {
        // 发送 ping
        const success = this.client.sendPing();
        if (success) {
          // ping 消息会通过 sendPing() 方法自动记录，这里不需要手动添加
          return { success: true };
        } else {
          return { success: false, error: '发送心跳失败' };
        }
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 断开连接
   * @returns {Object} 断开结果
   */
  disconnect() {
    try {
      // 添加手动断开消息
      const closeMessage = {
        data: '连接已手动断开',
        isBinary: false,
        timestamp: Date.now(),
        type: 'close'
      };
      this.messageModel.addMessage(closeMessage);
      this.broadcastSSE('message', closeMessage);
      
      this.client.disconnect();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 发送消息
   * @param {*} data - 消息数据
   * @param {Object} options - 发送选项
   * @returns {Object} 发送结果
   */
  sendMessage(data, options = {}) {
    try {
      const format = options.format || 'text';
      let formattedData;

      // 如果有文件，处理文件
      if (options.file) {
        // 文件已在上传时处理，这里直接使用
        formattedData = options.fileData || data;
      } else {
        // 格式化消息
        formattedData = this.messageFormatter.format(data, format, options);
      }

      // 发送消息
      const success = this.client.send(formattedData, {
        binary: format === 'binary' || options.binary
      });

      if (success) {
        return { success: true };
      } else {
        return { success: false, error: 'WebSocket 未连接' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 处理文件上传
   * @param {string} filePath - 文件路径
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 处理结果
   */
  async handleFileUpload(filePath, options = {}) {
    try {
      const validation = await this.fileHandler.validateFile(filePath);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const fileInfo = await this.fileHandler.getFileInfo(filePath);
      const fileData = await this.fileHandler.readFileAsBase64(filePath);

      // 构建包含文件信息的消息
      const messageData = {
        type: 'file',
        file: {
          name: fileInfo.name,
          size: fileInfo.size,
          type: fileInfo.type,
          data: fileData.data
        },
        ...options.metadata
      };

      // 格式化消息
      const formattedData = this.messageFormatter.format(messageData, options.format || 'json');

      // 发送消息
      const success = this.client.send(formattedData, {
        binary: false
      });

      if (success) {
        return { success: true, fileInfo };
      } else {
        return { success: false, error: 'WebSocket 未连接' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取消息历史
   * @param {Object} options - 查询选项
   * @returns {Array} 消息数组
   */
  getMessages(options = {}) {
    return this.messageModel.getMessages(options);
  }

  /**
   * 清空消息历史
   */
  clearMessages() {
    this.messageModel.clearMessages();
    return { success: true };
  }

  /**
   * 设置自定义格式化函数
   * @param {Function} formatter - 格式化函数
   * @returns {Object} 设置结果
   */
  setCustomFormatter(formatter) {
    try {
      this.messageFormatter.setCustomFormatter(formatter);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 添加 SSE 客户端
   * @param {Object} req - Express 请求对象
   * @param {Object} res - Express 响应对象
   */
  addSSEClient(req, res) {
    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // 禁用 nginx 缓冲
    res.setHeader('Access-Control-Allow-Origin', '*');

    // 发送初始连接消息
    res.write(`: 连接已建立\n\n`);

    this.sseClients.add(res);

    // 客户端断开连接时清理
    req.on('close', () => {
      this.sseClients.delete(res);
      res.end();
    });

    req.on('aborted', () => {
      this.sseClients.delete(res);
      res.end();
    });
  }

  /**
   * 广播 SSE 消息
   * @param {string} event - 事件类型
   * @param {Object} data - 数据
   */
  broadcastSSE(event, data) {
    if (this.sseClients.size === 0) {
      return;
    }
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    const deadClients = [];
    this.sseClients.forEach(client => {
      try {
        client.write(message);
      } catch (error) {
        // 客户端已断开，标记为删除
        deadClients.push(client);
      }
    });
    // 清理断开的客户端
    deadClients.forEach(client => this.sseClients.delete(client));
  }

  /**
   * 移除 SSE 客户端
   * @param {Object} res - Express 响应对象
   */
  removeSSEClient(res) {
    this.sseClients.delete(res);
  }

  /**
   * 处理前端 WebSocket 连接
   * @param {Object} ws - WebSocket 连接对象
   */
  handleFrontendWebSocket(ws) {
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // 处理心跳命令
        if (message.type === 'heartbeat' && message.action === 'send') {
          const result = this.sendSingleHeartbeat();
          ws.send(JSON.stringify({
            type: 'heartbeat',
            action: 'result',
            success: result.success,
            error: result.error || null
          }));
        }
        // 可以在这里添加其他命令处理
      } catch (error) {
        console.error('[前端 WebSocket] 处理消息失败:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: error.message
        }));
      }
    });
  }
}
