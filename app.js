const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

// 导入工具模块
const utils = require('./utils/tools');
const subHandler = require('./utils/subscription');
const telegramBot = require('./utils/telegram');
const kvStorage = require('./utils/storage');
const converter = require('./utils/converter');
const config = require('./utils/config');

const app = express();

// 配置变量 - 严格按照原项目逻辑
let mytoken = 'auto';
let guestToken = '';
let BotToken = '';
let ChatID = '';
let TG = 0;
let FileName = 'CF-Workers-SUB';
let SUBUpdateTime = 6;
let total = 99; // TB
let timestamp = 4102329600000; // 2099-12-31

// 节点链接 + 订阅链接 - 保持原项目默认值
let MainData = `
https://raw.githubusercontent.com/mfuu/v2ray/master/v2ray
`;

let urls = [];
let subConverter = "https://sub.nasl.cc:8888";
let subConfig = "https://raw.githubusercontent.com/Frankieli123/clash2/refs/heads/main/Clash-LIAN.ini";
let subProtocol = 'https';

// 中间件配置
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(cors());
app.use(express.text({ limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 日志中间件
app.use(morgan('combined', {
    stream: fs.createWriteStream(path.join(__dirname, 'logs', 'access.log'), { flags: 'a' })
}));

// 配置验证和初始化
const { errors, warnings } = config.validate();
if (errors.length > 0) {
    console.error('❌ 配置错误:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
}
if (warnings.length > 0) {
    console.warn('⚠️  配置警告:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
}

// 确保数据目录存在
const dataDir = config.get('DATA_DIR');
fs.ensureDirSync(dataDir);
fs.ensureDirSync('./logs');

// 创建示例配置文件
config.createExampleConfig();

// 主路由处理 - 完全按照原worker.js逻辑
app.all('*', async (req, res) => {
    try {
        const userAgentHeader = req.get('User-Agent');
        const userAgent = userAgentHeader ? userAgentHeader.toLowerCase() : "null";
        const url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
        const token = url.searchParams.get('token');
        
        // 环境变量读取 - 保持原逻辑
        mytoken = process.env.TOKEN || mytoken;
        BotToken = process.env.TGTOKEN || BotToken;
        ChatID = process.env.TGID || ChatID;
        TG = process.env.TG || TG;
        subConverter = process.env.SUBAPI || subConverter;
        
        if (subConverter.includes("http://")) {
            subConverter = subConverter.split("//")[1];
            subProtocol = 'http';
        } else {
            subConverter = subConverter.split("//")[1] || subConverter;
        }
        
        subConfig = process.env.SUBCONFIG || subConfig;
        FileName = process.env.SUBNAME || FileName;

        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        const timeTemp = Math.ceil(currentDate.getTime() / 1000);
        const fakeToken = await utils.MD5MD5(`${mytoken}${timeTemp}`);
        guestToken = process.env.GUESTTOKEN || process.env.GUEST || guestToken;
        if (!guestToken) guestToken = await utils.MD5MD5(mytoken);
        const 访客订阅 = guestToken;

        let UD = Math.floor(((timestamp - Date.now()) / timestamp * total * 1099511627776) / 2);
        total = total * 1099511627776;
        let expire = Math.floor(timestamp / 1000);
        SUBUpdateTime = process.env.SUBUPTIME || SUBUpdateTime;

        // 访问控制逻辑 - 完全保持原逻辑
        if (!([mytoken, fakeToken, 访客订阅].includes(token) || url.pathname == ("/" + mytoken) || url.pathname.includes("/" + mytoken + "?"))) {
            if (TG == 1 && url.pathname !== "/" && url.pathname !== "/favicon.ico") {
                await telegramBot.sendAbnormalAccessNotification(req, FileName, BotToken, ChatID);
            }
            if (process.env.URL302) {
                return res.redirect(302, process.env.URL302);
            } else if (process.env.URL) {
                return await utils.proxyURL(process.env.URL, url, res);
            } else {
                return res.status(200).type('html').send(await utils.nginx());
            }
        } else {
            // 订阅处理逻辑 - 完全按照原worker.js逻辑
            await handleSubscriptionRequest(req, res, {
                url, token, fakeToken, 访客订阅, userAgent, userAgentHeader,
                mytoken, FileName, BotToken, ChatID, TG,
                subProtocol, subConverter, subConfig, SUBUpdateTime,
                MainData, urls, UD, total, expire
            });
        }
    } catch (error) {
        console.error('请求处理错误:', error);
        res.status(500).send('服务器内部错误');
    }
});

/**
 * 处理订阅请求 - 完全按照原worker.js逻辑
 */
async function handleSubscriptionRequest(req, res, config) {
    const {
        url, token, fakeToken, 访客订阅, userAgent, userAgentHeader,
        mytoken, FileName, BotToken, ChatID, TG,
        subProtocol, subConverter, subConfig, SUBUpdateTime,
        UD, total, expire
    } = config;

    // 使用局部变量避免常量赋值错误
    let MainData = config.MainData;
    let urls = config.urls;

    try {
        // KV存储处理 - 按照原逻辑，默认启用
        const configManager = require('./utils/config');
        const hasKV = configManager.get('KV');
        if (hasKV) {
            await kvStorage.迁移地址列表('LINK.txt');
            if (userAgent.includes('mozilla') && !url.search) {
                await telegramBot.sendEditNotification(req, FileName, BotToken, ChatID);
                return await kvStorage.handleKV(req, res, 'LINK.txt', 访客订阅, mytoken, FileName, subProtocol, subConverter, subConfig);
            } else {
                const storedData = await kvStorage.KV.get('LINK.txt');
                if (storedData) MainData = storedData;
            }
        } else {
            if (process.env.LINK) MainData = process.env.LINK;
            if (process.env.LINKSUB) urls = await utils.ADD(process.env.LINKSUB);
        }

        let 重新汇总所有链接 = await utils.ADD(MainData + '\n' + urls.join('\n'));
        let 自建节点 = "";
        let 订阅链接 = "";

        for (let x of 重新汇总所有链接) {
            if (x.toLowerCase().startsWith('http')) {
                订阅链接 += x + '\n';
            } else {
                自建节点 += x + '\n';
            }
        }

        MainData = 自建节点;
        urls = await utils.ADD(订阅链接);

        await telegramBot.sendSubscriptionNotification(req, FileName, BotToken, ChatID);

        // 检测订阅格式
        const { 订阅格式, 追加UA } = converter.detectSubscriptionFormat(userAgent, url);

        // 构建订阅转换URL - 支持外部访问地址配置
        let baseUrl = url.origin;

        // 如果配置了外部访问地址，使用配置的地址
        if (process.env.EXTERNAL_URL) {
            baseUrl = process.env.EXTERNAL_URL;
        } else if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
            // 如果是localhost访问，尝试替换为内网IP
            const os = require('os');
            const networkInterfaces = os.networkInterfaces();
            let localIP = 'localhost';

            // 查找内网IP地址
            for (const interfaceName in networkInterfaces) {
                const interfaces = networkInterfaces[interfaceName];
                for (const iface of interfaces) {
                    if (iface.family === 'IPv4' && !iface.internal && iface.address.startsWith('192.168.')) {
                        localIP = iface.address;
                        break;
                    }
                }
                if (localIP !== 'localhost') break;
            }

            if (localIP !== 'localhost') {
                baseUrl = `${url.protocol}//${localIP}:${url.port || 3000}`;
                console.log(`🔄 自动检测到内网IP: ${localIP}，订阅转换将使用此地址`);
            }
        }

        let 订阅转换URL = `${baseUrl}/${await utils.MD5MD5(fakeToken)}?token=${fakeToken}`;
        let req_data = MainData;

        const 订阅链接数组 = [...new Set(urls)].filter(item => item?.trim?.()); // 去重
        if (订阅链接数组.length > 0) {
            const 请求订阅响应内容 = await subHandler.getSUB(订阅链接数组, req, 追加UA, userAgentHeader);
            console.log(请求订阅响应内容);
            req_data += 请求订阅响应内容[0].join('\n');
            订阅转换URL += "|" + 请求订阅响应内容[1];
        }

        if (process.env.WARP) 订阅转换URL += "|" + (await utils.ADD(process.env.WARP)).join("|");

        // 编码订阅内容
        const { result, base64Data } = converter.encodeSubscriptionContent(req_data);

        if (订阅格式 == 'base64' || token == fakeToken) {
            return res.set({
                "content-type": "text/plain; charset=utf-8",
                "Profile-Update-Interval": `${SUBUpdateTime}`,
            }).send(base64Data);
        } else {
            // 使用订阅转换
            return await converter.handleSubscriptionConversion(req, res, {
                订阅格式,
                base64Data,
                订阅转换URL,
                subProtocol,
                subConverter,
                subConfig,
                SUBUpdateTime,
                FileName
            });
        }
    } catch (error) {
        console.error('订阅处理错误:', error);
        res.status(500).send('订阅处理失败');
    }
}

// 启动服务器
const PORT = config.get('PORT');
const HOST = config.get('HOST');

app.listen(PORT, HOST, () => {
    console.log(`🚀 CF-Workers-SUB Node.js 版本启动成功!`);
    config.printConfig();
    console.log(`⏰ 启动时间: ${new Date().toLocaleString()}`);
});

module.exports = app;
