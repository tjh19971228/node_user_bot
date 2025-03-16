// 日志工具
export const logger = {
    debug: (title, ...args) => {
        console.log('\n调试信息 --------');
        console.log(title);
        args.forEach(arg => console.log(arg));
        console.log('--------\n');
    },
    info: (...args) => console.log(...args),
    error: (error, context) => {
        if (!error.message.includes('CHANNEL_PRIVATE')) {
            console.log(`检查 "${context}" 时出错:`, error.message);
        }
    }
};


