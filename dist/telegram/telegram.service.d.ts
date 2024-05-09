import { ConfigService } from '@nestjs/config';
export declare class TelegramService {
    private readonly configService;
    private _chatId;
    private _bot;
    constructor(configService: ConfigService);
    sendMessage(message: string): void;
}
