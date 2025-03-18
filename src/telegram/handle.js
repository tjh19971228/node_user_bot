import { MessageSender, DialogManager } from "./index.js";
import { logger } from "../utils/index.js";
import inquirer from "inquirer";
class Handle {
  constructor(client) {
    this.client = client;
    this.dialogManager = new DialogManager(this.client);
    this.messageSender = new MessageSender(this.client);
    this.groupList = null;
    this.me = null;
  }

  async handleSendGroupMessage() {
    if (!this.groupList) {
      this.groupList = await this.dialogManager.getCanPostGroupAndChannel();
    }
    await this.messageSender.sendMessage("honeyWifu", this.groupList);
  }

  async handleForwardMessage() {
    logger.info("开始监听并转发消息");
    if (!this.groupList) {
      this.groupList = await this.dialogManager.getCanPostGroupAndChannel();
    }
    if (!this.me) {
      this.me = await this.client.getMe();
      logger.info(
        `已登录用户:${this.me.firstName || this.me.username} ${this.me.id}`
      );
    }
    const { group } = await inquirer.prompt([
      {
        type: "list",
        name: "group",
        message: "请选择你要转发的群组",
        choices: this.groupList,
        loop: false,
      },
    ]);
    logger.info(`开始监听所有发送你发给自己的消息,并转发到${group}`);
    this.client.addEventHandler(async (event) => {
      if (event.className === "UpdateNewMessage" && event.message) {
        const message = event.message;
        if (message.peerId.userId.toString() === this.me.id.toString()) {
          await this.client.forwardMessages(group, {
            fromPeer: "me", // 从自己的聊天中转发
            messages: [message.id], // 要转发的消息ID
          });
          logger.info(`转发消息成功——消息正文:${message.message}`);
        }
      }
    });
  }
}

export default Handle;
