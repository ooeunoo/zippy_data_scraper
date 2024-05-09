/* eslint-disable @typescript-eslint/no-var-requires */
import { Logger, OnModuleInit } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { IChannel } from '../interfaces/channel';
import { ICategory } from '../interfaces/category';
import { TABLE } from '../constants/table';
import { CronExpression } from '@nestjs/schedule';

export abstract class TaskBase implements OnModuleInit {
  abstract isChannelRunning: boolean;
  abstract isCategoryRunning: Record<string, boolean>;
  abstract logger: Logger;
  abstract run(limitPage?: number): Promise<void>;

  public channel: IChannel;
  public categories: ICategory[];

  constructor(public supabaseService: SupabaseService, public id: number) {}

  async onModuleInit() {
    await this._setupInfo();
  }

  private async _setupInfo() {
    const { data: channel } = await this.supabaseService.client
      .from(TABLE.channel)
      .select('*')
      .eq('id', this.id)
      .single();

    const { data: categories } = await this.supabaseService.client
      .from(TABLE.category)
      .select('*')
      .eq('channel_id', this.id)
      .eq('status', true);

    this.channel = channel as unknown as IChannel;
    this.categories = categories as unknown as ICategory[];
  }

  // private async _setupBrowser() {
  //   this.browser = await puppeteer.launch({
  //     // args: ['--start-maximized'],
  //     headless: true,
  //     waitForInitialPage: true,
  //   });

  //   this.page = await this.browser.newPage();
  //   // await this.page.setRequestInterception(true);
  //   // this.page.on('request', (req) => {
  //   //   if (
  //   //     req.resourceType() === 'stylesheet' ||
  //   //     req.resourceType() === 'font'
  //   //   ) {
  //   //     req.abort();
  //   //   } else {
  //   //     req.continue();
  //   //   }
  //   // });
  //   // await this.page.setViewport({ width: 500, height: 768 });

  //   // await this.page.exposeFunction('log', this.log);
  // }

  // log = (msg: any) => {
  //   console.log(msg);
  // };

  async updateChannelStatus(status: boolean) {
    await this.supabaseService.client
      .from(TABLE.channel)
      .update({ status: status })
      .eq('id', this.id);
  }

  async findExistsUrls(urls: string[]) {
    const { data } = await this.supabaseService.client
      .from(TABLE.content)
      .select('url')
      .in('url', urls);

    return data.map(({ url }) => url);
  }

  removeExistsUrls(newUrls: string[], existsUrls: string[]) {
    return newUrls.filter((newUrl) => !existsUrls.includes(newUrl));
  }
}
