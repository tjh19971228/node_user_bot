import { DialogManager } from "./index.js";
import { NewMessage } from "telegram/events/index.js";
import inquirer from "inquirer";
class Listener {
  constructor(client) {
    this.client = client;
    this.dialogManager = new DialogManager(this.client);
    this.channelList = null;
  }

  async listenToChannel() {
    if (!this.channelList) {
      this.channelList = await this.dialogManager.getCanPostGroupAndChannel({
        isAll: true,
        isPassBroadcast: true,
      });
    }
    // console.log(this.channelList);
    const { channel } = await inquirer.prompt([
      {
        type: "list",
        name: "channel",
        message: "请选择你要监听的频道",
        choices: this.channelList.map((channel) => ({
          name: channel.name,
          value: channel.id,
        })),
        loop: false,
      },
    ]);

    this.client.addEventHandler(
      async (event) => {
        if (event.className === "UpdateNewMessage") {
          const message = event.message;
          if (message.media) {
            const media = message.media;
            if (media.className === "MessageMediaDocument") {
              const document = media.document;
              // console.log(document);
              const isVideo = document.mimeType.includes("video");
              if (isVideo) {
                console.log("发现新视频消息:");
                console.log(
                  "- 文件名:",
                  document.attributes.find(
                    (attr) => attr.className === "DocumentAttributeFilename"
                  )?.fileName
                );
                console.log("- 文件大小:", document.size, "bytes");
              }
            }
          }
        }
      },
      new NewMessage({
        chats: [channel],
      })
    );
  }
}

export default Listener;
