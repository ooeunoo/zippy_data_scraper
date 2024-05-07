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
import { sleep } from '../../app/utils/time';
import { PAGE_SLEEP, TASK_MAP } from '../task.constant';

const task = TASK_MAP.웃긴대학;

@Injectable()
export class 웃긴대학 extends PageTask {
  isChannelRunning = false;
  isCategoryRunning: Record<string, boolean> = {};
  logger = new Logger(task.name);
  private browser: Browser = null;

  constructor(public supabaseService: SupabaseService) {
    super(supabaseService, task.id);
  }

  getPageUrl(listViewUrl: string, page: number): string {
    return `${listViewUrl}&pg=${page}`;
  }

  async getContentUrls(page: Page, baseUrl: string): Promise<string[]> {
    const category = getParamValue(page.url(), 'table');

    const urls = await page.evaluate(
      async (baseUrl: string, category: string) => {
        const table =
          category == 'pick'
            ? document.querySelector('#post_list > tbody')
            : document.querySelector('.bg_list > tbody');

        const contents = table.querySelectorAll('tr');
        const urls = [];
        for (const content of contents) {
          const urlElement = content.querySelector('a.li');
          if (urlElement) {
            const url = urlElement.getAttribute('href');
            if (url) {
              urls.push(baseUrl.replace('{url}', url));
            }
          }
        }

        return urls;
      },
      baseUrl,
      category,
    );

    return urls.map((url) => removeParamUrl(url, ['page']));
  }

  async getTitle(page: Page): Promise<string> {
    return page.evaluate(async () => {
      const title = document.querySelector('#ai_cm_title');
      return title?.textContent.trim();
    });
  }

  async getAuthor(page: Page): Promise<string> {
    return page.evaluate(async () => {
      const _1 = document.querySelector('#profile_table');
      const author = _1?.querySelector('.hu_nick_txt');
      return author?.textContent.trim();
    });
  }

  async getCreatedAt(page: Page): Promise<string> {
    return page.evaluate(async () => {
      const _1 = document.querySelector('#content_info');
      const createdAt = _1.querySelector('span:nth-child(9)');
      return createdAt?.textContent.trim();
    });
  }

  async getContentText(page: Page): Promise<string> {
    return null;
  }

  async getContentImageUrl(page: Page): Promise<string> {
    const url = await page.evaluate(async () => {
      const _1 = document.querySelector('#cnts');
      const _2 = _1.querySelector('img');
      const contentImgUrl = _2?.getAttribute('src');
      return contentImgUrl;
    });

    return normalizeUrl(url);
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

        if (contentUrls.length == 0) break;

        for await (const contentUrl of contentUrls) {
          try {
            await page.goto(contentUrl, {
              waitUntil: WAIT_UNTIL_DOMCONTENT_LOADED,
            });
            await sleep(PAGE_SLEEP);

            const title = await this.getTitle(page);
            const author = await this.getAuthor(page);
            const createdAt = await this.getCreatedAt(page);
            const contentText = await this.getContentText(page);
            const contentImageUrl = await this.getContentImageUrl(page);
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
