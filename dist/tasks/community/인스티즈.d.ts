import { Logger } from '@nestjs/common';
import { PageTask } from '../../app/templates/page_task';
import { SupabaseService } from '../../supabase/supabase.service';
import { ICategory } from '../../app/interfaces/category';
import { Page } from 'puppeteer';
import { TelegramService } from '../../telegram/telegram.service';
export declare class 인스티즈 extends PageTask {
    supabaseService: SupabaseService;
    private telegramServie;
    isChannelRunning: boolean;
    isCategoryRunning: Record<string, boolean>;
    logger: Logger;
    private browser;
    constructor(supabaseService: SupabaseService, telegramServie: TelegramService);
    getPageUrl(listViewUrl: string, page: number): string;
    getContentUrls(page: Page, baseUrl: string): Promise<string[]>;
    getTitle(page: Page): Promise<string>;
    getAuthor(page: Page): Promise<string>;
    getCreatedAt(page: Page): Promise<string>;
    getContentText(page: Page): Promise<string>;
    getContentImageUrl(page: Page): Promise<string>;
    run(limitPage?: number): Promise<void>;
    runCategory(jobId: string, category: ICategory, limitPage?: number): Promise<void>;
}
