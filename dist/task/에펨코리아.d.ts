import { Logger } from '@nestjs/common';
import { PageTask } from '../app/templates/page_task';
import { SupabaseService } from '../supabase/supabase.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { IContent } from '../app/interfaces/content';
import { ICategory } from '../app/interfaces/category';
import { Page } from 'puppeteer';
import { IChannel } from '../app/interfaces/channel';
import { ConfigService } from '@nestjs/config';
export declare class 에펨코리아 extends PageTask {
    supabaseService: SupabaseService;
    private schedulerRegistry;
    private configService;
    isChannelRunning: boolean;
    isCategoryRunning: Record<string, boolean>;
    logger: Logger;
    private browser;
    constructor(supabaseService: SupabaseService, schedulerRegistry: SchedulerRegistry, configService: ConfigService);
    getPageUrl(listViewUrl: string, page: number): string;
    getContents(page: Page, channel: IChannel, category: ICategory): Promise<IContent[]>;
    formatCreatedAt(text: string): string;
    runChannel(): Promise<void>;
    runCategory(jobId: string, category: ICategory): Promise<void>;
}
