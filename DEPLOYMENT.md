# CF-Workers-SUB Node.js 版本部署指南

## 概述

这是 CF-Workers-SUB 的 Node.js 版本，完全按照原 Cloudflare Worker 项目逻辑转换而来，保持所有功能特性不变。

## 系统要求

- **操作系统**: Linux (Ubuntu 18.04+, CentOS 7+, Debian 9+)
- **Node.js**: 16.0.0 或更高版本
- **内存**: 最少 512MB RAM
- **存储**: 最少 1GB 可用空间
- **网络**: 需要访问外部订阅源和转换API

## 快速部署

### 方法一：一键脚本部署

```bash
# 下载项目
git clone <项目地址>
cd cf-workers-sub-nodejs

# 运行启动脚本
chmod +x start.sh
./start.sh
```

### 方法二：手动部署

#### 1. 安装 Node.js

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**CentOS/RHEL:**
```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

#### 2. 下载和安装项目

```bash
# 创建项目目录
sudo mkdir -p /opt/cf-workers-sub
cd /opt/cf-workers-sub

# 下载项目文件（或上传）
# 假设项目文件已在当前目录

# 安装依赖
npm install

# 创建必要目录
mkdir -p data logs
```

#### 3. 配置环境变量

```bash
# 复制配置文件
cp .env.example .env

# 编辑配置
nano .env
```

#### 4. 启动服务

**使用 PM2 (推荐):**
```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start ecosystem.config.js

# 设置开机自启
pm2 startup
pm2 save
```

**使用 systemd:**
```bash
# 复制服务文件
sudo cp cf-workers-sub.service /etc/systemd/system/

# 修改服务文件中的路径
sudo nano /etc/systemd/system/cf-workers-sub.service

# 启动服务
sudo systemctl daemon-reload
sudo systemctl enable cf-workers-sub
sudo systemctl start cf-workers-sub
```

## 配置说明

### 基础配置

```env
# 服务器配置
PORT=3000                    # 服务端口
HOST=0.0.0.0                # 监听地址

# 订阅配置
TOKEN=auto                   # 主要访问令牌
GUESTTOKEN=                  # 访客令牌（可选）
FILENAME=CF-Workers-SUB      # 订阅文件名
SUBUPTIME=6                  # 订阅更新间隔（小时）
```

### Telegram 通知配置（可选）

```env
TGTOKEN=                     # Telegram Bot Token
TGID=                        # Telegram Chat ID
TG=0                         # 通知级别 (0=关闭, 1=开启)
```

### 订阅转换配置

```env
SUBAPI=https://sub.nasl.cc:8888                                    # 转换API
SUBCONFIG=https://raw.githubusercontent.com/.../Clash-LIAN.ini     # 转换配置
```

### 订阅源配置

```env
LINK=                        # 自建节点链接
LINKSUB=                     # 订阅链接
```

## 功能特性

✅ **完全兼容原项目**: 所有功能逻辑完全按照原 worker.js 实现  
✅ **多格式支持**: base64, clash, singbox, surge, quantumult x, loon  
✅ **订阅聚合**: 支持多个订阅源聚合和去重  
✅ **Telegram 通知**: 访问日志推送到 Telegram  
✅ **Web 管理界面**: 在线编辑订阅内容  
✅ **访问控制**: 基于 token 的访问权限控制  
✅ **反向代理**: 支持 URL 重定向和代理功能  

## 访问地址

服务启动后，可通过以下地址访问：

- **管理界面**: `http://your-server:3000/your-token`
- **自适应订阅**: `http://your-server:3000/your-token`
- **Base64订阅**: `http://your-server:3000/your-token?b64`
- **Clash订阅**: `http://your-server:3000/your-token?clash`
- **Singbox订阅**: `http://your-server:3000/your-token?sb`
- **Surge订阅**: `http://your-server:3000/your-token?surge`
- **QuantumultX订阅**: `http://your-server:3000/your-token?quanx`
- **Loon订阅**: `http://your-server:3000/your-token?loon`

## 服务管理

### PM2 管理命令

```bash
pm2 status                   # 查看状态
pm2 logs cf-workers-sub      # 查看日志
pm2 restart cf-workers-sub   # 重启服务
pm2 stop cf-workers-sub      # 停止服务
pm2 delete cf-workers-sub    # 删除服务
```

### systemd 管理命令

```bash
sudo systemctl status cf-workers-sub    # 查看状态
sudo systemctl restart cf-workers-sub   # 重启服务
sudo systemctl stop cf-workers-sub      # 停止服务
sudo journalctl -u cf-workers-sub -f    # 查看日志
```

## 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 检查端口占用
   sudo netstat -tlnp | grep :3000
   # 修改 .env 中的 PORT 配置
   ```

2. **权限问题**
   ```bash
   # 确保目录权限正确
   sudo chown -R www-data:www-data /opt/cf-workers-sub
   ```

3. **依赖安装失败**
   ```bash
   # 清除缓存重新安装
   rm -rf node_modules package-lock.json
   npm install
   ```

### 日志查看

- **应用日志**: `./logs/combined.log`
- **错误日志**: `./logs/err.log`
- **访问日志**: `./logs/access.log`

## 安全建议

1. **防火墙配置**
   ```bash
   # 只开放必要端口
   sudo ufw allow 3000/tcp
   sudo ufw enable
   ```

2. **反向代理** (推荐使用 Nginx)
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```

3. **定期更新**
   ```bash
   # 定期更新依赖
   npm audit fix
   ```

## 性能优化

1. **启用 gzip 压缩** (已内置)
2. **使用 PM2 集群模式**
   ```javascript
   // ecosystem.config.js
   instances: 'max'  // 使用所有CPU核心
   ```
3. **配置日志轮转**
   ```bash
   pm2 install pm2-logrotate
   ```

## 技术支持

如遇问题，请检查：
1. Node.js 版本是否符合要求
2. 配置文件是否正确
3. 网络连接是否正常
4. 日志文件中的错误信息

## 更新日志

### v1.0.0
- ✅ 完整移植 CF-Workers-SUB 所有功能
- ✅ 支持所有订阅格式转换
- ✅ 保持原项目完整逻辑
- ✅ 添加完整的部署和管理工具
