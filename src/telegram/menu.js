import inquirer from "inquirer";

class Menu {
  constructor() {
    this.menu = ["群发消息", "监听并转发消息", "监听频道", "查看群组视频消息"];
  }

  async getSelectedMenu() {
    const { choice } = await inquirer.prompt([
      {
        type: "list",
        name: "choice",
        message: "请选择你要进行的操作",
        choices: this.menu,
      },
    ]);
    return choice;
  }
}

export default Menu;
