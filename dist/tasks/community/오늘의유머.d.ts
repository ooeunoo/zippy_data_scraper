import { Logger } from '@nestjs/common';
import { PageTask } from '../../app/templates/page_task';
import { SupabaseService } from '../../supabase/supabase.service';
import { ICategory } from '../../app/interfaces/category';
import { Page } from 'puppeteer';
export declare class 오늘의유머 extends PageTask {
    supabaseService: SupabaseService;
    isChannelRunning: boolean;
    isCategoryRunning: Record<string, boolean>;
    logger: Logger;
    private browser;
    constructor(supabaseService: SupabaseService);
    getPageUrl(listViewUrl: string, page: number): string;
    getContentUrls(page: Page, baseUrl: string): Promise<string[]>;
    getTitle(page: Page): Promise<string>;
    getAuthor(page: Page): Promise<string>;
    getCreatedAt(page: Page): Promise<string>;
    getContentText(page: Page): Promise<string>;
    getContentImageUrl(page: Page): Promise<string>;
    run(): Promise<void>;
    runCategory(jobId: string, category: ICategory): Promise<void>;
}
