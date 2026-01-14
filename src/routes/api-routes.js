/**
 * API 路由
 * 定义所有 API 端点
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const upload = multer({
  dest: path.join(__dirname, '../../uploads'),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

let wsController = null;

/**
 * 设置 WebSocket 控制器
 * @param {WebSocketController} controller - WebSocket 控制器实例
 */
export function setWebSocketController(controller) {
  wsController = controller;
}

// 获取连接状态
router.get('/status', (req, res) => {
  try {
    const status = wsController.getStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新配置
router.post('/config', async (req, res) => {
  try {
    const result = await wsController.updateConfig(req.body);
    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, errors: result.errors || [result.error] });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 连接 WebSocket
router.post('/connect', (req, res) => {
  try {
    const url = req.body?.url || null;
    const result = wsController.connect(url);
    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 启动心跳
router.post('/heartbeat/start', (req, res) => {
  try {
    const result = wsController.startHeartbeat();
    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 停止心跳
router.post('/heartbeat/stop', (req, res) => {
  try {
    const result = wsController.stopHeartbeat();
    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 发送单次心跳
router.post('/heartbeat/send', (req, res) => {
  try {
    if (!wsController) {
      return res.status(500).json({ success: false, error: 'WebSocket 控制器未初始化' });
    }
    const result = wsController.sendSingleHeartbeat();
    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 断开连接
router.post('/disconnect', (req, res) => {
  try {
    const result = wsController.disconnect();
    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 发送消息
router.post('/send', (req, res) => {
  try {
    const { data, format, binary } = req.body;
    if (data === undefined) {
      return res.status(400).json({ success: false, error: '消息数据不能为空' });
    }

    const result = wsController.sendMessage(data, { format, binary });
    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 上传文件并发送
router.post('/send-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '未上传文件' });
    }

    const filePath = req.file.path;
    const { format, metadata } = req.body;
    let parsedMetadata = {};
    if (metadata) {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch {
        // 忽略解析错误
      }
    }

    const result = await wsController.handleFileUpload(filePath, {
      format: format || 'json',
      metadata: parsedMetadata
    });

    // 清理临时文件
    try {
      await fs.unlink(filePath);
    } catch {
      // 忽略删除错误
    }

    if (result.success) {
      res.json({ success: true, fileInfo: result.fileInfo });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取消息历史
router.get('/messages', (req, res) => {
  try {
    const { limit, type, startTime, endTime } = req.query;
    const options = {};
    if (limit) options.limit = parseInt(limit);
    if (type) options.type = type;
    if (startTime) options.startTime = parseInt(startTime);
    if (endTime) options.endTime = parseInt(endTime);

    const messages = wsController.getMessages(options);
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 清空消息历史
router.delete('/messages', (req, res) => {
  try {
    const result = wsController.clearMessages();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Server-Sent Events 实时消息流
router.get('/events', (req, res) => {
  try {
    wsController.addSSEClient(req, res);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
