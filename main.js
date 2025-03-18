import { telegramClient, Menu, Handle } from "./src/telegram/index.js";
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
  if (selectedMenu === "群发消息") {
    const handle = new Handle(client);
    await handle.handleSendGroupMessage();
  } else {
    const handle = new Handle(client);
    await handle.handleForwardMessage();
  }
}

main().catch(console.error);
