import { Injectable, OnModuleInit } from '@nestjs/common';
import { Browser, Page } from 'puppeteer';
import { getBrowser } from '../task.utils';
import { sleep } from '../../app/utils/time';
import * as fs from 'fs';
@Injectable()
export class 인스타그램 {
  private browser: Browser = null;
  public baseUrl = 'https://www.instagram.com/{channel}/';

  async getFeedUrls(page: Page): Promise<string[]> {
    return page.evaluate(() => {
      const urls = [];
      const rows = document.querySelectorAll('div._ac7v');
      for (const row of rows) {
        const anchor = row.querySelector('a');
        if (anchor) {
          urls.push(anchor.href);
        }
      }
      return urls;
    });
  }

  async run(channel: string) {
    this.browser = await getBrowser(false);
    const page = await this.browser.newPage();

    const url = this.baseUrl.replace('{channel}', channel);

    await page.goto(url, { waitUntil: 'networkidle2' });
    // get page html
    const html = await page.evaluate(() => document.body.innerHTML);
    console.log(html);
    // html file save
    fs.writeFileSync('./instagram.html', html);

    const feedUrls = await this.getFeedUrls(page);
    console.log(feedUrls);

    await page.close();
    await this.browser.close();
  }
}
