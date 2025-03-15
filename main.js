import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import inquirer from 'inquirer';
import fs from "fs";
import path from "path";


const dataDir = path.join(process.cwd(), "data");
const accountsFile = path.join(dataDir, "accounts.json");

const apiId = 23388124;
const apiHash = "cdca56287f543618ecc1ed17c6c23bab";
let stringSession = new StringSession("");

(async () => {
  console.log("Loading interactive example...");

  // 使用 inquirer 实现交互式选择
  const { loginChoice } = await inquirer.prompt([
    {
      type: 'list',  // 使用列表类型，支持上下箭头选择
      name: 'loginChoice',
      message: '请选择登录方式：',
      choices: [
        { name: '使用已有账号登录', value: '1' },
        { name: '使用新账号登录', value: '2' }
      ]
    }
  ]);

  let client;
  let phone;
  let accounts = {};

  // 如果文件存在，读取现有账号
  if (fs.existsSync(accountsFile)) {
    try {
      accounts = JSON.parse(fs.readFileSync(accountsFile, 'utf8'));
    } catch (err) {
      console.log("读取账号文件失败，将创建新文件");
    }
  }

  switch (loginChoice) {
    case '1':
      if (!fs.existsSync(accountsFile)) {
        console.log("没有找到已保存的账号，请先创建新账号");
        process.exit(1);
      }

      // 获取accounts的keys
      const accountKeys = Object.keys(accounts);
      if (accountKeys.length === 0) {
        console.log("没有找到已保存的账号，请先创建新账号");
        process.exit(1);
      }
      // 展示在inquirer中
      const { account } = await inquirer.prompt([
        {
          type: 'list',
          name: 'account',
          message: '请选择要登录的账号：',
          choices: accountKeys
        }
      ]);
      // 获取选中的账号
      stringSession = accounts[account]
      // 登录
      client = new TelegramClient(new StringSession(stringSession), apiId, apiHash, {
        connectionRetries: 5,
      });
      await client.connect();
      console.log("登录成功");
      // 测试是否成功
      await client.sendMessage("me", { message: "Hello!" });
      break;

    case '2':
      client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
      });
      const { phone } = await inquirer.prompt([{
        type: 'input',
        name: 'phone',
        message: '请输入手机号码：'
      }]);
      console.log("手机号码：", phone);
      await client.start({
        phoneNumber: phone,
        password: async () => await inquirer.prompt([{
          type: 'password',
          name: 'password',
          message: '请输入密码：'
        }]).then(response => {
          return response.password;
        }),
        phoneCode: async () =>
          await inquirer.prompt([{
            type: 'input',
            name: 'code',
            message: '请输入收到的验证码：'
          }]).then(response => {
            return response.code;
          }),
        onError: (err) => console.log(err),
      });

      // 确保data目录存在
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // 添加新账号
      accounts[phone] = client.session.save();

      // 保存到文件
      fs.writeFileSync(accountsFile, JSON.stringify(accounts, null, 2));
      console.log("登录成功，账号信息已保存");
      break;
  }
})().catch(err => {
  console.error('发生错误：', err);
  process.exit(1);
});