const crypto = require('crypto');
const axios = require('axios');

/**
 * 双重MD5加密 - 完全按照原worker.js逻辑
 */
async function MD5MD5(text) {
    const firstPass = crypto.createHash('md5').update(text).digest('hex');
    const secondPass = crypto.createHash('md5').update(firstPass.slice(7, 27)).digest('hex');
    return secondPass.toLowerCase();
}

/**
 * 文本处理函数 - 完全按照原worker.js逻辑
 */
async function ADD(envadd) {
    var addtext = envadd.replace(/[	"'|\r\n]+/g, '\n').replace(/\n+/g, '\n');	// 替换为换行
    if (addtext.charAt(0) == '\n') addtext = addtext.slice(1);
    if (addtext.charAt(addtext.length - 1) == '\n') addtext = addtext.slice(0, addtext.length - 1);
    const add = addtext.split('\n');
    return add;
}

/**
 * Base64解码函数 - 完全按照原worker.js逻辑
 */
function base64Decode(str) {
    const bytes = Buffer.from(str, 'base64');
    return bytes.toString('utf-8');
}

/**
 * Base64编码函数 - Node.js版本
 */
function base64Encode(str) {
    return Buffer.from(str, 'utf-8').toString('base64');
}

/**
 * 验证Base64格式 - 完全按照原worker.js逻辑
 */
function isValidBase64(str) {
    // 先移除所有空白字符(空格、换行、回车等)
    const cleanStr = str.replace(/\s/g, '');
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    return base64Regex.test(cleanStr);
}

/**
 * nginx默认页面 - 完全按照原worker.js逻辑
 */
async function nginx() {
    const text = `
    <!DOCTYPE html>
    <html>
    <head>
    <title>Welcome to nginx!</title>
    <style>
        body {
            width: 35em;
            margin: 0 auto;
            font-family: Tahoma, Verdana, Arial, sans-serif;
        }
    </style>
    </head>
    <body>
    <h1>Welcome to nginx!</h1>
    <p>If you see this page, the nginx web server is successfully installed and
    working. Further configuration is required.</p>
    
    <p>For online documentation and support please refer to
    <a href="http://nginx.org/">nginx.org</a>.<br/>
    Commercial support is available at
    <a href="http://nginx.com/">nginx.com</a>.</p>
    
    <p><em>Thank you for using nginx.</em></p>
    </body>
    </html>
    `;
    return text;
}

/**
 * 反向代理功能 - 完全按照原worker.js逻辑
 */
async function proxyURL(proxyURL, url, res) {
    const URLs = await ADD(proxyURL);
    const fullURL = URLs[Math.floor(Math.random() * URLs.length)];

    // 解析目标 URL
    let parsedURL = new URL(fullURL);
    console.log(parsedURL);
    
    // 提取并可能修改 URL 组件
    let URLProtocol = parsedURL.protocol.slice(0, -1) || 'https';
    let URLHostname = parsedURL.hostname;
    let URLPathname = parsedURL.pathname;
    let URLSearch = parsedURL.search;

    // 处理 pathname
    if (URLPathname.charAt(URLPathname.length - 1) == '/') {
        URLPathname = URLPathname.slice(0, -1);
    }
    URLPathname += url.pathname;

    // 构建新的 URL
    let newURL = `${URLProtocol}://${URLHostname}${URLPathname}${URLSearch}`;

    try {
        // 反向代理请求
        const response = await axios({
            method: 'GET',
            url: newURL,
            responseType: 'stream',
            timeout: 10000
        });

        // 设置响应头
        res.set(response.headers);
        res.set('X-New-URL', newURL);
        
        // 管道传输响应
        response.data.pipe(res);
    } catch (error) {
        console.error('代理请求失败:', error.message);
        res.status(500).send('代理请求失败');
    }
}

/**
 * Clash配置修复 - 完全按照原worker.js逻辑
 */
function clashFix(content) {
    if (content.includes('wireguard') && !content.includes('remote-dns-resolve')) {
        let lines;
        if (content.includes('\r\n')) {
            lines = content.split('\r\n');
        } else {
            lines = content.split('\n');
        }

        let result = "";
        for (let line of lines) {
            if (line.includes('type: wireguard')) {
                const 备改内容 = `, mtu: 1280, udp: true`;
                const 正确内容 = `, mtu: 1280, remote-dns-resolve: true, udp: true`;
                result += line.replace(new RegExp(备改内容, 'g'), 正确内容) + '\n';
            } else {
                result += line + '\n';
            }
        }
        content = result;
    }
    return content;
}

module.exports = {
    MD5MD5,
    ADD,
    base64Decode,
    base64Encode,
    isValidBase64,
    nginx,
    proxyURL,
    clashFix
};
