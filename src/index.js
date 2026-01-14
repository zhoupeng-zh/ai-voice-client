/**
 * 应用入口文件
 * 启动 Express 服务器和 WebSocket 客户端管理
 */

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { WebSocketController } from './controllers/websocket-controller.js';
import { setWebSocketController } from './routes/api-routes.js';
import apiRoutes from './routes/api-routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 创建 HTTP 服务器（用于同时支持 Express 和 WebSocket）
const server = createServer(app);

// 创建 WebSocket 服务器（供前端连接）
const wss = new WebSocketServer({ 
  server,
  path: '/ws'
});

// 创建 WebSocket 控制器
const wsController = new WebSocketController();
setWebSocketController(wsController);

// 处理前端 WebSocket 连接
wss.on('connection', (ws, req) => {
  console.log('[前端 WebSocket] 新连接已建立');
  
  // 将 WebSocket 连接传递给控制器
  wsController.handleFrontendWebSocket(ws);
  
  ws.on('close', () => {
    console.log('[前端 WebSocket] 连接已关闭');
  });
  
  ws.on('error', (error) => {
    console.error('[前端 WebSocket] 错误:', error);
  });
});

// 中间件
// 增加请求体大小限制以支持大文件（Base64 编码后可能更大）
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API 路由（必须在静态文件服务之前）
app.use('/api', apiRoutes);

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));

// 根路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`WebSocket 服务器运行在 ws://localhost:${PORT}/ws`);
  console.log(`WebSocket 客户端已初始化`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  wsController.disconnect();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n正在关闭服务器...');
  wsController.disconnect();
  process.exit(0);
});
