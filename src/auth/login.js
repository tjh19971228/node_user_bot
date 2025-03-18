import inquirer from "inquirer";
import path from "path";
import { telegramClient } from "../telegram/index.js";
import { logger, fileHandler } from "../utils/index.js";

const __dirname = path.resolve();

/**
 * 处理用户登录流程
 * @returns {Promise<string>} 返回会话字符串
 */
export async function handleLogin() {
  const { loginChoice } = await inquirer.prompt([
    {
      type: "list",
      name: "loginChoice",
      message: "请选择登录方式：",
      choices: [
        { name: "创建新账号", value: "new" },
        { name: "使用已保存的账号", value: "saved" },
      ],
    },
  ]);

  let stringSession = "";
  
  if (loginChoice === "new") {
    stringSession = await createNewAccount();
  } else {
    stringSession = await useSavedAccount();
  }
  
  return stringSession;
}

/**
 * 创建新账号
 * @returns {Promise<string>} 返回会话字符串
 */
async function createNewAccount() {
  const client = await telegramClient.initializeClient();
  const { phone } = await inquirer.prompt([
    { name: "phone", message: "请输入手机号:" },
  ]);
  
  await client.start({
    phoneNumber: () => phone,
    password: async () =>
      await inquirer
        .prompt([{ name: "password", message: "请输入密码:" }])
        .then((r) => r.password),
    phoneCode: async () =>
      await inquirer
        .prompt([{ name: "code", message: "请输入验证码:" }])
        .then((r) => r.code),
    onError: (err) => logger.error(err, "登录过程"),
  });

  const stringSession = client.session.save();
  
  // 保存账号信息
  const accounts =
    fileHandler.readJsonFile(path.join(__dirname, "data", "accounts.json")) ||
    {};
  accounts[phone] = stringSession;
  fileHandler.writeJsonFile(
    path.join(__dirname, "data", "accounts.json"),
    accounts
  );

  logger.info("账号已保存");
  return stringSession;
}

/**
 * 使用已保存的账号
 * @returns {Promise<string>} 返回会话字符串
 */
async function useSavedAccount() {
  const accounts = fileHandler.readJsonFile(
    path.join(__dirname, "data", "accounts.json")
  );
  
  if (!accounts) {
    logger.info("没有找到已保存的账号，请先创建新账号");
    process.exit(1);
  }

  const accountKeys = Object.keys(accounts);
  const { account } = await inquirer.prompt([
    {
      type: "list",
      name: "account",
      message: "请选择账号：",
      choices: accountKeys,
    },
  ]);

  return accounts[account];
} 