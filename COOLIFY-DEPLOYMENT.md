# Coolify 部署指南

> 🚀 使用 Coolify 部署 CF-Workers-SUB Node.js 版本（Redis存储）

## 📋 部署前准备

### 系统要求
- Coolify 4.0+
- Docker 支持
- 2GB+ 可用内存
- 5GB+ 可用存储空间

### 项目特性
- ✅ **Redis 存储**：使用 Redis 替代文件系统存储，更适合容器化部署
- ✅ **自动扩展**：支持多实例部署
- ✅ **数据持久化**：Redis 数据持久化存储
- ✅ **健康检查**：内置应用和 Redis 健康检查
- ✅ **资源优化**：Redis 内存限制和 LRU 策略

## 🚀 Coolify 部署步骤

### 方法一：Git 仓库部署（推荐）

1. **在 Coolify 中创建新项目**
   - 登录 Coolify 管理界面
   - 点击 "New Project"
   - 选择 "Git Repository"

2. **配置 Git 仓库**
   ```
   Repository URL: https://github.com/your-username/cf-workers-sub-express.git
   Branch: main
   Build Pack: Docker Compose
   ```

3. **选择 Docker Compose 文件**
   ```
   Docker Compose File: docker-compose.coolify.yml
   ```

4. **配置环境变量**
   在 Coolify 的环境变量设置中添加：
   ```env
   # 必需配置
   TOKEN=your-secure-token
   EXTERNAL_URL=https://your-domain.com
   
   # 订阅源配置
   LINK=your-subscription-links
   LINKSUB=your-subscription-urls
   
   # Telegram 通知（可选）
   TGTOKEN=your-telegram-bot-token
   TGID=your-telegram-chat-id
   TG=1
   
   # 其他可选配置
   FILENAME=CF-Workers-SUB
   SUBUPTIME=6
   GUESTTOKEN=guest-token
   ```

5. **部署应用**
   - 点击 "Deploy" 按钮
   - 等待构建和部署完成

### 方法二：Docker 镜像部署

1. **创建新服务**
   - 选择 "Docker Image"
   - 镜像名称：`your-registry/cf-workers-sub:latest`

2. **配置服务**
   ```yaml
   # 端口映射
   3000:3000
   
   # 环境变量（同上）
   
   # 数据卷
   redis-data:/data
   logs:/app/logs
   ```

3. **添加 Redis 服务**
   - 创建新的 Redis 服务
   - 镜像：`redis:7-alpine`
   - 配置数据持久化

## ⚙️ 环境变量配置

### 必需配置

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `TOKEN` | 访问令牌 | `your-secure-token` |
| `EXTERNAL_URL` | 外部访问地址 | `https://your-domain.com` |

### 订阅配置

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `LINK` | 订阅链接 | `vless://...` |
| `LINKSUB` | 订阅URL | `https://example.com/sub` |

### Redis 配置（自动配置）

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `REDIS_URL` | Redis连接地址 | `redis://redis:6379` |
| `REDIS_PREFIX` | Redis键前缀 | `cf-workers-sub:` |

### Telegram 通知（可选）

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `TGTOKEN` | Telegram Bot Token | `123456:ABC-DEF...` |
| `TGID` | Telegram Chat ID | `123456789` |
| `TG` | 启用通知 | `1` |

## 🔧 高级配置

### 自定义域名

1. **在 Coolify 中配置域名**
   - 进入项目设置
   - 添加自定义域名
   - 配置 SSL 证书（Let's Encrypt）

2. **更新 EXTERNAL_URL**
   ```env
   EXTERNAL_URL=https://your-custom-domain.com
   ```

### 资源限制

在 `docker-compose.coolify.yml` 中已配置：
```yaml
# Redis 内存限制
command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
```

### 扩展部署

```yaml
# 应用多实例
deploy:
  replicas: 3
  resources:
    limits:
      memory: 512M
    reservations:
      memory: 256M
```

## 📊 监控和维护

### 健康检查

应用和 Redis 都配置了健康检查：
```yaml
# 应用健康检查
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/"]
  interval: 30s
  timeout: 10s
  retries: 3

# Redis 健康检查  
healthcheck:
  test: ["CMD", "redis-cli", "ping"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### 日志查看

在 Coolify 管理界面中：
1. 进入项目详情
2. 点击 "Logs" 标签
3. 查看实时日志输出

### 数据备份

Redis 数据自动持久化到 `redis-data` 卷：
```bash
# 手动备份（在 Coolify 服务器上）
docker exec cf-workers-sub-redis redis-cli BGSAVE
```

## 🔒 安全配置

### 网络安全

- Redis 仅在内部网络中可访问
- 应用通过内部网络连接 Redis
- 外部仅暴露应用端口 3000

### 访问控制

```env
# 设置强密码令牌
TOKEN=your-very-secure-random-token

# 限制访客权限
GUESTTOKEN=limited-guest-token
```

## 🚨 故障排除

### 常见问题

1. **Redis 连接失败**
   ```bash
   # 检查 Redis 服务状态
   docker logs cf-workers-sub-redis
   
   # 检查网络连接
   docker exec cf-workers-sub ping redis
   ```

2. **应用启动失败**
   ```bash
   # 查看应用日志
   docker logs cf-workers-sub
   
   # 检查环境变量
   docker exec cf-workers-sub env | grep -E "(TOKEN|REDIS)"
   ```

3. **订阅转换失败**
   - 检查 `EXTERNAL_URL` 是否正确配置
   - 确认域名可以从外部访问
   - 验证订阅转换 API 可用性

### 性能优化

1. **Redis 优化**
   ```yaml
   # 增加内存限制
   command: redis-server --appendonly yes --maxmemory 512mb
   ```

2. **应用优化**
   ```yaml
   # 增加资源限制
   deploy:
     resources:
       limits:
         memory: 1G
         cpus: '1.0'
   ```

## ✅ 验证部署

### 功能测试

1. **访问管理界面**
   ```
   https://your-domain.com/your-token
   ```

2. **测试订阅格式**
   ```bash
   # Base64 订阅
   curl https://your-domain.com/your-token?b64
   
   # Clash 订阅
   curl https://your-domain.com/your-token?clash
   ```

3. **测试 Redis 存储**
   ```bash
   # 在管理界面编辑内容，检查是否保存成功
   ```

### 性能测试

```bash
# 并发测试
ab -n 100 -c 10 https://your-domain.com/your-token?b64
```

## 🎉 部署完成

恭喜！您已成功在 Coolify 上部署了 CF-Workers-SUB Node.js 版本。

### 访问地址

- **管理界面**: `https://your-domain.com/your-token`
- **Base64订阅**: `https://your-domain.com/your-token?b64`
- **Clash订阅**: `https://your-domain.com/your-token?clash`
- **其他格式**: 添加对应参数

### 优势总结

- ✅ **Redis 存储**：高性能、支持集群
- ✅ **容器化部署**：易于扩展和维护
- ✅ **自动化管理**：Coolify 自动处理部署和更新
- ✅ **数据持久化**：Redis 数据安全存储
- ✅ **健康监控**：自动故障检测和恢复

### 下一步建议

1. 配置监控和告警
2. 设置定期备份
3. 优化性能参数
4. 配置 CDN 加速
