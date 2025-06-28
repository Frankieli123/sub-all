const axios = require('axios');
const { clashFix, base64Encode } = require('./tools');

/**
 * 订阅格式转换处理 - 完全按照原worker.js逻辑
 */
async function handleSubscriptionConversion(req, res, {
    订阅格式,
    base64Data,
    订阅转换URL,
    subProtocol,
    subConverter,
    subConfig,
    SUBUpdateTime,
    FileName
}) {
    let subConverterUrl;

    // 根据订阅格式构建转换URL - 完全按照原逻辑
    if (订阅格式 == 'base64') {
        return res.set({
            "content-type": "text/plain; charset=utf-8",
            "Profile-Update-Interval": `${SUBUpdateTime}`,
        }).send(base64Data);
    } else if (订阅格式 == 'clash') {
        subConverterUrl = `${subProtocol}://${subConverter}/sub?target=clash&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
    } else if (订阅格式 == 'singbox') {
        subConverterUrl = `${subProtocol}://${subConverter}/sub?target=singbox&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
    } else if (订阅格式 == 'surge') {
        subConverterUrl = `${subProtocol}://${subConverter}/sub?target=surge&ver=4&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
    } else if (订阅格式 == 'quanx') {
        subConverterUrl = `${subProtocol}://${subConverter}/sub?target=quanx&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&udp=true`;
    } else if (订阅格式 == 'loon') {
        subConverterUrl = `${subProtocol}://${subConverter}/sub?target=loon&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false`;
    }

    try {
        console.log('订阅转换URL:', subConverterUrl);
        const subConverterResponse = await axios({
            method: 'GET',
            url: subConverterUrl,
            timeout: 30000,
            validateStatus: function (status) {
                return status < 500;
            }
        });

        if (subConverterResponse.status !== 200) {
            console.log('订阅转换失败，返回base64格式');
            return res.set({
                "content-type": "text/plain; charset=utf-8",
                "Profile-Update-Interval": `${SUBUpdateTime}`,
                "Profile-web-page-url": req.url.includes('?') ? req.url.split('?')[0] : req.url,
            }).send(base64Data);
        }

        let subConverterContent = subConverterResponse.data;
        
        // 如果是clash格式，应用修复
        if (订阅格式 == 'clash') {
            subConverterContent = clashFix(subConverterContent);
        }

        return res.set({
            "Content-Disposition": `attachment; filename*=utf-8''${encodeURIComponent(FileName)}`,
            "content-type": "text/plain; charset=utf-8",
            "Profile-Update-Interval": `${SUBUpdateTime}`,
            "Profile-web-page-url": req.url.includes('?') ? req.url.split('?')[0] : req.url,
        }).send(subConverterContent);

    } catch (error) {
        console.error('订阅转换错误:', error.message);
        return res.set({
            "content-type": "text/plain; charset=utf-8",
            "Profile-Update-Interval": `${SUBUpdateTime}`,
            "Profile-web-page-url": req.url.includes('?') ? req.url.split('?')[0] : req.url,
        }).send(base64Data);
    }
}

/**
 * 检测订阅格式 - 完全按照原worker.js逻辑
 */
function detectSubscriptionFormat(userAgent, url) {
    let 订阅格式 = 'base64';
    let 追加UA = 'v2rayn';

    if (userAgent.includes('null') || userAgent.includes('subconverter') || userAgent.includes('nekobox') || userAgent.includes(('CF-Workers-SUB').toLowerCase())) {
        订阅格式 = 'base64';
    } else if (userAgent.includes('clash') || (url.searchParams.has('clash') && !userAgent.includes('subconverter'))) {
        订阅格式 = 'clash';
    } else if (userAgent.includes('sing-box') || userAgent.includes('singbox') || ((url.searchParams.has('sb') || url.searchParams.has('singbox')) && !userAgent.includes('subconverter'))) {
        订阅格式 = 'singbox';
    } else if (userAgent.includes('surge') || (url.searchParams.has('surge') && !userAgent.includes('subconverter'))) {
        订阅格式 = 'surge';
    } else if (userAgent.includes('quantumult%20x') || (url.searchParams.has('quanx') && !userAgent.includes('subconverter'))) {
        订阅格式 = 'quanx';
    } else if (userAgent.includes('loon') || (url.searchParams.has('loon') && !userAgent.includes('subconverter'))) {
        订阅格式 = 'loon';
    }

    // URL参数覆盖检测 - 完全按照原逻辑
    if (url.searchParams.has('b64') || url.searchParams.has('base64')) {
        订阅格式 = 'base64';
    } else if (url.searchParams.has('clash')) {
        追加UA = 'clash';
        订阅格式 = 'clash';
    } else if (url.searchParams.has('singbox')) {
        追加UA = 'singbox';
        订阅格式 = 'singbox';
    } else if (url.searchParams.has('surge')) {
        追加UA = 'surge';
        订阅格式 = 'surge';
    } else if (url.searchParams.has('quanx')) {
        追加UA = 'Quantumult%20X';
        订阅格式 = 'quanx';
    } else if (url.searchParams.has('loon')) {
        追加UA = 'Loon';
        订阅格式 = 'loon';
    }

    return { 订阅格式, 追加UA };
}

/**
 * 处理订阅内容编码 - 完全按照原worker.js逻辑
 */
function encodeSubscriptionContent(req_data) {
    // 修复中文错误
    const utf8Encoder = new TextEncoder();
    const encodedData = utf8Encoder.encode(req_data);
    const utf8Decoder = new TextDecoder();
    const text = utf8Decoder.decode(encodedData);

    // 去重
    const uniqueLines = new Set(text.split('\n'));
    const result = [...uniqueLines].join('\n');

    let base64Data;
    try {
        base64Data = base64Encode(result);
    } catch (e) {
        // 如果标准base64编码失败，使用自定义编码 - 按照原逻辑
        function encodeBase64(data) {
            const binary = new TextEncoder().encode(data);
            let base64 = '';
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

            for (let i = 0; i < binary.length; i += 3) {
                const byte1 = binary[i];
                const byte2 = binary[i + 1] || 0;
                const byte3 = binary[i + 2] || 0;

                base64 += chars[byte1 >> 2];
                base64 += chars[((byte1 & 3) << 4) | (byte2 >> 4)];
                base64 += chars[((byte2 & 15) << 2) | (byte3 >> 6)];
                base64 += chars[byte3 & 63];
            }

            const padding = 3 - (binary.length % 3 || 3);
            return base64.slice(0, base64.length - padding) + '=='.slice(0, padding);
        }

        base64Data = encodeBase64(result);
    }

    return { result, base64Data };
}

module.exports = {
    handleSubscriptionConversion,
    detectSubscriptionFormat,
    encodeSubscriptionContent
};
