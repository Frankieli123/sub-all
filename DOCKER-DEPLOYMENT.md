# CF-Workers-SUB Docker 部署指南

> 🐳 使用 Docker 快速部署 CF-Workers-SUB Node.js 版本

## 📋 部署前准备

### 系统要求
- Docker 20.10+
- Docker Compose 2.0+
- 2GB+ 可用内存
- 5GB+ 可用存储空间

### 安装 Docker

**Ubuntu/Debian:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**CentOS/RHEL:**
```bash
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

**安装 Docker Compose:**
```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## 🚀 快速部署

### 方法一：使用 Docker Compose（推荐）

1. **准备项目文件**
```bash
# 创建项目目录
mkdir -p /opt/cf-workers-sub
cd /opt/cf-workers-sub

# 下载或复制项目文件到此目录
```

2. **配置环境变量**
```bash
# 复制配置模板
cp .env.example .env

# 编辑配置文件
nano .env
```

**重要配置项：**
```env
# 外部访问地址（重要！）
EXTERNAL_URL=http://your-server-ip:3000

# 访问令牌
TOKEN=your-secure-token

# Telegram 通知（可选）
TGTOKEN=your-telegram-bot-token
TGID=your-telegram-chat-id
TG=1

# 订阅源配置
LINK=your-subscription-links
LINKSUB=your-subscription-urls
```

3. **启动服务**
```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看状态
docker-compose ps
```

### 方法二：使用 Docker 命令

1. **构建镜像**
```bash
docker build -t cf-workers-sub .
```

2. **运行容器**
```bash
docker run -d \
  --name cf-workers-sub \
  --restart unless-stopped \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  -e TOKEN=your-secure-token \
  -e EXTERNAL_URL=http://your-server-ip:3000 \
  --env-file .env \
  cf-workers-sub
```

## 🔧 高级配置

### 使用 Nginx 反向代理

1. **启用 Nginx 服务**
```bash
# 使用 nginx profile 启动
docker-compose --profile nginx up -d
```

2. **创建 Nginx 配置**
```bash
# 创建 nginx.conf
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream cf-workers-sub {
        server cf-workers-sub:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;

        location / {
            proxy_pass http://cf-workers-sub;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF
```

### SSL/HTTPS 配置

1. **获取 SSL 证书**
```bash
# 使用 Certbot 获取证书
docker run -it --rm \
  -v $(pwd)/ssl:/etc/letsencrypt \
  -p 80:80 \
  certbot/certbot certonly --standalone \
  -d your-domain.com
```

2. **更新 Nginx 配置**
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://cf-workers-sub;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 📊 管理和监控

### 常用命令

```bash
# 查看容器状态
docker-compose ps

# 查看实时日志
docker-compose logs -f cf-workers-sub

# 重启服务
docker-compose restart cf-workers-sub

# 停止服务
docker-compose stop

# 完全删除
docker-compose down -v

# 更新镜像
docker-compose pull
docker-compose up -d
```

### 数据备份

```bash
# 备份数据目录
tar -czf cf-workers-sub-backup-$(date +%Y%m%d).tar.gz data logs .env

# 恢复数据
tar -xzf cf-workers-sub-backup-YYYYMMDD.tar.gz
```

### 监控和日志

```bash
# 查看容器资源使用
docker stats cf-workers-sub

# 进入容器
docker exec -it cf-workers-sub sh

# 查看应用日志
docker-compose logs --tail=100 cf-workers-sub
```

## 🔒 安全配置

### 防火墙设置

```bash
# 只开放必要端口
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
```

### 容器安全

```bash
# 定期更新基础镜像
docker-compose pull
docker-compose up -d

# 清理未使用的镜像
docker system prune -a
```

## 🚨 故障排除

### 常见问题

1. **容器无法启动**
```bash
# 查看详细错误
docker-compose logs cf-workers-sub

# 检查配置文件
docker-compose config
```

2. **端口冲突**
```bash
# 检查端口占用
sudo netstat -tlnp | grep :3000

# 修改端口映射
# 在 docker-compose.yml 中修改 ports: "3001:3000"
```

3. **权限问题**
```bash
# 修复数据目录权限
sudo chown -R 1001:1001 data logs
```

4. **网络问题**
```bash
# 重建网络
docker-compose down
docker network prune
docker-compose up -d
```

## ✅ 验证部署

### 功能测试

```bash
# 测试基础访问
curl http://localhost:3000/your-token

# 测试订阅格式
curl http://localhost:3000/your-token?clash

# 测试健康检查
curl http://localhost:3000/
```

### 访问地址

- **管理界面**: `http://your-server:3000/your-token`
- **Base64订阅**: `http://your-server:3000/your-token?b64`
- **Clash订阅**: `http://your-server:3000/your-token?clash`
- **其他格式**: 添加对应参数

## 🎉 部署完成

Docker 部署的优势：
- ✅ 环境隔离，避免依赖冲突
- ✅ 快速部署和扩展
- ✅ 易于备份和迁移
- ✅ 统一的运行环境

### 下一步建议：
1. 配置域名和 HTTPS
2. 设置定期备份
3. 监控容器运行状态
4. 定期更新镜像
