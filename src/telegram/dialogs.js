import { Api } from "telegram";
import { logger } from "../utils/index.js";


class DialogManager {
    // 有权限的群组/列表列表
    permissionsList = [];
    constructor(client) {
        this.client = client;
    }

    async getDialogs() {
        return await this.client.getDialogs({
            folder: 0
        });
    }

    async checkDialogPermissions(dialog) {
        try {
            // 跳过广播和论坛还有私聊
            if (dialog.isUser || dialog.entity.broadcast || dialog.entity.forum) {
                return null;
            }

            if (dialog.isChannel) {
                return await this.checkChannelPermissions(dialog);
            } else if (dialog.isGroup) {
                return this.getGroupInfo(dialog);
            }
        } catch (error) {
            logger.error(error, dialog.title);
            return null;
        }
    }

    async checkChannelPermissions(dialog) {
        const participant = await this.client.invoke(
            new Api.channels.GetParticipant({
                channel: dialog.id,
                participant: 'me'
            })
        );



        const isAdmin = participant.participant?.adminRights != null;
        const canPost = isAdmin || !participant.participant?.bannedRights?.sendMessages
        if (canPost) {
            return {
                name: dialog.title,
                id: dialog.id,
                type: '超级群组',
                role: isAdmin ? '管理员' : '普通成员'
            };
        }
        return null;
    }

    async getCanPostGroupAndChannel() {
        const dialogs = await this.getDialogs();

        for (const dialog of dialogs) {
            const dialogInfo = await this.checkDialogPermissions(dialog);
            if (dialogInfo) {
                this.permissionsList.push(dialogInfo);
            }
        }

        return this.permissionsList;
    }

    getGroupInfo(dialog) {
        return {
            name: dialog.title,
            id: dialog.id,
            type: '普通群组',
            role: '普通成员'
        };
    }
}

export default DialogManager;