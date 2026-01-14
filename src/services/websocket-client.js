/**
 * WebSocket 客户端
 * 实现连接管理、断线重连、心跳保活、空闲超时等功能
 */

import WebSocket from 'ws';
import { EventEmitter } from 'events';

export class WebSocketClient extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.ws = null;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.idleTimer = null;
    this.reconnectDelay = config.reconnectDelay || 1000;
    this.isManualClose = false;
    this.lastUserMessageTime = null;
    this.messageHistory = [];
  }

  /**
   * 连接 WebSocket 服务器
   */
  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket 已连接');
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket 正在连接中...');
      return;
    }

    this.isManualClose = false;
    const validation = this.config.validateConfig();
    if (!validation.valid) {
      this.emit('error', new Error(`配置验证失败: ${validation.errors.join(', ')}`));
      return;
    }

    console.log(`正在连接到: ${this.config.getConfig().url}`);

    try {
      const config = this.config.getConfig();
      this.ws = new WebSocket(config.url, {
        headers: config.headers
      });

      this.setupEventHandlers();
    } catch (error) {
      console.error('连接失败:', error.message);
      this.emit('error', error);
      this.scheduleReconnect();
    }
  }

  /**
   * 设置事件处理器
   */
  setupEventHandlers() {
    this.ws.on('open', () => {
      console.log('WebSocket 连接已建立');
      this.reconnectDelay = this.config.getConfig().reconnectDelay;
      this.lastUserMessageTime = Date.now();
      // 不自动启动心跳，等待用户手动启动
      this.startIdleTimer();
      this.emit('open');
    });

    this.ws.on('message', (data, isBinary) => {
      const messageData = isBinary ? data : data.toString();
      const message = {
        data: messageData,
        isBinary,
        timestamp: Date.now(),
        type: 'received'
      };
      this.messageHistory.push(message);
      this.lastUserMessageTime = Date.now();
      
      // 详细日志
      if (isBinary) {
        console.log(`[WebSocket 接收] 二进制数据: ${data.length} 字节`);
      } else {
        console.log(`[WebSocket 接收] ${messageData}`);
      }
      
      this.emit('message', message);
    });

    this.ws.on('close', (code, reason) => {
      console.log(`WebSocket 连接已关闭: ${code} - ${reason.toString()}`);
      this.cleanup();
      this.emit('close', { code, reason: reason.toString() });

      // 如果不是手动关闭，则尝试重连
      if (!this.isManualClose && code !== 1000) {
        this.scheduleReconnect();
      }
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket 错误:', error.message);
      this.emit('error', error);
    });

    this.ws.on('ping', (data) => {
      this.lastUserMessageTime = Date.now();
      const pingData = data ? data.toString() : 'ping';
      // 记录 ping 消息
      const message = {
        data: pingData,
        isBinary: false,
        timestamp: Date.now(),
        type: 'ping'
      };
      this.messageHistory.push(message);
      console.log(`[WebSocket Ping] 收到 ping: ${pingData}`);
      this.emit('ping', message);
      
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.pong();
        console.log(`[WebSocket Pong] 发送 pong 响应`);
      }
    });

    this.ws.on('pong', (data) => {
      this.lastUserMessageTime = Date.now();
      const pongData = data ? data.toString() : 'pong';
      // 记录 pong 消息
      const message = {
        data: pongData,
        isBinary: false,
        timestamp: Date.now(),
        type: 'pong'
      };
      this.messageHistory.push(message);
      console.log(`[WebSocket Pong] 收到 pong: ${pongData}`);
      this.emit('pong', message);
    });
  }

  /**
   * 启动心跳保活
   */
  startHeartbeat() {
    this.stopHeartbeat();
    const config = this.config.getConfig();
    const interval = config.heartbeatInterval;
    if (interval <= 0) {
      return;
    }

    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          const heartbeatType = config.heartbeatType || 'message';
          const heartbeatMessage = config.heartbeatMessage || 'ping';

          if (heartbeatType === 'message') {
            // 发送自定义心跳消息
            this.ws.send(heartbeatMessage);
            console.log(`[WebSocket 心跳] 发送心跳消息: ${heartbeatMessage}`);
            // 记录发送的心跳消息
            const message = {
              data: heartbeatMessage,
              isBinary: false,
              timestamp: Date.now(),
              type: 'heartbeat'
            };
            this.messageHistory.push(message);
            this.emit('heartbeat', message);
          } else {
            // 使用 ping/pong 机制
            this.ws.ping();
            console.log('[WebSocket 心跳] 发送 ping');
          }
        } catch (error) {
          console.error('心跳发送失败:', error.message);
        }
      }
    }, interval);
  }

  /**
   * 启用心跳
   */
  enableHeartbeat() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.startHeartbeat();
    }
  }

  /**
   * 禁用心跳
   */
  disableHeartbeat() {
    this.stopHeartbeat();
  }

  /**
   * 检查心跳是否正在运行
   * @returns {boolean} 心跳是否运行
   */
  isHeartbeatRunning() {
    return this.heartbeatTimer !== null;
  }

  /**
   * 停止心跳保活
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 启动空闲超时检测
   */
  startIdleTimer() {
    this.stopIdleTimer();
    const timeout = this.config.getConfig().idleTimeout;
    if (timeout <= 0) {
      return;
    }

    this.idleTimer = setInterval(() => {
      if (this.lastUserMessageTime && Date.now() - this.lastUserMessageTime > timeout) {
        console.log('检测到长时间无用户消息，自动断开连接');
        this.disconnect();
        this.emit('idle-timeout');
      }
    }, 1000); // 每秒检查一次
  }

  /**
   * 停止空闲超时检测
   */
  stopIdleTimer() {
    if (this.idleTimer) {
      clearInterval(this.idleTimer);
      this.idleTimer = null;
    }
  }

  /**
   * 计划重连
   */
  scheduleReconnect() {
    if (this.reconnectTimer || this.isManualClose) {
      return;
    }

    const config = this.config.getConfig();
    const maxDelay = config.maxReconnectDelay;
    const decay = config.reconnectDecay;

    console.log(`将在 ${this.reconnectDelay}ms 后尝试重连...`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectDelay = Math.min(this.reconnectDelay * decay, maxDelay);
      this.connect();
    }, this.reconnectDelay);
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.stopHeartbeat();
    this.stopIdleTimer();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * 断开连接
   */
  disconnect() {
    this.isManualClose = true;
    this.cleanup();
    if (this.ws) {
      this.ws.close(1000, '客户端主动断开');
      this.ws = null;
    }
  }

  /**
   * 发送消息
   * @param {string|Buffer} data - 要发送的数据
   * @param {Object} options - 发送选项
   * @returns {boolean} 是否发送成功
   */
  send(data, options = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[WebSocket 发送] 失败: WebSocket 未连接');
      return false;
    }

    try {
      this.ws.send(data, options);
      this.lastUserMessageTime = Date.now();

      const message = {
        data: data instanceof Buffer ? data.toString('base64') : data,
        isBinary: data instanceof Buffer,
        timestamp: Date.now(),
        type: 'sent'
      };
      this.messageHistory.push(message);
      
      // 详细日志
      if (data instanceof Buffer) {
        console.log(`[WebSocket 发送] 二进制数据: ${data.length} 字节`);
      } else {
        console.log(`[WebSocket 发送] ${data}`);
      }
      
      this.emit('sent', message);
      return true;
    } catch (error) {
      console.error('[WebSocket 发送] 失败:', error.message);
      this.emit('error', error);
      return false;
    }
  }

  /**
   * 发送 ping
   * @returns {boolean} 是否发送成功
   */
  sendPing() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[WebSocket Ping] 失败: WebSocket 未连接');
      return false;
    }

    try {
      this.ws.ping();
      this.lastUserMessageTime = Date.now();
      
      // 记录发送的 ping
      const message = {
        data: 'ping',
        isBinary: false,
        timestamp: Date.now(),
        type: 'ping'
      };
      this.messageHistory.push(message);
      console.log('[WebSocket Ping] 发送 ping');
      this.emit('ping', message);
      return true;
    } catch (error) {
      console.error('[WebSocket Ping] 失败:', error.message);
      this.emit('error', error);
      return false;
    }
  }

  /**
   * 发送单次心跳消息（不触发 sent 事件）
   * @param {string} message - 心跳消息内容
   * @returns {boolean} 是否发送成功
   */
  sendHeartbeatMessage(message) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[WebSocket 心跳] 失败: WebSocket 未连接');
      return false;
    }

    try {
      // 直接调用 WebSocket 发送，不通过 send() 方法，避免触发 sent 事件
      this.ws.send(message);
      this.lastUserMessageTime = Date.now();
      
      // 只记录一次心跳消息
      const heartbeatMessage = {
        data: message,
        isBinary: false,
        timestamp: Date.now(),
        type: 'heartbeat'
      };
      this.messageHistory.push(heartbeatMessage);
      console.log(`[WebSocket 心跳] 发送心跳消息: ${message}`);
      this.emit('heartbeat', heartbeatMessage);
      return true;
    } catch (error) {
      console.error('[WebSocket 心跳] 失败:', error.message);
      this.emit('error', error);
      return false;
    }
  }

  /**
   * 获取连接状态
   * @returns {string} 连接状态
   */
  getState() {
    if (!this.ws) {
      return 'CLOSED';
    }
    const states = {
      [WebSocket.CONNECTING]: 'CONNECTING',
      [WebSocket.OPEN]: 'OPEN',
      [WebSocket.CLOSING]: 'CLOSING',
      [WebSocket.CLOSED]: 'CLOSED'
    };
    return states[this.ws.readyState] || 'UNKNOWN';
  }

  /**
   * 获取消息历史
   * @returns {Array} 消息历史数组
   */
  getMessageHistory() {
    return [...this.messageHistory];
  }

  /**
   * 清空消息历史
   */
  clearMessageHistory() {
    this.messageHistory = [];
  }
}
