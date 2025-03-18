import { Api } from "telegram";
import fs from "fs";
import path from "path";
import { logger } from "../utils/index.js";
import cliProgress from 'cli-progress'; // 需要先安装: npm install cli-progress

class Downloader {
  constructor(client) {
    this.client = client;
    this.isProcessing = false;
    this.downloadQueue = [];
    this.activeDownloads = new Map(); // 记录活跃的下载任务
    this.maxConcurrent = 5; // 最大并发数
    // 创建多进度条管理器
    this.multiBar = new cliProgress.MultiBar({
      format: '{bar} {percentage}% | {downloadedMB}/{totalMB}MB | {filename}',
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true,
      clearOnComplete: false
    }, cliProgress.Presets.shades_classic);
  }

  async downloadVideo(message) {
    try {
      if (!message.media) {
        throw new Error("消息不包含媒体文件");
      }

      const document = message.media.document;
      const fileName =
        document.attributes.find(
          (attr) => attr.className === "DocumentAttributeFilename"
        )?.fileName || `video_${Date.now()}.mp4`;

      logger.info("开始下载视频:", fileName);
      logger.info("文件大小:", (document.size / 1024 / 1024).toFixed(2), "MB");

      // 创建下载目录
      const downloadDir = path.join(process.cwd(), "downloads");
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir);
      }
      const filePath = path.join(downloadDir, fileName);

      // 检查文件是否已存在
      if (fs.existsSync(filePath)) {
        logger.info("文件已存在，跳过下载:", filePath);
        return filePath;
      }

      // 添加随机延迟，避免请求过快
      const delay = Math.floor(Math.random() * 2000) + 3000; // 3-5秒随机延迟
      logger.info(`等待 ${delay/1000} 秒后开始下载...`);
      await new Promise((resolve) => setTimeout(resolve, delay));

      const totalBytes = document.size;
      const totalMB = (totalBytes / 1024 / 1024).toFixed(2);

      // 为这个下载任务创建一个进度条
      const progressBar = this.multiBar.create(totalBytes, 0, {
        filename: fileName,
        downloadedMB: '0.00',
        totalMB: totalMB
      });

      const buffer = await this.client.downloadFile(
        new Api.InputDocumentFileLocation({
          id: document.id,
          accessHash: document.accessHash,
          fileReference: document.fileReference,
          thumbSize: "",
        }),
        {
          dcId: document.dcId,
          progressCallback: (downloadedBytes) => {
            const currentBytes = Math.min(downloadedBytes, totalBytes);
            const currentMB = (currentBytes / 1024 / 1024).toFixed(2);
            
            progressBar.update(currentBytes, {
              downloadedMB: currentMB,
              totalMB: totalMB
            });
          }
        }
      );

      // 完成后移除这个进度条
      progressBar.stop();
      fs.writeFileSync(filePath, buffer);
      logger.info("视频下载完成:", filePath);
      return filePath;
    } catch (error) {
      logger.error("下载视频时出错:", error);
      throw error;
    }
  }

  // 添加到下载队列
  addToQueue(message) {
    this.downloadQueue.push(message);
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  // 处理单个下载任务
  async processDownload(message) {
    try {
      const result = await this.downloadVideo(message);
      return { success: true, result };
    } catch (error) {
      logger.error(`下载失败: ${error.message}`);
      return { success: false, error };
    } finally {
      // 从活跃下载中移除
      this.activeDownloads.delete(message.id);
      // 如果队列中还有任务，启动新的下载
      if (this.downloadQueue.length > 0) {
        const nextMessage = this.downloadQueue.shift();
        this.startDownload(nextMessage);
      }
    }
  }

  // 启动单个下载
  async startDownload(message) {
    if (!message) return;
    
    // 添加到活跃下载列表
    this.activeDownloads.set(message.id, message);
    // 开始下载，注意这里不要等待下载完成
    this.processDownload(message).catch(error => {
      logger.error(`下载出错: ${error.message}`);
    });
  }

  // 处理下载队列
  async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // 初始启动最大并发数量的下载
      const initialBatch = this.downloadQueue.splice(0, this.maxConcurrent);
      logger.info(`开始下载，当前队列中还有 ${this.downloadQueue.length} 个视频等待下载`);

      // 启动初始批次的下载，使用 Promise.all 并发执行
      const startPromises = initialBatch.map(message => this.startDownload(message));
      await Promise.all(startPromises);

      // 等待所有活跃下载完成
      while (this.activeDownloads.size > 0 || this.downloadQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 检查是否需要启动新的下载
        const availableSlots = this.maxConcurrent - this.activeDownloads.size;
        if (availableSlots > 0 && this.downloadQueue.length > 0) {
          const newBatch = this.downloadQueue.splice(0, availableSlots);
          const newStartPromises = newBatch.map(message => this.startDownload(message));
          await Promise.all(newStartPromises);
        }
      }

    } finally {
      this.isProcessing = false;
      this.multiBar.stop(); // 停止所有进度条
      logger.info('所有下载任务完成');
    }
  }

  // 批量添加到下载队列
  async queueVideos(messages) {
    logger.info(`添加 ${messages.length} 个视频到下载队列`);
    for (const message of messages) {
      this.addToQueue(message);
    }
  }

  // 获取当前下载状态
  getStatus() {
    return {
      activeDownloads: this.activeDownloads.size,
      queueLength: this.downloadQueue.length,
      isProcessing: this.isProcessing
    };
  }
}

export default Downloader;
