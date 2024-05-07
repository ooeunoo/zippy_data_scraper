import { Page } from 'puppeteer';
import { SupabaseService } from '../../supabase/supabase.service';
import { TaskBase } from './base';

export abstract class PageTask extends TaskBase {
  constructor(public supabaseService: SupabaseService, public id: number) {
    super(supabaseService, id);
  }

  abstract getPageUrl(listViewUrl: string, page: number): string;
  abstract getContentUrls(page: Page, baseUrl: string): Promise<string[]>;
}
