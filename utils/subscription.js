const axios = require('axios');
const { ADD, base64Decode, isValidBase64 } = require('./tools');

/**
 * 获取订阅内容 - 完全按照原worker.js的getSUB函数逻辑
 */
async function getSUB(api, request, 追加UA, userAgentHeader) {
    if (!api || api.length === 0) {
        return [];
    } else api = [...new Set(api)]; // 去重
    
    let newapi = "";
    let 订阅转换URLs = "";
    let 异常订阅 = "";
    
    const controller = new AbortController(); // 创建一个AbortController实例，用于取消请求
    const timeout = setTimeout(() => {
        controller.abort(); // 2秒后取消所有请求
    }, 2000);

    try {
        // 使用Promise.allSettled等待所有API请求完成，无论成功或失败
        const responses = await Promise.allSettled(api.map(apiUrl => 
            getUrl(request, apiUrl, 追加UA, userAgentHeader, controller.signal)
                .then(response => response.status === 200 ? response.data : Promise.reject(response))
        ));

        // 遍历所有响应
        const modifiedResponses = responses.map((response, index) => {
            // 检查是否请求成功
            if (response.status === 'rejected') {
                const reason = response.reason;
                if (reason && reason.name === 'AbortError') {
                    return {
                        status: '超时',
                        value: null,
                        apiUrl: api[index] // 将原始的apiUrl添加到返回对象中
                    };
                }
                console.error(`请求失败: ${api[index]}, 错误信息: ${reason.status} ${reason.statusText}`);
                return {
                    status: '请求失败',
                    value: null,
                    apiUrl: api[index] // 将原始的apiUrl添加到返回对象中
                };
            }
            return {
                status: response.status,
                value: response.value,
                apiUrl: api[index] // 将原始的apiUrl添加到返回对象中
            };
        });

        console.log(modifiedResponses); // 输出修改后的响应数组

        for (const response of modifiedResponses) {
            // 检查响应状态是否为'fulfilled'
            if (response.status === 'fulfilled') {
                const content = response.value || 'null'; // 获取响应的内容
                if (content.includes('proxies:')) {
                    //console.log('Clash订阅: ' + response.apiUrl);
                    订阅转换URLs += "|" + response.apiUrl; // Clash 配置
                } else if (content.includes('outbounds"') && content.includes('inbounds"')) {
                    //console.log('Singbox订阅: ' + response.apiUrl);
                    订阅转换URLs += "|" + response.apiUrl; // Singbox 配置
                } else if (content.includes('://')) {
                    //console.log('明文订阅: ' + response.apiUrl);
                    newapi += content + '\n'; // 追加内容
                } else if (isValidBase64(content)) {
                    //console.log('Base64订阅: ' + response.apiUrl);
                    newapi += base64Decode(content) + '\n'; // 解码并追加内容
                } else {
                    const 异常订阅LINK = `trojan://CMLiussss@127.0.0.1:8888?security=tls&allowInsecure=1&type=tcp&headerType=none#%E5%BC%82%E5%B8%B8%E8%AE%A2%E9%98%85%20${response.apiUrl.split('://')[1].split('/')[0]}`;
                    console.log('异常订阅: ' + 异常订阅LINK);
                    异常订阅 += `${异常订阅LINK}\n`;
                }
            }
        }
    } catch (error) {
        console.error(error); // 捕获并输出错误信息
    } finally {
        clearTimeout(timeout); // 清除定时器
    }

    const 订阅内容 = await ADD(newapi + 异常订阅); // 将处理后的内容转换为数组
    // 返回处理后的结果
    return [订阅内容, 订阅转换URLs];
}

/**
 * 获取URL内容 - 完全按照原worker.js的getUrl函数逻辑
 */
async function getUrl(request, targetUrl, 追加UA, userAgentHeader, signal) {
    // 设置自定义 User-Agent
    const userAgent = `${Buffer.from('djJyYXlOLzYuNDU=', 'base64').toString()} cmliu/CF-Workers-SUB ${追加UA}(${userAgentHeader})`;
    
    // 输出请求的详细信息
    console.log(`请求URL: ${targetUrl}`);
    console.log(`请求User-Agent: ${userAgent}`);

    try {
        // 发送请求并返回响应
        const response = await axios({
            method: 'GET',
            url: targetUrl,
            headers: {
                'User-Agent': userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive'
            },
            timeout: 10000,
            signal: signal,
            validateStatus: function (status) {
                return status < 500; // 只有状态码大于等于500才认为是错误
            }
        });

        return response;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw error;
        }
        console.error(`请求失败: ${targetUrl}, 错误: ${error.message}`);
        throw error;
    }
}

module.exports = {
    getSUB,
    getUrl
};
