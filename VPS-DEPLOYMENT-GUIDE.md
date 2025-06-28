# CF-Workers-SUB VPS 部署完整指南

> 🚀 将 CF-Workers-SUB Node.js 版本部署到 VPS 的详细步骤指南

## 📋 部署前准备

### 系统要求
- **操作系统**: Ubuntu 18.04+ / CentOS 7+ / Debian 9+
- **内存**: 最少 512MB RAM（推荐 1GB+）
- **存储**: 最少 2GB 可用空间
- **网络**: 需要访问外部订阅源和转换API

### 准备工作
- VPS 服务器一台
- SSH 访问权限
- 域名（可选，用于HTTPS访问）

## 🔧 第一步：系统环境准备

### 1.1 更新系统包

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git unzip
```

**CentOS/RHEL:**
```bash
sudo yum update -y
sudo yum install -y curl wget git unzip
```

### 1.2 安装 Node.js

**方法一：使用 NodeSource 仓库（推荐）**

Ubuntu/Debian:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

CentOS/RHEL:
```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

**方法二：使用 NVM（Node Version Manager）**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

### 1.3 验证安装
```bash
node --version  # 应该显示 v18.x.x
npm --version   # 应该显示 9.x.x 或更高
```

## 📦 第二步：项目部署

### 2.1 创建项目目录
```bash
sudo mkdir -p /opt/cf-workers-sub
sudo chown $USER:$USER /opt/cf-workers-sub
cd /opt/cf-workers-sub
```

### 2.2 上传项目文件

**方法一：使用 Git（如果项目在 Git 仓库）**
```bash
git clone <项目仓库地址> .
```

**方法二：手动上传文件**
```bash
# 将本地项目文件上传到服务器
# 可以使用 scp, rsync, 或 FTP 工具
scp -r ./cf-workers-sub-nodejs/* user@your-server:/opt/cf-workers-sub/
```

### 2.3 安装项目依赖
```bash
cd /opt/cf-workers-sub
npm install
```

### 2.4 配置环境变量
```bash
# 复制配置模板
cp .env.example .env

# 编辑配置文件
nano .env
```

**重要配置项说明：**
```env
# 服务器配置
PORT=3000
HOST=0.0.0.0

# 外部访问地址（重要！）
EXTERNAL_URL=http://your-server-ip:3000

# 订阅配置
TOKEN=your-secure-token
FILENAME=CF-Workers-SUB

# Telegram 通知（可选）
TGTOKEN=your-telegram-bot-token
TGID=your-telegram-chat-id
TG=1

# 订阅源配置
LINK=your-subscription-links
LINKSUB=your-subscription-urls

# KV存储
KV=true
DATA_DIR=./data
```

## 🚀 第三步：启动服务

### 3.1 测试运行
```bash
# 测试启动
node app.js

# 如果看到以下输出说明启动成功：
# 🚀 CF-Workers-SUB Node.js 版本启动成功!
# 📡 服务地址: http://0.0.0.0:3000
```

### 3.2 安装 PM2（推荐）
```bash
# 全局安装 PM2
sudo npm install -g pm2

# 使用 PM2 启动服务
pm2 start ecosystem.config.js

# 查看服务状态
pm2 status

# 查看日志
pm2 logs cf-workers-sub

# 设置开机自启
pm2 startup
pm2 save
```

### 3.3 使用 systemd（备选方案）
```bash
# 复制服务文件
sudo cp cf-workers-sub.service /etc/systemd/system/

# 编辑服务文件，修改路径
sudo nano /etc/systemd/system/cf-workers-sub.service

# 启动服务
sudo systemctl daemon-reload
sudo systemctl enable cf-workers-sub
sudo systemctl start cf-workers-sub

# 查看状态
sudo systemctl status cf-workers-sub
```

## 🔒 第四步：安全配置

### 4.1 防火墙设置

**Ubuntu (UFW):**
```bash
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 3000/tcp    # 应用端口
sudo ufw enable
```

**CentOS (firewalld):**
```bash
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

### 4.2 创建专用用户（推荐）
```bash
# 创建专用用户
sudo useradd -r -s /bin/false cf-workers-sub

# 修改文件所有权
sudo chown -R cf-workers-sub:cf-workers-sub /opt/cf-workers-sub

# 更新 systemd 服务文件中的用户
sudo nano /etc/systemd/system/cf-workers-sub.service
# 修改 User=cf-workers-sub
```

## 🌐 第五步：域名和 HTTPS 配置（可选）

### 5.1 安装 Nginx
```bash
# Ubuntu/Debian
sudo apt install -y nginx

# CentOS/RHEL
sudo yum install -y nginx
```

### 5.2 配置 Nginx 反向代理
```bash
sudo nano /etc/nginx/sites-available/cf-workers-sub
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/cf-workers-sub /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 5.3 安装 SSL 证书（Let's Encrypt）
```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 第六步：监控和维护

### 6.1 日志管理
```bash
# PM2 日志
pm2 logs cf-workers-sub

# 系统日志
sudo journalctl -u cf-workers-sub -f

# 应用日志
tail -f /opt/cf-workers-sub/logs/combined.log
```

### 6.2 性能监控
```bash
# 安装 PM2 监控
pm2 install pm2-logrotate

# 查看资源使用
pm2 monit
```

### 6.3 备份策略
```bash
# 创建备份脚本
sudo nano /opt/backup-cf-workers-sub.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/cf-workers-sub-$DATE.tar.gz \
    /opt/cf-workers-sub \
    --exclude=/opt/cf-workers-sub/node_modules \
    --exclude=/opt/cf-workers-sub/logs

# 保留最近7天的备份
find $BACKUP_DIR -name "cf-workers-sub-*.tar.gz" -mtime +7 -delete
```

```bash
# 设置定时备份
sudo chmod +x /opt/backup-cf-workers-sub.sh
sudo crontab -e
# 添加：0 2 * * * /opt/backup-cf-workers-sub.sh
```

## 🔧 第七步：故障排除

### 7.1 常见问题

**端口被占用**
```bash
sudo netstat -tlnp | grep :3000
sudo lsof -i :3000
```

**权限问题**
```bash
sudo chown -R $USER:$USER /opt/cf-workers-sub
chmod +x start.sh
```

**依赖安装失败**
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**服务无法启动**
```bash
# 检查配置文件
node -c app.js

# 查看详细错误
DEBUG=* node app.js
```

### 7.2 性能优化

**启用 gzip 压缩**（已内置）

**使用 PM2 集群模式**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'cf-workers-sub',
    script: 'app.js',
    instances: 'max',  // 使用所有CPU核心
    exec_mode: 'cluster'
  }]
};
```

**优化 Nginx 配置**
```nginx
# 添加到 nginx.conf
gzip on;
gzip_types text/plain application/json text/css application/javascript;
client_max_body_size 10M;
```

## ✅ 第八步：验证部署

### 8.1 功能测试
```bash
# 测试基础访问
curl http://your-server:3000/your-token

# 测试订阅格式
curl http://your-server:3000/your-token?clash

# 测试管理界面
curl -H "User-Agent: Mozilla/5.0" http://your-server:3000/your-token
```

### 8.2 访问地址

部署成功后，可以通过以下地址访问：

- **管理界面**: `http://your-domain.com/your-token`
- **Base64订阅**: `http://your-domain.com/your-token?b64`
- **Clash订阅**: `http://your-domain.com/your-token?clash`
- **其他格式**: 添加对应参数 `?sb`, `?surge`, `?quanx`, `?loon`

## 🎉 部署完成

恭喜！您已经成功将 CF-Workers-SUB 部署到 VPS 上。

### 下一步建议：
1. 定期更新系统和依赖包
2. 监控服务运行状态
3. 定期备份重要数据
4. 根据需要调整配置参数

### 技术支持：
- 查看项目文档：`README.md`
- 查看部署文档：`DEPLOYMENT.md`
- 检查日志文件排查问题
