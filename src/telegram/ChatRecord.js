import { DialogManager, Downloader } from "./index.js";
import { Api } from "telegram";
import inquirer from "inquirer";
import { logger } from "../utils/logger.js";
class ChatRecord {
  constructor(client) {
    this.client = client;
    this.dialogManager = new DialogManager(this.client);
    this.groupList = null;
    this.downloader = new Downloader(this.client);
  }

  async getGroupVideoChatRecord() {
    if (!this.groupList) {
      this.groupList = await this.dialogManager.getCanPostGroupAndChannel({
        isAll: true,
        isPassBroadcast: true,
      });
    }
    // return this.groupList;
    const { group } = await inquirer.prompt([
      {
        type: "list",
        name: "group",
        message: "请选择你要查看的群组",
        choices: this.groupList.map((group) => ({
          name: group.name,
          value: group.id,
        })),
        loop: false,
      },
    ]);

    const result = await this.client.invoke(
      new Api.messages.GetHistory({
        peer: group,
        limit: 20,
      })
    );

    const videoList = result.messages.filter(
      (message) => message.media?.className === "MessageMediaDocument"
    );

    logger.info(`已为你找到${videoList.length}个视频`);

    videoList.forEach((message) => {
      this.downloader.downloadVideo(message);
    });
  }

  async getGroupAllVideoChatRecord() {
    if (!this.groupList) {
      this.groupList = await this.dialogManager.getCanPostGroupAndChannel({
        isAll: true,
        isPassBroadcast: true,
      });
    }
    const { group } = await inquirer.prompt([
      {
        type: "list",
        message: "请选择你要查看的群组",
        name: "group",
        choices: this.groupList.map((group) => ({
          name: group.name,
          value: group.id,
        })),
        loop: false,
      },
    ]);

    await this.getAllVideos(group);
  }

  async getAllVideos(group, batchSize = 20, total = 20) {
    try {
      let allVideos = [];
      let offsetId = 0;
      let hasMore = true;
      let currentTotal = 0;

      logger.info("开始获取历史消息...第0条-第20条");

      while (hasMore || currentTotal < total) {
        const result = await this.client.invoke(
          new Api.messages.GetHistory({
            peer: group,
            limit: batchSize,
            offsetId: offsetId, // 使用上一批次最后一条消息的ID作为偏移
            offsetDate: 0,
            addOffset: 0,
            maxId: 0,
            minId: 0,
            hash: BigInt(0),
          })
        );

        // 过滤出视频消息
        const videos = result.messages.filter(
          (message) => message.media?.className === "MessageMediaDocument"
        );

        allVideos = allVideos.concat(videos);
        currentTotal += videos.length;
        logger.info(`已获取 ${allVideos.length} 个视频`);

        // 检查是否还有更多消息
        if (result.messages.length < batchSize) {
          hasMore = false;
          logger.info("已获取所有历史消息");
        } else if (currentTotal >= total) {
          logger.info("已达到最大数量，停止获取");
          break;
        } else {
          // 更新offsetId为最后一条消息的ID
          offsetId = result.messages[result.messages.length - 1].id;

          // 可以添加延迟避免请求过快
          logger.info("等待3秒...");
          await new Promise((resolve) => setTimeout(resolve, 3000));
          logger.info("等待结束");
          logger.info(`继续获取...第${offsetId}条-${offsetId + batchSize}条`);
        }
      }

      logger.info(`总共找到 ${allVideos.length} 个视频`);
      const { download } = await inquirer.prompt([
        {
          type: "confirm",
          name: "download",
          message: "是否下载这些视频？",
          default: true,
        },
      ]);

      if (download) {
        // 使用新的队列系统
        await this.downloader.queueVideos(allVideos);
      }

      return allVideos;
    } catch (error) {
      logger.error(`获取历史消息失败: ${error.message}`);
      throw error;
    }
  }
}

export default ChatRecord;
