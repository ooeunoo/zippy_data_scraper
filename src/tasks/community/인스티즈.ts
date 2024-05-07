import { Injectable, Logger } from '@nestjs/common';
import { PageTask } from '../../app/templates/page_task';
import { SupabaseService } from '../../supabase/supabase.service';
import {
  getParamValue,
  normalizeUrl,
  removeParamUrl,
} from '../../app/utils/url';
import { IContent } from '../../app/interfaces/content';
import { WAIT_UNTIL_DOMCONTENT_LOADED } from '../../app/constants/value';
import { ICategory } from '../../app/interfaces/category';
import puppeteer, { Browser, Page } from 'puppeteer';
import { getCurrnetTime, sleep } from '../../app/utils/time';
import { PAGE_SLEEP, TASK_MAP } from '../task.constant';

const task = TASK_MAP.인스티즈;

@Injectable()
export class 인스티즈 extends PageTask {
  isChannelRunning = false;
  isCategoryRunning: Record<string, boolean> = {};
  logger = new Logger(task.name);
  private browser: Browser = null;

  constructor(public supabaseService: SupabaseService) {
    super(supabaseService, task.id);
  }

  getPageUrl(listViewUrl: string, page: number): string {
    return `${listViewUrl}&page=${page + 1}`;
  }

  async getContentUrls(page: Page, baseUrl: string): Promise<string[]> {
    const urls = await page.evaluate(async (baseUrl: string) => {
      const table = document.querySelector('#mboard > tbody');
      const contents = table.querySelectorAll('tr:not(#topboard)');
      const urls = [];
      for (const content of contents) {
        const urlElement = content.querySelector('td.listsubject > a');
        if (urlElement) {
          const url = urlElement.getAttribute('href');
          if (url) {
            urls.push(baseUrl.replace('{url}', url.replace('../', '/')));
          }
        }
      }

      return urls;
    }, baseUrl);
    return urls.map((url) =>
      removeParamUrl(url, ['page', 'category', 'green', 'grnpage']),
    );
  }

  async getTitle(page: Page): Promise<string> {
    return page.evaluate(async () => {
      const titleGroup = document.querySelector('#nowsubject');
      if (titleGroup) {
        const cmtElement = titleGroup?.querySelector('.cmt');
        cmtElement.remove();
      }

      return titleGroup?.textContent;
    });
  }

  async getAuthor(page: Page): Promise<string> {
    return page.evaluate(async () => {
      const infoGroup = document.querySelector('.tb_left');
      const author = infoGroup?.querySelector('a');
      return author?.textContent;
    });
  }

  async getCreatedAt(page: Page): Promise<string> {
    return page.evaluate(async () => {
      const infoGroup = document.querySelector('.tb_left');
      const createdAt = infoGroup.querySelector(
        'span[itemprop="datePublished"]',
      );
      return createdAt?.getAttribute('content');
    });
  }

  async getContentText(page: Page): Promise<string> {
    return null;
  }

  async getContentImageUrl(page: Page): Promise<string> {
    return page.evaluate(async () => {
      const _1 = document.querySelector('#memo_content_1');
      const _2 = _1.querySelector('img');
      return _2?.getAttribute('src');
    });
  }

  async run() {
    if (this.isChannelRunning) return;

    this.isChannelRunning = true;
    this.browser = await puppeteer.launch({
      headless: true,
    });

    await Promise.all(
      this.categories.map(async (category) => {
        const jobId = `${this.channel.name_ko}/${category.name}`;
        await this.runCategory(jobId, category);
      }),
    );

    this.isChannelRunning = false;
    this.browser.close();
  }

  async runCategory(jobId: string, category: ICategory) {
    if (this.isCategoryRunning[jobId]) return;
    this.isCategoryRunning[jobId] = true;

    let total = 0;
    const page = await this.browser.newPage();

    try {
      this.logger.log(`${jobId} 시작`);

      const list_view_template = this.channel.list_view_url;
      const list_view_url = list_view_template.replace(
        '{category}',
        category.path,
      );

      let pageNum = 0;
      while (true) {
        const data: IContent[] = [];

        const pageUrl = this.getPageUrl(list_view_url, pageNum);
        await page.goto(pageUrl, {
          waitUntil: WAIT_UNTIL_DOMCONTENT_LOADED,
        });

        const urls = await this.getContentUrls(
          page,
          this.channel.item_view_url,
        );
        const existsUrls = await this.findExistsUrls(urls);
        const contentUrls = await this.removeExistsUrls(urls, existsUrls);
        console.log(contentUrls);
        if (contentUrls.length == 0) break;

        for await (const contentUrl of contentUrls) {
          try {
            await page.goto(contentUrl, {
              waitUntil: WAIT_UNTIL_DOMCONTENT_LOADED,
            });
            await sleep(PAGE_SLEEP);

            const title = await this.getTitle(page);
            console.log('title:', title);
            const author = await this.getAuthor(page);
            console.log('author:', author);
            const createdAt = await this.getCreatedAt(page);
            console.log('createdAt:', createdAt);
            const contentText = await this.getContentText(page);
            console.log('contentText:', contentText);
            const contentImageUrl = await this.getContentImageUrl(page);
            console.log('contentImageUrl:', contentImageUrl);
            console.log({
              category_id: category.id,
              url: contentUrl,
              title: title,
              author: author,
              content_text: contentText,
              content_img_url: contentImageUrl,
              created_at: createdAt,
            });
            data.push({
              category_id: category.id,
              url: contentUrl,
              title: title,
              author: author,
              content_text: contentText,
              content_img_url: contentImageUrl,
              created_at: createdAt,
            });
          } catch (e) {
            this.logger.warn(`${jobId}-${contentUrl}-${e}`);
            continue;
          }
        }
        await this.supabaseService.createContents(data);
        total += data.length;
        pageNum += 1;
      }
    } catch (e) {
      this.logger.error(`${jobId} ${e}`);
    } finally {
      this.isCategoryRunning[jobId] = false;
      this.logger.log(`${jobId} 끝: ${total}개 업데이트`);
      await page.close();
    }
  }
}
