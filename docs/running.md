# 运行说明

## 环境要求

- Node.js >= 20.0.0
- npm 或 yarn

## 安装步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量（可选）

复制 `.env.example` 为 `.env` 并修改配置：

```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 服务器配置
PORT=3000

# WebSocket 默认配置
WS_DEFAULT_URL=ws://localhost:8080
WS_DEFAULT_HEARTBEAT_INTERVAL=30000
WS_DEFAULT_IDLE_TIMEOUT=300000

# 文件上传配置
MAX_FILE_SIZE=10485760
```

## 运行应用

### 开发模式

使用 nodemon 自动重启（需要安装 nodemon）：

```bash
npm run dev
```

### 生产模式

直接运行：

```bash
npm start
```

或使用 Node.js：

```bash
node src/index.js
```

### 指定端口

通过环境变量指定端口：

```bash
# Windows PowerShell
$env:PORT=8080; npm start

# Linux/Mac
PORT=8080 npm start
```

## 访问应用

启动成功后，在浏览器中访问：

```
http://localhost:3000
```

默认端口为 3000，如果修改了 PORT 环境变量，使用相应端口。

## 运行测试

### 运行所有测试

```bash
npm test
```

### 监听模式（自动运行测试）

```bash
npm run test:watch
```

### 运行特定测试文件

```bash
node --test tests/config-manager.test.js
```

## 项目结构

```
ai-voice-client/
├── src/                    # 源代码目录
│   ├── config/            # 配置管理
│   │   └── config-manager.js
│   ├── controllers/       # 控制器
│   │   └── websocket-controller.js
│   ├── models/            # 数据模型
│   │   └── message-model.js
│   ├── routes/            # 路由定义
│   │   └── api-routes.js
│   ├── services/          # 业务逻辑
│   │   └── websocket-client.js
│   ├── utils/             # 工具函数
│   │   ├── message-formatter.js
│   │   └── file-handler.js
│   └── index.js           # 应用入口
├── public/                # 静态文件
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── tests/                 # 测试文件
│   ├── config-manager.test.js
│   ├── message-formatter.test.js
│   ├── file-handler.test.js
│   ├── websocket-client.test.js
│   └── integration.test.js
├── docs/                  # 文档
│   ├── architecture.md
│   ├── usage.md
│   └── running.md
├── uploads/               # 文件上传临时目录（自动创建）
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## 开发说明

### 代码规范

- 使用 ES6+ 语法
- 2 空格缩进
- 单引号
- 语句末尾使用分号
- camelCase 命名（函数、变量）
- PascalCase 命名（类）
- 文件命名使用 kebab-case

### 添加新功能

1. 在相应的目录下创建文件
2. 遵循模块化设计原则
3. 编写单元测试
4. 更新文档

### 调试

#### 查看日志

应用会在控制台输出日志信息：

- 连接状态变化
- 消息发送/接收
- 错误信息

#### 浏览器调试

1. 打开浏览器开发者工具（F12）
2. 查看 Console 标签页
3. 查看 Network 标签页（API 请求）

## 部署

### 生产环境部署

1. 设置环境变量
2. 安装生产依赖：

```bash
npm install --production
```

3. 启动应用：

```bash
npm start
```

### 使用 PM2 管理

安装 PM2：

```bash
npm install -g pm2
```

启动应用：

```bash
pm2 start src/index.js --name websocket-client
```

查看状态：

```bash
pm2 status
```

查看日志：

```bash
pm2 logs websocket-client
```

停止应用：

```bash
pm2 stop websocket-client
```

### 使用 Docker（可选）

创建 `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

构建镜像：

```bash
docker build -t websocket-client .
```

运行容器：

```bash
docker run -p 3000:3000 --env-file .env websocket-client
```

## 常见问题

### 端口被占用

如果端口 3000 被占用，修改 `.env` 文件中的 `PORT` 值。

### 模块未找到

确保已安装所有依赖：

```bash
npm install
```

### WebSocket 连接失败

1. 检查 WebSocket 服务器是否运行
2. 检查连接地址是否正确
3. 检查防火墙设置
4. 查看浏览器控制台错误

### 文件上传失败

1. 检查 `uploads/` 目录权限
2. 检查文件大小限制
3. 查看服务器日志

## 性能优化

### 消息历史限制

默认保存最多 1000 条消息，可在 `src/models/message-model.js` 中修改 `maxHistorySize`。

### 心跳间隔

根据实际需求调整心跳间隔，避免过于频繁。

### 文件大小限制

根据服务器能力调整最大文件大小限制。

## 安全建议

1. **生产环境**: 使用 HTTPS 和 WSS
2. **认证**: 在请求头中添加认证信息
3. **文件上传**: 限制文件类型和大小
4. **输入验证**: 验证所有用户输入
5. **错误处理**: 不要暴露敏感错误信息

## 更新日志

查看 `package.json` 中的版本信息。
