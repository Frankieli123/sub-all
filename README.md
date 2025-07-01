# CF-Workers-SUB Node.js 版本

> 🚀 将 Cloudflare Worker 版本的 CF-Workers-SUB 完整移植到 Node.js，支持在 VPS 上部署

## 项目简介

这是 [CF-Workers-SUB](https://github.com/cmliu/CF-Workers-SUB) 的 Node.js 版本，**完全按照原项目逻辑**进行转换，保持所有功能特性不变。适合在 VPS 上部署，提供稳定的订阅聚合服务。

## 主要特性

- ✅ **完全兼容**: 严格按照原 worker.js 逻辑实现，功能100%兼容
- ✅ **多格式支持**: base64, clash, singbox, surge, quantumult x, loon
- ✅ **订阅聚合**: 支持多个订阅源聚合、去重、格式转换
- ✅ **Web管理**: 在线编辑订阅内容，支持二维码生成
- ✅ **访问控制**: 基于token的访问权限控制，支持访客模式
- ✅ **Telegram通知**: 访问日志实时推送到Telegram
- ✅ **反向代理**: 支持URL重定向和代理功能
- ✅ **双存储支持**: 支持文件系统存储和Redis存储，自动选择
- ✅ **容器化部署**: 完整的Docker和Coolify部署支持
- ✅ **简单部署**: 一键脚本部署，支持PM2和systemd管理

## 快速开始

### 环境要求

- Node.js 16.0.0+ 或 Docker
- 512MB+ RAM
- 1GB+ 存储空间

### 部署方式

#### 方式一：一键脚本部署（推荐）

```bash
# 1. 下载项目
git clone <项目地址>
cd cf-workers-sub-nodejs

# 2. 运行快速部署脚本
chmod +x quick-deploy.sh
./quick-deploy.sh

# 3. 访问服务
# http://your-server:3000/auto
```

#### 方式二：Coolify 部署（推荐用于生产环境）

```bash
# 1. 在 Coolify 中创建新项目
# 2. 选择 Git 仓库部署
# 3. 使用 docker-compose.coolify.yml
# 4. 配置环境变量（TOKEN, EXTERNAL_URL等）
# 5. 自动部署完成

# 特性：Redis存储 + 自动扩展 + 健康检查
```

#### 方式三：Docker 部署

```bash
# 1. 下载项目
git clone <项目地址>
cd cf-workers-sub-nodejs

# 2. 配置环境变量
cp .env.example .env
nano .env

# 3. 启动服务（包含Redis）
docker-compose --profile redis up -d

# 4. 查看状态
docker-compose ps
```

#### 方式三：手动部署

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
nano .env

# 启动服务
npm start
```

## 配置说明

### 基础配置

```env
# 服务配置
PORT=3000                    # 服务端口
TOKEN=auto                   # 访问令牌

# 订阅源配置
LINK=                        # 自建节点
LINKSUB=                     # 订阅链接

# Telegram通知 (可选)
TGTOKEN=                     # Bot Token
TGID=                        # Chat ID
```

### 📚 部署文档

- **[Coolify 部署指南](COOLIFY-DEPLOYMENT.md)** - 使用 Coolify 部署（Redis存储）
- **[VPS 部署指南](VPS-DEPLOYMENT-GUIDE.md)** - 详细的 VPS 部署步骤
- **[Docker 部署指南](DOCKER-DEPLOYMENT.md)** - 使用 Docker 快速部署
- **[基础部署文档](DEPLOYMENT.md)** - 通用部署说明

## 访问地址

| 格式 | 地址 |
|------|------|
| 自适应 | `http://your-server:3000/your-token` |
| Base64 | `http://your-server:3000/your-token?b64` |
| Clash | `http://your-server:3000/your-token?clash` |
| Singbox | `http://your-server:3000/your-token?sb` |
| Surge | `http://your-server:3000/your-token?surge` |
| QuantumultX | `http://your-server:3000/your-token?quanx` |
| Loon | `http://your-server:3000/your-token?loon` |

## 项目结构

```
cf-workers-sub-nodejs/
├── app.js                   # 主应用文件
├── package.json             # 项目配置
├── ecosystem.config.js      # PM2配置
├── start.sh                 # 启动脚本
├── .env.example             # 配置模板
├── utils/                   # 工具模块
│   ├── tools.js            # 基础工具函数
│   ├── subscription.js     # 订阅处理
│   ├── converter.js        # 格式转换
│   ├── telegram.js         # Telegram通知
│   ├── storage.js          # 存储管理
│   └── config.js           # 配置管理
├── data/                    # 数据目录
├── logs/                    # 日志目录
└── DEPLOYMENT.md            # 部署文档
```

## 服务管理

### PM2 管理

```bash
pm2 start ecosystem.config.js   # 启动
pm2 status                       # 状态
pm2 logs cf-workers-sub          # 日志
pm2 restart cf-workers-sub       # 重启
```

### systemd 管理

```bash
sudo systemctl start cf-workers-sub     # 启动
sudo systemctl status cf-workers-sub    # 状态
sudo systemctl restart cf-workers-sub   # 重启
```

## 功能对比

| 功能 | Cloudflare Worker | Node.js 版本 |
|------|-------------------|--------------|
| 订阅聚合 | ✅ | ✅ |
| 多格式转换 | ✅ | ✅ |
| Web管理界面 | ✅ | ✅ |
| Telegram通知 | ✅ | ✅ |
| 访问控制 | ✅ | ✅ |
| KV存储 | ✅ | ✅ (文件系统) |
| 反向代理 | ✅ | ✅ |
| 自定义域名 | ✅ | ✅ |
| 免费部署 | ✅ | ❌ (需VPS) |
| 完全控制 | ❌ | ✅ |

## 技术栈

- **框架**: Express.js
- **HTTP客户端**: Axios
- **加密**: Node.js Crypto
- **存储**: 文件系统 (替代KV)
- **进程管理**: PM2
- **日志**: Morgan + 自定义日志

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 致谢

- 原项目: [CF-Workers-SUB](https://github.com/cmliu/CF-Workers-SUB)
- 感谢所有贡献者

---

**⭐ 如果这个项目对你有帮助，请给个 Star！**
