#!/bin/bash

# CF-Workers-SUB Node.js 版本启动脚本

echo "🚀 启动 CF-Workers-SUB Node.js 版本..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 16+ 版本"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

# 检查Node.js版本
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js 版本过低，需要 16+ 版本，当前版本: $(node -v)"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"

# 检查是否存在package.json
if [ ! -f "package.json" ]; then
    echo "❌ 未找到 package.json 文件，请确保在项目根目录运行此脚本"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖包..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

# 检查.env文件
if [ ! -f ".env" ]; then
    echo "⚠️  未找到 .env 配置文件"
    if [ -f ".env.example" ]; then
        echo "📋 复制示例配置文件..."
        cp .env.example .env
        echo "✅ 已创建 .env 文件，请编辑配置后重新运行"
        echo "📝 配置文件位置: $(pwd)/.env"
        exit 0
    else
        echo "⚠️  将使用默认配置启动"
    fi
fi

# 创建必要目录
echo "📁 创建必要目录..."
mkdir -p data logs

# 检查PM2是否安装
if command -v pm2 &> /dev/null; then
    echo "🔄 使用 PM2 启动服务..."
    pm2 start ecosystem.config.js
    echo "✅ 服务已启动"
    echo "📊 查看状态: pm2 status"
    echo "📋 查看日志: pm2 logs cf-workers-sub"
    echo "🔄 重启服务: pm2 restart cf-workers-sub"
    echo "🛑 停止服务: pm2 stop cf-workers-sub"
else
    echo "⚠️  PM2 未安装，使用 Node.js 直接启动..."
    echo "💡 建议安装 PM2: npm install -g pm2"
    echo "🚀 启动服务..."
    node app.js
fi
