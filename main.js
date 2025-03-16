import inquirer from 'inquirer';
import path from 'path';
import { telegramClient, DialogManager, MessageSender } from './src/telegram/index.js';
import { logger, fileHandler } from './src/utils/index.js';

const __dirname = path.resolve();



async function main() {
  const { loginChoice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'loginChoice',
      message: '请选择登录方式：',
      choices: [
        { name: '创建新账号', value: 'new' },
        { name: '使用已保存的账号', value: 'saved' }
      ]
    }
  ]);

  let stringSession = '';
  if (loginChoice === 'new') {
    const client = await telegramClient.initializeClient();
    const { phone } = await inquirer.prompt([{ name: 'phone', message: '请输入手机号:' }]);
    await client.start({
      phoneNumber: () => phone,
      password: async () => await inquirer.prompt([{ name: 'password', message: '请输入密码:' }]).then(r => r.password),
      phoneCode: async () => await inquirer.prompt([{ name: 'code', message: '请输入验证码:' }]).then(r => r.code),
      onError: (err) => console.log(err),
    });

    stringSession = client.session.save();
    const accounts = fileHandler.readJsonFile(path.join(__dirname, 'data', 'accounts.json')) || {};
    accounts[phone] = stringSession;
    fileHandler.writeJsonFile(path.join(__dirname, 'data', 'accounts.json'), accounts);

    logger.info("账号已保存");
  } else {
    const accounts = fileHandler.readJsonFile(path.join(__dirname, 'data', 'accounts.json'));
    if (!accounts) {
      logger.info("没有找到已保存的账号，请先创建新账号");
      process.exit(1);
    }

    const accountKeys = Object.keys(accounts);
    const { account } = await inquirer.prompt([
      {
        type: 'list',
        name: 'account',
        choices: accountKeys
      }
    ]);

    stringSession = accounts[account];
  }

  const client = await telegramClient.initializeClient(stringSession);
  await client.connect();
  logger.info("登录成功");

  await client.sendMessage("me", { message: "Hello!" });

  const dialogManager = new DialogManager(client);

  const canPostGroupAndChannel = await dialogManager.getCanPostGroupAndChannel();
  logger.info("有权限的群组/频道列表：", canPostGroupAndChannel)
  const messageSender = new MessageSender(client);
  await messageSender.sendMessage('honeyWifu', canPostGroupAndChannel);

}

main().catch(console.error);