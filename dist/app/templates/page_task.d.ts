import { Page } from 'puppeteer';
import { SupabaseService } from '../../supabase/supabase.service';
import { TaskBase } from './base';
export declare abstract class PageTask extends TaskBase {
    supabaseService: SupabaseService;
    id: number;
    constructor(supabaseService: SupabaseService, id: number);
    abstract getPageUrl(listViewUrl: string, page: number): string;
    abstract getContentUrls(page: Page, baseUrl: string): Promise<string[]>;
}
