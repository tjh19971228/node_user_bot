import fs from 'fs';
import path from 'path';

const __dirname = path.resolve();

const fileHandler = {
    readJsonFile: (filePath) => {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            console.error('读取文件失败:', error);
            return null;
        }
    },

    writeJsonFile: (filePath, data) => {
        try {
            const dirPath = path.dirname(filePath);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('写入文件失败:', error);
            return false;
        }
    },

    readTemplate: (templateName) => {
        const filePath = path.join(__dirname, '/src/message', `${templateName}.json`);
        return fileHandler.readJsonFile(filePath);
    },

    readFilePath: (filePath) => {
        return path.resolve(__dirname, filePath);
    }
};

export default fileHandler;