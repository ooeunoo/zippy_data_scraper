import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';

@Injectable()
export class TelegramService {
  private _chatId: string;
  private _bot = TelegramBot;

  constructor(private readonly configService: ConfigService) {
    this._chatId = this.configService.get('TELEGRAM_CHAT_ID');
    this._bot = new TelegramBot(this.configService.get('TELEGRAM_TOKEN'), {
      polling: true,
    });
  }

  sendMessage(message: string) {
    this._bot.sendMessage(this._chatId, message);
  }
}
