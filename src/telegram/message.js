import inquirer from 'inquirer';
import fileHandler from '../utils/fileHandler.js';
import { logger } from '../utils/logger.js';

class MessageSender {
    constructor(client) {
        this.client = client;
    }

    async getMessage(templateName) {
        const template = fileHandler.readTemplate(templateName);
        if (!template) {
            throw new Error(`模板 ${templateName} 不存在`);
        }
        return template;
    }

    async sendMessage(templateName, groupList) {
        const template = await this.getMessage(templateName);
        // await this.client.sendMessage(chatId, template);
        const text = template.text;
        const filePath = template.filePath;
        const trueFilePath = fileHandler.readFilePath(filePath);
        // console.log(text, trueFilePath);
        const { group } = await inquirer.prompt([
            {
                type: 'list',
                name: 'group',
                message: '请选择你要发送的群组',
                choices: groupList.map(g => g.name).concat("--All--"),
                loop: false
            }
        ]);
        if (group === "--All--") {
            for (const groupInfo of groupList.slice(1, 3)) {
                logger.info(`开始发送消息到群组: ${groupInfo.name}`);
                await this.client.sendFile(groupInfo.id, {
                    file: trueFilePath,
                    caption: text,
                    parseMode: "html",
                    forceDocument: false,
                });
                logger.info('消息发送成功');
                const randomSleep = Math.max(Math.floor(Math.random() * 1000) + 3000, 5000)
                await new Promise(resolve => setTimeout(resolve, randomSleep));
            }
        } else {
            const groupInfo = groupList.find(g => g.name === group);
            logger.info(`开始发送消息到群组: ${groupInfo.name}`);
            await this.client.sendFile(groupInfo.id, {
                file: trueFilePath,
                caption: text,
                parseMode: "html",
                forceDocument: false,
            });
            logger.info('消息发送成功');
        }
    }
}

export default MessageSender;