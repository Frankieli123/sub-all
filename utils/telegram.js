const axios = require('axios');

/**
 * 发送Telegram消息 - 完全按照原worker.js的sendMessage函数逻辑
 */
async function sendMessage(type, ip, add_data = "", BotToken, ChatID) {
    if (BotToken !== '' && ChatID !== '') {
        let msg = "";
        
        try {
            const response = await axios({
                method: 'GET',
                url: `http://ip-api.com/json/${ip}?lang=zh-CN`,
                timeout: 5000,
                validateStatus: function (status) {
                    return status < 500;
                }
            });
            
            if (response.status == 200) {
                const ipInfo = response.data;
                msg = `${type}\nIP: ${ip}\n国家: ${ipInfo.country}\n<tg-spoiler>城市: ${ipInfo.city}\n组织: ${ipInfo.org}\nASN: ${ipInfo.as}\n${add_data}`;
            } else {
                msg = `${type}\nIP: ${ip}\n<tg-spoiler>${add_data}`;
            }
        } catch (error) {
            console.error('获取IP信息失败:', error.message);
            msg = `${type}\nIP: ${ip}\n<tg-spoiler>${add_data}`;
        }

        let url = "https://api.telegram.org/bot" + BotToken + "/sendMessage?chat_id=" + ChatID + "&parse_mode=HTML&text=" + encodeURIComponent(msg);
        
        try {
            const telegramResponse = await axios({
                method: 'GET',
                url: url,
                timeout: 10000,
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'User-Agent': 'Mozilla/5.0 Chrome/90.0.4430.72'
                },
                validateStatus: function (status) {
                    return status < 500;
                }
            });
            
            if (telegramResponse.status === 200) {
                console.log('Telegram消息发送成功');
            } else {
                console.error('Telegram消息发送失败:', telegramResponse.status, telegramResponse.statusText);
            }
            
            return telegramResponse;
        } catch (error) {
            console.error('发送Telegram消息时出错:', error.message);
            return null;
        }
    } else {
        console.log('Telegram配置未设置，跳过消息发送');
        return null;
    }
}

/**
 * 获取客户端IP地址
 */
function getClientIP(req) {
    return req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           req.ip ||
           '127.0.0.1';
}

/**
 * 格式化访问信息
 */
function formatAccessInfo(req) {
    const userAgent = req.get('User-Agent') || 'Unknown';
    const url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
    
    return `UA: ${userAgent}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`;
}

/**
 * 发送订阅获取通知
 */
async function sendSubscriptionNotification(req, FileName, BotToken, ChatID) {
    const ip = getClientIP(req);
    const accessInfo = formatAccessInfo(req);
    await sendMessage(`#获取订阅 ${FileName}`, ip, accessInfo, BotToken, ChatID);
}

/**
 * 发送编辑订阅通知
 */
async function sendEditNotification(req, FileName, BotToken, ChatID) {
    const ip = getClientIP(req);
    const accessInfo = formatAccessInfo(req);
    await sendMessage(`#编辑订阅 ${FileName}`, ip, accessInfo, BotToken, ChatID);
}

/**
 * 发送异常访问通知
 */
async function sendAbnormalAccessNotification(req, FileName, BotToken, ChatID) {
    const ip = getClientIP(req);
    const accessInfo = formatAccessInfo(req);
    await sendMessage(`#异常访问 ${FileName}`, ip, accessInfo, BotToken, ChatID);
}

module.exports = {
    sendMessage,
    getClientIP,
    formatAccessInfo,
    sendSubscriptionNotification,
    sendEditNotification,
    sendAbnormalAccessNotification
};
