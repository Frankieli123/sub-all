# CF-Workers-SUB Node.js 版本 v1.0.0

> 🎉 **首次发布**：完整的 Cloudflare Worker 到 Node.js 转换版本

## 📋 版本亮点

### ✨ 100% 功能兼容
- 严格按照原 worker.js 逻辑实现
- 保持所有原有功能特性
- 支持所有订阅格式和转换

### 🚀 多种部署方式
- **一键部署**：`./quick-deploy.sh` 自动化部署
- **Docker 部署**：完整的容器化支持
- **手动部署**：详细的部署指南

### 🌐 完整功能支持
- ✅ 订阅聚合和去重
- ✅ 多格式转换（base64/clash/singbox/surge/quanx/loon）
- ✅ Web 管理界面
- ✅ Telegram 通知
- ✅ 访问控制
- ✅ 反向代理

## 🔧 技术栈

- **Node.js** 16.0.0+
- **Express.js** Web 框架
- **PM2** 进程管理
- **Docker** 容器化支持
- **文件系统存储**（替代 Cloudflare KV）

## 📦 快速开始

### 方式一：一键部署（推荐）

```bash
# 1. 下载项目
git clone https://github.com/your-username/cf-workers-sub-nodejs.git
cd cf-workers-sub-nodejs

# 2. 运行部署脚本
chmod +x quick-deploy.sh
./quick-deploy.sh

# 3. 访问服务
# http://your-server:3000/your-token
```

### 方式二：Docker 部署

```bash
# 1. 下载项目
git clone https://github.com/your-username/cf-workers-sub-nodejs.git
cd cf-workers-sub-nodejs

# 2. 配置环境变量
cp .env.example .env
nano .env

# 3. 启动服务
docker-compose up -d
```

### 方式三：手动部署

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
nano .env

# 3. 启动服务
npm start
```

## 📚 文档

- **[VPS 部署指南](VPS-DEPLOYMENT-GUIDE.md)** - 详细的 VPS 部署步骤
- **[Docker 部署指南](DOCKER-DEPLOYMENT.md)** - 容器化部署说明
- **[配置参考](README.md#配置说明)** - 完整的配置项说明

## 🔗 访问地址

部署成功后，可通过以下地址访问：

- **管理界面**: `http://your-server:3000/your-token`
- **Base64订阅**: `http://your-server:3000/your-token?b64`
- **Clash订阅**: `http://your-server:3000/your-token?clash`
- **Singbox订阅**: `http://your-server:3000/your-token?sb`
- **Surge订阅**: `http://your-server:3000/your-token?surge`
- **QuantumultX订阅**: `http://your-server:3000/your-token?quanx`
- **Loon订阅**: `http://your-server:3000/your-token?loon`

## ⚙️ 重要配置

### 必需配置项

```env
# 外部访问地址（重要！）
EXTERNAL_URL=http://your-server-ip:3000

# 访问令牌
TOKEN=your-secure-token

# 订阅源配置
LINK=your-subscription-links
LINKSUB=your-subscription-urls
```

### 可选配置项

```env
# Telegram 通知
TGTOKEN=your-telegram-bot-token
TGID=your-telegram-chat-id
TG=1

# 订阅转换API
SUBAPI=https://sub.nasl.cc:8888
SUBCONFIG=https://raw.githubusercontent.com/Frankieli123/clash2/refs/heads/main/Clash-LIAN.ini
```

## 🔄 从 Cloudflare Worker 迁移

1. **导出现有配置**：记录当前的环境变量和订阅内容
2. **部署 Node.js 版本**：按照上述方式选择一种部署方法
3. **导入配置**：将原有配置填入 `.env` 文件
4. **测试功能**：确认所有功能正常工作

## 🐛 已知问题

- 无已知重大问题
- 如遇到问题请提交 Issue

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发环境设置

```bash
# 克隆项目
git clone https://github.com/your-username/cf-workers-sub-nodejs.git
cd cf-workers-sub-nodejs

# 安装依赖
npm install

# 启动开发模式
npm run dev
```

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- 原项目：[CF-Workers-SUB](https://github.com/cmliu/CF-Workers-SUB)
- 感谢所有测试用户和贡献者

---

**完整项目文件列表：**

- `app.js` - 主应用文件
- `package.json` - 项目配置
- `ecosystem.config.js` - PM2 配置
- `Dockerfile` - Docker 镜像配置
- `docker-compose.yml` - Docker Compose 配置
- `quick-deploy.sh` - 一键部署脚本
- `start.sh` - 启动脚本
- `cf-workers-sub.service` - systemd 服务文件
- `utils/` - 工具模块目录
- `VPS-DEPLOYMENT-GUIDE.md` - VPS 部署指南
- `DOCKER-DEPLOYMENT.md` - Docker 部署指南
- `README.md` - 项目说明

**系统要求：**
- Node.js 16.0.0+ 或 Docker
- 512MB+ RAM
- 1GB+ 存储空间
