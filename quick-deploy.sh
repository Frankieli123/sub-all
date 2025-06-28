#!/bin/bash

# CF-Workers-SUB VPS 快速部署脚本
# 适用于 Ubuntu 18.04+ / Debian 9+ 系统

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为 root 用户
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "请不要使用 root 用户运行此脚本"
        exit 1
    fi
}

# 检查系统类型
check_system() {
    if [[ -f /etc/debian_version ]]; then
        OS="debian"
        log_info "检测到 Debian/Ubuntu 系统"
    elif [[ -f /etc/redhat-release ]]; then
        OS="centos"
        log_info "检测到 CentOS/RHEL 系统"
    else
        log_error "不支持的操作系统"
        exit 1
    fi
}

# 更新系统
update_system() {
    log_info "更新系统包..."
    if [[ $OS == "debian" ]]; then
        sudo apt update && sudo apt upgrade -y
        sudo apt install -y curl wget git unzip build-essential
    else
        sudo yum update -y
        sudo yum groupinstall -y "Development Tools"
        sudo yum install -y curl wget git unzip
    fi
    log_success "系统更新完成"
}

# 安装 Node.js
install_nodejs() {
    log_info "安装 Node.js 18.x..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ $NODE_VERSION -ge 16 ]]; then
            log_success "Node.js 已安装，版本: $(node --version)"
            return
        fi
    fi
    
    if [[ $OS == "debian" ]]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    fi
    
    log_success "Node.js 安装完成，版本: $(node --version)"
}

# 安装 PM2
install_pm2() {
    log_info "安装 PM2..."
    if ! command -v pm2 &> /dev/null; then
        sudo npm install -g pm2
        log_success "PM2 安装完成"
    else
        log_success "PM2 已安装"
    fi
}

# 创建项目目录
create_project_dir() {
    log_info "创建项目目录..."
    PROJECT_DIR="/opt/cf-workers-sub"
    
    if [[ -d $PROJECT_DIR ]]; then
        log_warning "项目目录已存在，是否继续？(y/N)"
        read -r response
        if [[ ! $response =~ ^[Yy]$ ]]; then
            log_info "部署已取消"
            exit 0
        fi
    fi
    
    sudo mkdir -p $PROJECT_DIR
    sudo chown $USER:$USER $PROJECT_DIR
    log_success "项目目录创建完成: $PROJECT_DIR"
}

# 部署项目文件
deploy_project() {
    log_info "部署项目文件..."
    cd $PROJECT_DIR
    
    # 如果当前目录有项目文件，复制过去
    if [[ -f "../package.json" ]]; then
        cp -r ../* .
    elif [[ -f "./package.json" ]]; then
        log_info "项目文件已存在"
    else
        log_error "未找到项目文件，请确保在项目目录中运行此脚本"
        exit 1
    fi
    
    log_success "项目文件部署完成"
}

# 安装项目依赖
install_dependencies() {
    log_info "安装项目依赖..."
    cd $PROJECT_DIR
    npm install
    log_success "依赖安装完成"
}

# 配置环境变量
configure_env() {
    log_info "配置环境变量..."
    cd $PROJECT_DIR
    
    if [[ ! -f .env ]]; then
        cp .env.example .env
        log_warning "请编辑 .env 文件配置您的参数"
        log_info "重要配置项："
        echo "  - TOKEN: 访问令牌"
        echo "  - EXTERNAL_URL: 外部访问地址（如 http://your-server-ip:3000）"
        echo "  - TGTOKEN, TGID: Telegram 通知配置（可选）"
        echo "  - LINK, LINKSUB: 订阅源配置"
        
        read -p "是否现在编辑配置文件？(y/N): " -r
        if [[ $RESPONSE =~ ^[Yy]$ ]]; then
            nano .env
        fi
    else
        log_success "环境配置文件已存在"
    fi
}

# 配置防火墙
configure_firewall() {
    log_info "配置防火墙..."
    
    if command -v ufw &> /dev/null; then
        sudo ufw allow 22/tcp
        sudo ufw allow 3000/tcp
        sudo ufw --force enable
        log_success "UFW 防火墙配置完成"
    elif command -v firewall-cmd &> /dev/null; then
        sudo firewall-cmd --permanent --add-port=22/tcp
        sudo firewall-cmd --permanent --add-port=3000/tcp
        sudo firewall-cmd --reload
        log_success "firewalld 防火墙配置完成"
    else
        log_warning "未检测到防火墙，请手动配置"
    fi
}

# 启动服务
start_service() {
    log_info "启动服务..."
    cd $PROJECT_DIR
    
    # 测试启动
    log_info "测试应用启动..."
    timeout 10s node app.js || true
    
    # 使用 PM2 启动
    pm2 start ecosystem.config.js
    pm2 save
    
    # 设置开机自启
    pm2 startup | grep "sudo" | bash || true
    
    log_success "服务启动完成"
}

# 显示部署结果
show_result() {
    log_success "🎉 CF-Workers-SUB 部署完成！"
    echo
    echo "📋 部署信息："
    echo "  项目目录: $PROJECT_DIR"
    echo "  服务端口: 3000"
    echo "  配置文件: $PROJECT_DIR/.env"
    echo
    echo "🔗 访问地址："
    SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "your-server-ip")
    echo "  管理界面: http://$SERVER_IP:3000/your-token"
    echo "  Base64订阅: http://$SERVER_IP:3000/your-token?b64"
    echo "  Clash订阅: http://$SERVER_IP:3000/your-token?clash"
    echo
    echo "🛠️  管理命令："
    echo "  查看状态: pm2 status"
    echo "  查看日志: pm2 logs cf-workers-sub"
    echo "  重启服务: pm2 restart cf-workers-sub"
    echo "  停止服务: pm2 stop cf-workers-sub"
    echo
    echo "⚠️  重要提醒："
    echo "  1. 请编辑 $PROJECT_DIR/.env 文件配置您的参数"
    echo "  2. 确保 EXTERNAL_URL 设置为正确的外部访问地址"
    echo "  3. 建议配置域名和 HTTPS（参考 VPS-DEPLOYMENT-GUIDE.md）"
}

# 主函数
main() {
    echo "🚀 CF-Workers-SUB VPS 快速部署脚本"
    echo "======================================"
    
    check_root
    check_system
    update_system
    install_nodejs
    install_pm2
    create_project_dir
    deploy_project
    install_dependencies
    configure_env
    configure_firewall
    start_service
    show_result
}

# 运行主函数
main "$@"
