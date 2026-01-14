/**
 * 消息模型
 * 管理消息存储和查询
 */

export class MessageModel {
  constructor() {
    this.messages = [];
    this.maxHistorySize = 1000; // 最大保存 1000 条消息
  }

  /**
   * 添加消息
   * @param {Object} message - 消息对象
   */
  addMessage(message) {
    this.messages.push({
      ...message,
      id: this.generateId()
    });

    // 限制历史记录大小
    if (this.messages.length > this.maxHistorySize) {
      this.messages.shift();
    }
  }

  /**
   * 获取消息列表
   * @param {Object} options - 查询选项
   * @returns {Array} 消息数组
   */
  getMessages(options = {}) {
    let messages = [...this.messages];

    if (options.limit) {
      messages = messages.slice(-options.limit);
    }

    if (options.type) {
      messages = messages.filter(msg => msg.type === options.type);
    }

    if (options.startTime) {
      messages = messages.filter(msg => msg.timestamp >= options.startTime);
    }

    if (options.endTime) {
      messages = messages.filter(msg => msg.timestamp <= options.endTime);
    }

    return messages;
  }

  /**
   * 清空消息历史
   */
  clearMessages() {
    this.messages = [];
  }

  /**
   * 生成消息 ID
   * @returns {string} 消息 ID
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
