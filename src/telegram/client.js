
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { apiId, apiHash } from "../config/telegram.js";

class TelegramClientManager {
    constructor() {
        this.client = null;
    }

    async initializeClient(session = '') {
        this.client = new TelegramClient(
            new StringSession(session),
            apiId,
            apiHash,
            { connectionRetries: 5 }
        );
        return this.client;
    }


    async connect() {
        if (!this.client) {
            throw new Error('Client not initialized');
        }
        await this.client.connect();
    }

    getClient() {
        return this.client;
    }
}

export default new TelegramClientManager();