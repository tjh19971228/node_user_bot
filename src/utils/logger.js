// 日志工具
export const logger = {
    debug: (title, ...args) => {
        const timestamp = new Date().toISOString().replace('Z', '');
        console.log(`[${timestamp}] [DEBUG] - ${title}`);
        if (args.length > 0) {
            console.log(`[${timestamp}] [DEBUG] - 附加信息:`);
            args.forEach(arg => console.log(`[${timestamp}] [DEBUG] - `, arg));
        }
    },
    info: (...args) => {
        const timestamp = new Date().toISOString().replace('Z', '');
        console.log(`[${timestamp}] [INFO] - ${args.join(' ')}`);
    },
    error: (error, context) => {
        if (!error.message.includes('CHANNEL_PRIVATE')) {
            const timestamp = new Date().toISOString().replace('Z', '');
            console.log(`[${timestamp}] [ERROR] - 检查 "${context}" 时出错: ${error.message}`);
        }
    }
};


