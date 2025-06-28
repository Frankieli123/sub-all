const fs = require('fs-extra');
const path = require('path');

const dataDir = process.env.DATA_DIR || './data';

/**
 * 文件系统KV存储实现
 */
class FileKV {
    constructor(baseDir = dataDir) {
        this.baseDir = baseDir;
        fs.ensureDirSync(this.baseDir);
    }

    /**
     * 获取数据
     */
    async get(key) {
        try {
            const filePath = path.join(this.baseDir, key);
            if (await fs.pathExists(filePath)) {
                return await fs.readFile(filePath, 'utf8');
            }
            return null;
        } catch (error) {
            console.error(`读取KV数据失败 ${key}:`, error);
            return null;
        }
    }

    /**
     * 存储数据
     */
    async put(key, value) {
        try {
            const filePath = path.join(this.baseDir, key);
            await fs.ensureDir(path.dirname(filePath));
            await fs.writeFile(filePath, value, 'utf8');
            return true;
        } catch (error) {
            console.error(`存储KV数据失败 ${key}:`, error);
            return false;
        }
    }

    /**
     * 删除数据
     */
    async delete(key) {
        try {
            const filePath = path.join(this.baseDir, key);
            if (await fs.pathExists(filePath)) {
                await fs.remove(filePath);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`删除KV数据失败 ${key}:`, error);
            return false;
        }
    }

    /**
     * 检查数据是否存在
     */
    async exists(key) {
        try {
            const filePath = path.join(this.baseDir, key);
            return await fs.pathExists(filePath);
        } catch (error) {
            console.error(`检查KV数据失败 ${key}:`, error);
            return false;
        }
    }
}

// 创建全局KV实例
const KV = new FileKV();

/**
 * 迁移地址列表 - 完全按照原worker.js逻辑
 */
async function 迁移地址列表(txt = 'LINK.txt') {
    const 旧数据 = await KV.get(`/${txt}`);
    const 新数据 = await KV.get(txt);

    if (旧数据 && !新数据) {
        // 写入新位置
        await KV.put(txt, 旧数据);
        // 删除旧数据
        await KV.delete(`/${txt}`);
        return true;
    }
    return false;
}

/**
 * KV管理界面 - 完全按照原worker.js的KV函数逻辑
 */
async function handleKV(req, res, txt = 'LINK.txt', guest, mytoken, FileName, subProtocol, subConverter, subConfig) {
    const url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
    
    try {
        // POST请求处理
        if (req.method === "POST") {
            try {
                const content = req.body;
                await KV.put(txt, content);
                return res.send("保存成功");
            } catch (error) {
                console.error('保存KV时发生错误:', error);
                return res.status(500).send("保存失败: " + error.message);
            }
        }

        // GET请求部分
        let content = '';
        let hasKV = true;

        if (hasKV) {
            try {
                content = await KV.get(txt) || '';
            } catch (error) {
                console.error('读取KV时发生错误:', error);
                content = '读取数据时发生错误: ' + error.message;
            }
        }

        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>${FileName} 订阅编辑</title>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body {
                            margin: 0;
                            padding: 15px; /* 调整padding */
                            box-sizing: border-box;
                            font-size: 13px; /* 设置全局字体大小 */
                        }
                        .editor-container {
                            width: 100%;
                            max-width: 100%;
                            margin: 0 auto;
                        }
                        .editor {
                            width: 100%;
                            height: 300px; /* 调整高度 */
                            margin: 15px 0; /* 调整margin */
                            padding: 10px; /* 调整padding */
                            box-sizing: border-box;
                            border: 1px solid #ccc;
                            border-radius: 4px;
                            font-size: 13px;
                            line-height: 1.5;
                            overflow-y: auto;
                            resize: none;
                        }
                        .save-container {
                            margin-top: 8px; /* 调整margin */
                            display: flex;
                            align-items: center;
                            gap: 10px; /* 调整gap */
                        }
                        .save-btn, .back-btn {
                            padding: 6px 15px; /* 调整padding */
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                        }
                        .save-btn {
                            background: #4CAF50;
                        }
                        .save-btn:hover {
                            background: #45a049;
                        }
                        .back-btn {
                            background: #666;
                        }
                        .back-btn:hover {
                            background: #555;
                        }
                        .save-status {
                            color: #666;
                        }
                    </style>
                    <script src="https://cdn.jsdelivr.net/npm/@keeex/qrcodejs-kx@1.0.2/qrcode.min.js"></script>
                </head>
                <body>
                    ################################################################<br>
                    Subscribe / sub 订阅地址, 点击链接自动 <strong>复制订阅链接</strong> 并 <strong>生成订阅二维码</strong> <br>
                    ---------------------------------------------------------------<br>
                    自适应订阅地址:<br>
                    <a href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/${mytoken}?sub','qrcode_0')" style="color:blue;text-decoration:underline;cursor:pointer;">https://${url.hostname}/${mytoken}</a><br>
                    <div id="qrcode_0" style="margin: 10px 10px 10px 10px;"></div>
                    Base64订阅地址:<br>
                    <a href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/${mytoken}?b64','qrcode_1')" style="color:blue;text-decoration:underline;cursor:pointer;">https://${url.hostname}/${mytoken}?b64</a><br>
                    <div id="qrcode_1" style="margin: 10px 10px 10px 10px;"></div>
                    clash订阅地址:<br>
                    <a href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/${mytoken}?clash','qrcode_2')" style="color:blue;text-decoration:underline;cursor:pointer;">https://${url.hostname}/${mytoken}?clash</a><br>
                    <div id="qrcode_2" style="margin: 10px 10px 10px 10px;"></div>
                    singbox订阅地址:<br>
                    <a href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/${mytoken}?sb','qrcode_3')" style="color:blue;text-decoration:underline;cursor:pointer;">https://${url.hostname}/${mytoken}?sb</a><br>
                    <div id="qrcode_3" style="margin: 10px 10px 10px 10px;"></div>
                    surge订阅地址:<br>
                    <a href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/${mytoken}?surge','qrcode_4')" style="color:blue;text-decoration:underline;cursor:pointer;">https://${url.hostname}/${mytoken}?surge</a><br>
                    <div id="qrcode_4" style="margin: 10px 10px 10px 10px;"></div>
                    loon订阅地址:<br>
                    <a href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/${mytoken}?loon','qrcode_5')" style="color:blue;text-decoration:underline;cursor:pointer;">https://${url.hostname}/${mytoken}?loon</a><br>
                    <div id="qrcode_5" style="margin: 10px 10px 10px 10px;"></div>
        `;

        // 继续HTML内容 - 完全按照原worker.js逻辑
        const htmlContinue = `
                    &nbsp;&nbsp;<strong><a href="javascript:void(0);" id="noticeToggle" onclick="toggleNotice()">查看访客订阅∨</a></strong><br>
                    <div id="noticeContent" class="notice-content" style="display: none;">
                        ---------------------------------------------------------------<br>
                        访客订阅只能使用订阅功能，无法查看配置页！<br>
                        GUEST（访客订阅TOKEN）: <strong>${guest}</strong><br>
                        ---------------------------------------------------------------<br>
                        自适应订阅地址:<br>
                        <a href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/sub?token=${guest}','guest_0')" style="color:blue;text-decoration:underline;cursor:pointer;">https://${url.hostname}/sub?token=${guest}</a><br>
                        <div id="guest_0" style="margin: 10px 10px 10px 10px;"></div>
                        Base64订阅地址:<br>
                        <a href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/sub?token=${guest}&b64','guest_1')" style="color:blue;text-decoration:underline;cursor:pointer;">https://${url.hostname}/sub?token=${guest}&b64</a><br>
                        <div id="guest_1" style="margin: 10px 10px 10px 10px;"></div>
                        clash订阅地址:<br>
                        <a href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/sub?token=${guest}&clash','guest_2')" style="color:blue;text-decoration:underline;cursor:pointer;">https://${url.hostname}/sub?token=${guest}&clash</a><br>
                        <div id="guest_2" style="margin: 10px 10px 10px 10px;"></div>
                        singbox订阅地址:<br>
                        <a href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/sub?token=${guest}&sb','guest_3')" style="color:blue;text-decoration:underline;cursor:pointer;">https://${url.hostname}/sub?token=${guest}&sb</a><br>
                        <div id="guest_3" style="margin: 10px 10px 10px 10px;"></div>
                        surge订阅地址:<br>
                        <a href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/sub?token=${guest}&surge','guest_4')" style="color:blue;text-decoration:underline;cursor:pointer;">https://${url.hostname}/sub?token=${guest}&surge</a><br>
                        <div id="guest_4" style="margin: 10px 10px 10px 10px;"></div>
                        loon订阅地址:<br>
                        <a href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/sub?token=${guest}&loon','guest_5')" style="color:blue;text-decoration:underline;cursor:pointer;">https://${url.hostname}/sub?token=${guest}&loon</a><br>
                        <div id="guest_5" style="margin: 10px 10px 10px 10px;"></div>
                    </div>
                    ---------------------------------------------------------------<br>
                    ################################################################<br>
                    订阅转换配置<br>
                    ---------------------------------------------------------------<br>
                    SUBAPI（订阅转换后端）: <strong>${subProtocol}://${subConverter}</strong><br>
                    SUBCONFIG（订阅转换配置文件）: <strong>${subConfig}</strong><br>
                    ---------------------------------------------------------------<br>
                    ################################################################<br>
                    ${FileName} 汇聚订阅编辑:
                    <div class="editor-container">
                        ${hasKV ? `
                        <textarea class="editor"
                            placeholder="${decodeURIComponent(Buffer.from('TElOSyVFNyVBNCVCQSVFNCVCRSU4QiVFRiVCQyU4OCVFNCVCOCU4MCVFOCVBMSU4QyVFNCVCOCU4MCVFNCVCOCVBQSVFOCU4QSU4MiVFNyU4MiVCOSVFOSU5MyVCRSVFNiU4RSVBNSVFNSU4RCVCMyVFNSU4RiVBRiVFRiVCQyU4OSVFRiVCQyU5QQp2bGVzcyUzQSUyRiUyRjI0NmFhNzk1LTA2MzctNGY0Yy04ZjY0LTJjOGZiMjRjMWJhZCU0MDEyNy4wLjAuMSUzQTEyMzQlM0ZlbmNyeXB0aW9uJTNEbm9uZSUyNnNlY3VyaXR5JTNEdGxzJTI2c25pJTNEVEcuQ01MaXVzc3NzLmxvc2V5b3VyaXAuY29tJTI2YWxsb3dJbnNlY3VyZSUzRDElMjZ0eXBlJTNEd3MlMjZob3N0JTNEVEcuQ01MaXVzc3NzLmxvc2V5b3VyaXAuY29tJTI2cGF0aCUzRCUyNTJGJTI1M0ZlZCUyNTNEMjU2MCUyM0NGbmF0CnRyb2phbiUzQSUyRiUyRmFhNmRkZDJmLWQxY2YtNGE1Mi1iYTFiLTI2NDBjNDFhNzg1NiU0MDIxOC4xOTAuMjMwLjIwNyUzQTQxMjg4JTNGc2VjdXJpdHklM0R0bHMlMjZzbmklM0RoazEyLmJpbGliaWxpLmNvbSUyNmFsbG93SW5zZWN1cmUlM0QxJTI2dHlwZSUzRHRjcCUyNmhlYWRlclR5cGUlM0Rub25lJTIzSEsKc3MlM0ElMkYlMkZZMmhoWTJoaE1qQXRhV1YwWmkxd2IyeDVNVE13TlRveVJYUlFjVzQyU0ZscVZVNWpTRzlvVEdaVmNFWlJkMjVtYWtORFVUVnRhREZ0U21SRlRVTkNkV04xVjFvNVVERjFaR3RTUzBodVZuaDFielUxYXpGTFdIb3lSbTgyYW5KbmRERTRWelkyYjNCMGVURmxOR0p0TVdwNlprTm1RbUklMjUzRCU0MDg0LjE5LjMxLjYzJTNBNTA4NDElMjNERQoKCiVFOCVBRSVBMiVFOSU5OCU4NSVFOSU5MyVCRSVFNiU4RSVBNSVFNSU4RCVCMyVFNSU4RiVBRiVFRiVCQyU4OCVFNCVCOCU4MCVFOCVBMSU4QyVFNCVCOCU4MCVFNCVCOCVBQSVFOCU4QSU4MiVFNyU4MiVCOSVFOSU5MyVCRSVFNiU4RSVBNSVFNSU4RCVCMyVFNSU4RiVBRiVFRiVCQyU4OSVFRiVCQyU5QQpodHRwcyUzQSUyRiUyRnN1Yi54Zi5mcmVlLmhyJTJGYXV0bw==', 'base64').toString())}"
                            id="content">${content}</textarea>
                        <div class="save-container">
                            <button class="save-btn" onclick="saveContent(this)">保存</button>
                            <span class="save-status" id="saveStatus"></span>
                        </div>
                        ` : '<p>请绑定 <strong>变量名称</strong> 为 <strong>KV</strong> 的KV命名空间</p>'}
                    </div>
                    <br>
                    ################################################################<br>
                    ${decodeURIComponent(Buffer.from('dGVsZWdyYW0lMjAlRTQlQkElQTQlRTYlQjUlODElRTclQkUlQTQlMjAlRTYlOEElODAlRTYlOUMlQUYlRTUlQTQlQTclRTQlQkQlQUMlN0UlRTUlOUMlQTglRTclQkElQkYlRTUlOEYlOTElRTclODklOEMhJTNDYnIlM0UKJTNDYSUyMGhyZWYlM0QlMjdodHRwcyUzQSUyRiUyRnQubWUlMkZDTUxpdXNzc3MlMjclM0VodHRwcyUzQSUyRiUyRnQubWUlMkZDTUxpdXNzc3MlM0MlMkZhJTNFJTNDYnIlM0UKLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJTNDYnIlM0UKZ2l0aHViJTIwJUU5JUExJUI5JUU3JTlCJUFFJUU1JTlDJUIwJUU1JTlEJTgwJTIwU3RhciFTdGFyIVN0YXIhISElM0NiciUzRQolM0NhJTIwaHJlZiUzRCUyN2h0dHBzJTNBJTJGJTJGZ2l0aHViLmNvbSUyRmNtbGl1JTJGQ0YtV29ya2Vycy1TVUIlMjclM0VodHRwcyUzQSUyRiUyRmdpdGh1Yi5jb20lMkZjbWxpdSUyRkNGLVdvcmtlcnMtU1VCJTNDJTJGYSUzRSUzQ2JyJTNFCi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSUzQ2JyJTNFCiUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMyUyMw==', 'base64').toString())}
                    <br><br>UA: <strong>${req.get('User-Agent')}</strong>
        `;

        return res.status(200).type('html').send(html + htmlContinue + getJavaScript());

    } catch (error) {
        console.error('处理请求时发生错误:', error);
        return res.status(500).send("服务器错误: " + error.message);
    }
}

/**
 * 获取JavaScript代码 - 完全按照原worker.js逻辑
 */
function getJavaScript() {
    return `
                    <script>
                    function copyToClipboard(text, qrcode) {
                        navigator.clipboard.writeText(text).then(() => {
                            alert('已复制到剪贴板');
                        }).catch(err => {
                            console.error('复制失败:', err);
                        });
                        const qrcodeDiv = document.getElementById(qrcode);
                        qrcodeDiv.innerHTML = '';
                        new QRCode(qrcodeDiv, {
                            text: text,
                            width: 220, // 调整宽度
                            height: 220, // 调整高度
                            colorDark: "#000000", // 二维码颜色
                            colorLight: "#ffffff", // 背景颜色
                            correctLevel: QRCode.CorrectLevel.Q, // 设置纠错级别
                            scale: 1 // 调整像素颗粒度
                        });
                    }

                    if (document.querySelector('.editor')) {
                        let timer;
                        const textarea = document.getElementById('content');
                        const originalContent = textarea.value;

                        function goBack() {
                            const currentUrl = window.location.href;
                            const parentUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/'));
                            window.location.href = parentUrl;
                        }

                        function replaceFullwidthColon() {
                            const text = textarea.value;
                            textarea.value = text.replace(/：/g, ':');
                        }

                        function saveContent(button) {
                            try {
                                const updateButtonText = (step) => {
                                    button.textContent = \`保存中: \${step}\`;
                                };
                                // 检测是否为iOS设备
                                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

                                // 仅在非iOS设备上执行replaceFullwidthColon
                                if (!isIOS) {
                                    replaceFullwidthColon();
                                }
                                updateButtonText('开始保存');
                                button.disabled = true;

                                // 获取textarea内容和原始内容
                                const textarea = document.getElementById('content');
                                if (!textarea) {
                                    throw new Error('找不到文本编辑区域');
                                }

                                updateButtonText('获取内容');
                                let newContent;
                                let originalContent;
                                try {
                                    newContent = textarea.value || '';
                                    originalContent = textarea.defaultValue || '';
                                } catch (e) {
                                    console.error('获取内容错误:', e);
                                    throw new Error('无法获取编辑内容');
                                }

                                updateButtonText('准备状态更新函数');
                                const updateStatus = (message, isError = false) => {
                                    const statusElem = document.getElementById('saveStatus');
                                    if (statusElem) {
                                        statusElem.textContent = message;
                                        statusElem.style.color = isError ? 'red' : '#666';
                                    }
                                };

                                updateButtonText('准备按钮重置函数');
                                const resetButton = () => {
                                    button.textContent = '保存';
                                    button.disabled = false;
                                };

                                if (newContent !== originalContent) {
                                    updateButtonText('发送保存请求');
                                    fetch(window.location.href, {
                                        method: 'POST',
                                        body: newContent,
                                        headers: {
                                            'Content-Type': 'text/plain;charset=UTF-8'
                                        },
                                        cache: 'no-cache'
                                    })
                                    .then(response => {
                                        updateButtonText('检查响应状态');
                                        if (!response.ok) {
                                            throw new Error(\`HTTP error! status: \${response.status}\`);
                                        }
                                        updateButtonText('更新保存状态');
                                        const now = new Date().toLocaleString();
                                        document.title = \`编辑已保存 \${now}\`;
                                        updateStatus(\`已保存 \${now}\`);
                                    })
                                    .catch(error => {
                                        updateButtonText('处理错误');
                                        console.error('Save error:', error);
                                        updateStatus(\`保存失败: \${error.message}\`, true);
                                    })
                                    .finally(() => {
                                        resetButton();
                                    });
                                } else {
                                    updateButtonText('检查内容变化');
                                    updateStatus('内容未变化');
                                    resetButton();
                                }
                            } catch (error) {
                                console.error('保存过程出错:', error);
                                button.textContent = '保存';
                                button.disabled = false;
                                const statusElem = document.getElementById('saveStatus');
                                if (statusElem) {
                                    statusElem.textContent = \`错误: \${error.message}\`;
                                    statusElem.style.color = 'red';
                                }
                            }
                        }

                        textarea.addEventListener('blur', saveContent);
                        textarea.addEventListener('input', () => {
                            clearTimeout(timer);
                            timer = setTimeout(saveContent, 5000);
                        });
                    }

                    function toggleNotice() {
                        const noticeContent = document.getElementById('noticeContent');
                        const noticeToggle = document.getElementById('noticeToggle');
                        if (noticeContent.style.display === 'none' || noticeContent.style.display === '') {
                            noticeContent.style.display = 'block';
                            noticeToggle.textContent = '隐藏访客订阅∧';
                        } else {
                            noticeContent.style.display = 'none';
                            noticeToggle.textContent = '查看访客订阅∨';
                        }
                    }

                    // 初始化 noticeContent 的 display 属性
                    document.addEventListener('DOMContentLoaded', () => {
                        document.getElementById('noticeContent').style.display = 'none';
                    });
                    </script>
                </body>
            </html>
    `;
}

module.exports = {
    KV,
    迁移地址列表,
    handleKV
};
