import {
  telegramClient,
  Menu,
  Handle,
  Listener,
  ChatRecord,
} from "./src/telegram/index.js";
import { logger } from "./src/utils/index.js";
import { handleLogin } from "./src/auth/login.js";

async function main() {
  // 使用抽取出的登录逻辑
  const stringSession = await handleLogin();

  const client = await telegramClient.initializeClient(stringSession);
  await client.connect();
  logger.info("登录成功");

  const menu = new Menu();
  const selectedMenu = await menu.getSelectedMenu();
  const handle = new Handle(client);

  switch (selectedMenu) {
    case "群发消息":
      await handle.handleSendGroupMessage();
      break;
    case "监听并转发消息":
      await handle.handleForwardMessage();
      break;
    case "监听频道":
      const listener = new Listener(client);
      await listener.listenToChannel();
      break;
    case "查看群组视频消息":
      const chatRecord = new ChatRecord(client);
      await chatRecord.getGroupAllVideoChatRecord();
      break;
  }
}

main().catch(console.error);
