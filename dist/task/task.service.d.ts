import { Logger } from '@nestjs/common';
import { PageTask } from '../app/templates/page_task';
import { SupabaseService } from '../supabase/supabase.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ICategory } from '../app/interfaces/category';
import { Page } from 'puppeteer';
export declare class TaskService extends PageTask {
    supabaseService: SupabaseService;
    private schedulerRegistry;
    isChannelRunning: boolean;
    isCategoryRunning: Record<string, boolean>;
    logger: Logger;
    private browser;
    constructor(supabaseService: SupabaseService, schedulerRegistry: SchedulerRegistry);
    getPageUrl(listViewUrl: string, page: number): string;
    getContentUrls(page: Page, baseUrl: string): Promise<string[]>;
    getTitle(page: Page): Promise<string>;
    getAuthor(page: Page): Promise<string>;
    getCreatedAt(page: Page): Promise<string>;
    getContentText(page: Page): Promise<string>;
    getContentImageUrl(page: Page): Promise<string>;
    formatTimestamp(timestamp: any): string;
    runChannel(): Promise<void>;
    runCategory(jobId: string, category: ICategory): Promise<void>;
}
