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
import { getBrowser } from '../task.utils';
import { TelegramService } from '../../telegram/telegram.service';

const task = TASK_MAP.웃긴대학;

@Injectable()
export class 웃긴대학 extends PageTask {
  isChannelRunning = false;
  isCategoryRunning: Record<string, boolean> = {};
  logger = new Logger(task.name);
  private browser: Browser = null;

  constructor(
    public supabaseService: SupabaseService,
    private readonly telegramServie: TelegramService,
  ) {
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

  async run(limitPage?: number) {
    if (this.isChannelRunning) return;

    await this.telegramServie.sendMessage(`${task.name} 작업 시작`);

    this.isChannelRunning = true;
    this.browser = await getBrowser();

    await Promise.all(
      this.categories.map(async (category) => {
        const jobId = `${this.channel.name_ko}/${category.name}`;
        await this.runCategory(jobId, category, limitPage);
      }),
    );

    this.isChannelRunning = false;
    this.browser.close();
  }

  async runCategory(jobId: string, category: ICategory, limitPage?: number) {
    if (this.isCategoryRunning[jobId]) return;
    this.isCategoryRunning[jobId] = true;

    let total = 0;
    const page = await this.browser.newPage();

    try {
      await this.telegramServie.sendMessage(`${jobId} 작업 시작`);
      this.logger.log(`${jobId} 작업 시작`);

      const list_view_template = this.channel.list_view_url;
      const list_view_url = list_view_template.replace(
        '{category}',
        category.path,
      );

      let pageNum = 0;
      while (true) {
        this.logger.debug(`${jobId} 작업 현재 페이지: ${pageNum}`);

        if (limitPage != null) {
          if (pageNum == limitPage) {
            this.logger.debug(
              `${jobId} 마지막 작업페이지 도달하여 작업을 중단합니다.`,
            );
            break;
          }
        }
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
            this.logger.log(
              `${jobId}: ${JSON.stringify({
                category_id: category.id,
                url: contentUrl,
                title: title,
                author: author,
                content_text: contentText,
                content_img_url: contentImageUrl,
                created_at: createdAt,
              })}`,
            );
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
        const { error } = await this.supabaseService.createContents(data);
        if (error != null) {
          this.logger.error(error);
        }
        total += data.length;
        pageNum += 1;
        this.logger.debug(`${jobId}: ${data.length} 추가되었습니다.`);
        await this.telegramServie.sendMessage(
          `${jobId}: ${data.length} 추가되었습니다.`,
        );
      }
    } catch (e) {
      this.logger.error(`${jobId} ${e}`);
      await this.telegramServie.sendMessage(`${jobId}: ${e}`);
    } finally {
      this.isCategoryRunning[jobId] = false;
      this.logger.log(`${task.name} 작업 마침: ${total}개 업데이트되었습니다.`);
      await this.telegramServie.sendMessage(
        `${task.name} 작업 마침: ${total}개 업데이트되었습니다.`,
      );
      await page.close();
    }
  }
}
