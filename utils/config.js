const fs = require('fs-extra');
const path = require('path');

/**
 * 配置管理类 - 完全按照原worker.js的环境变量逻辑
 */
class ConfigManager {
    constructor() {
        this.config = {};
        this.loadConfig();
    }

    /**
     * 加载配置
     */
    loadConfig() {
        // 默认配置 - 完全按照原worker.js
        this.config = {
            // 服务器配置
            PORT: process.env.PORT || 3000,
            HOST: process.env.HOST || '0.0.0.0',
            
            // 订阅配置
            TOKEN: process.env.TOKEN || 'auto',
            GUESTTOKEN: process.env.GUESTTOKEN || process.env.GUEST || '',
            FILENAME: process.env.SUBNAME || process.env.FILENAME || 'CF-Workers-SUB',
            SUBUPTIME: parseInt(process.env.SUBUPTIME || '6'),
            
            // Telegram 通知配置
            TGTOKEN: process.env.TGTOKEN || '',
            TGID: process.env.TGID || '',
            TG: parseInt(process.env.TG || '0'),
            
            // 订阅转换配置
            SUBAPI: process.env.SUBAPI || 'https://sub.nasl.cc:8888',
            SUBCONFIG: process.env.SUBCONFIG || 'https://raw.githubusercontent.com/Frankieli123/clash2/refs/heads/main/Clash-LIAN.ini',
            
            // 订阅源配置
            LINK: process.env.LINK || '',
            LINKSUB: process.env.LINKSUB || '',
            
            // 重定向配置
            URL302: process.env.URL302 || '',
            URL: process.env.URL || '',
            
            // WARP 配置
            WARP: process.env.WARP || '',
            
            // KV存储配置 - 默认启用文件存储
            KV: process.env.KV !== 'false',
            DATA_DIR: process.env.DATA_DIR || './data',
            
            // 其他配置
            TOTAL: parseInt(process.env.TOTAL || '99'), // TB
            TIMESTAMP: parseInt(process.env.TIMESTAMP || '4102329600000'), // 2099-12-31
            
            // 默认订阅源 - 完全按照原worker.js
            DEFAULT_MAINDATA: `
https://raw.githubusercontent.com/mfuu/v2ray/master/v2ray
`
        };
    }

    /**
     * 获取配置值
     */
    get(key, defaultValue = null) {
        return this.config[key] !== undefined ? this.config[key] : defaultValue;
    }

    /**
     * 设置配置值
     */
    set(key, value) {
        this.config[key] = value;
    }

    /**
     * 获取所有配置
     */
    getAll() {
        return { ...this.config };
    }

    /**
     * 验证配置
     */
    validate() {
        const errors = [];
        const warnings = [];

        // 验证端口
        const port = this.get('PORT');
        if (isNaN(port) || port < 1 || port > 65535) {
            errors.push(`无效的端口号: ${port}`);
        }

        // 验证订阅更新时间
        const subuptime = this.get('SUBUPTIME');
        if (isNaN(subuptime) || subuptime < 1) {
            warnings.push(`订阅更新时间设置异常: ${subuptime}，将使用默认值6小时`);
            this.set('SUBUPTIME', 6);
        }

        // 验证TG配置
        const tg = this.get('TG');
        if (isNaN(tg) || (tg !== 0 && tg !== 1)) {
            warnings.push(`TG配置异常: ${tg}，将使用默认值0`);
            this.set('TG', 0);
        }

        // 验证Telegram配置完整性
        const tgToken = this.get('TGTOKEN');
        const tgId = this.get('TGID');
        if ((tgToken && !tgId) || (!tgToken && tgId)) {
            warnings.push('Telegram配置不完整，需要同时设置TGTOKEN和TGID');
        }

        // 验证订阅转换API
        const subapi = this.get('SUBAPI');
        if (subapi && !subapi.includes('://')) {
            warnings.push(`订阅转换API格式可能有误: ${subapi}`);
        }

        // 验证数据目录
        const dataDir = this.get('DATA_DIR');
        try {
            fs.ensureDirSync(dataDir);
        } catch (error) {
            errors.push(`无法创建数据目录 ${dataDir}: ${error.message}`);
        }

        return { errors, warnings };
    }

    /**
     * 打印配置信息
     */
    printConfig() {
        console.log('\n📋 配置信息:');
        console.log('=====================================');
        console.log(`🌐 服务地址: http://${this.get('HOST')}:${this.get('PORT')}`);
        console.log(`🔑 TOKEN: ${this.get('TOKEN')}`);
        console.log(`👥 访客TOKEN: ${this.get('GUESTTOKEN') || '未设置'}`);
        console.log(`📝 文件名: ${this.get('FILENAME')}`);
        console.log(`⏰ 更新间隔: ${this.get('SUBUPTIME')}小时`);
        console.log(`🔄 订阅转换: ${this.get('SUBAPI')}`);
        console.log(`📁 数据目录: ${this.get('DATA_DIR')}`);
        console.log(`💾 KV存储: ${this.get('KV') ? '启用' : '禁用'}`);
        
        const tgToken = this.get('TGTOKEN');
        const tgId = this.get('TGID');
        if (tgToken && tgId) {
            console.log(`📱 Telegram: 已配置 (TG=${this.get('TG')})`);
        } else {
            console.log(`📱 Telegram: 未配置`);
        }
        
        console.log('=====================================\n');
    }

    /**
     * 创建示例配置文件
     */
    createExampleConfig() {
        const examplePath = '.env.example';
        if (!fs.existsSync(examplePath)) {
            const exampleContent = `# 服务器配置
PORT=3000
HOST=0.0.0.0

# 订阅配置
TOKEN=auto
GUESTTOKEN=
FILENAME=CF-Workers-SUB
SUBUPTIME=6

# Telegram 通知配置 (可选)
TGTOKEN=
TGID=
TG=0

# 订阅转换配置
SUBAPI=https://sub.nasl.cc:8888
SUBCONFIG=https://raw.githubusercontent.com/Frankieli123/clash2/refs/heads/main/Clash-LIAN.ini

# 订阅源配置
LINK=
LINKSUB=

# 重定向配置 (可选)
URL302=
URL=

# WARP 配置 (可选)
WARP=

# KV存储配置
KV=false
DATA_DIR=./data

# 其他配置
TOTAL=99
TIMESTAMP=4102329600000
`;
            fs.writeFileSync(examplePath, exampleContent);
            console.log(`✅ 已创建示例配置文件: ${examplePath}`);
        }
    }
}

// 创建全局配置实例
const config = new ConfigManager();

module.exports = config;
