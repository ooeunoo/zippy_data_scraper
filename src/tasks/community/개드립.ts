import { Injectable, Logger } from '@nestjs/common';
import { PageTask } from '../../app/templates/page_task';
import { SupabaseService } from '../../supabase/supabase.service';
import { normalizeUrl } from '../../app/utils/url';
import { IContent } from '../../app/interfaces/content';
import {
  WAIT_UNTIL_DOMCONTENT_LOADED,
  WAIT_UNTIL_NETWOKR_IDLE_2,
} from '../../app/constants/value';
import { ICategory } from '../../app/interfaces/category';
import { calculateTimeAgo, sleep } from '../../app/utils/time';
import { PAGE_SLEEP, TASK_MAP } from '../task.constant';
import puppeteer, { Browser, Page } from 'puppeteer';
import { getBrowser } from '../task.utils';
import { TelegramService } from '../../telegram/telegram.service';

const task = TASK_MAP.개드립;

@Injectable()
export class 개드립 extends PageTask {
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
    return `${listViewUrl}?page=${page + 1}`;
  }

  async getContentUrls(page: Page): Promise<string[]> {
    const urls = await page.evaluate(async () => {
      const table = document.querySelector('.ed.board-list');
      const tableBody = table.querySelector('tbody');
      const contents = tableBody.querySelectorAll('tr:not(.notice)');
      const urls = [];
      for (const content of contents) {
        const titleSection = content.querySelector('td.title > span');
        if (titleSection) {
          const urlElement = titleSection.querySelector('a');
          if (urlElement) {
            const url = urlElement.getAttribute('href');
            if (url) {
              urls.push(url);
            }
          }
        }
      }

      return urls;
    });

    return urls;
  }

  async getTitle(page: Page): Promise<string> {
    return page.evaluate(async () => {
      const _title = document.querySelector(
        'div.ed.article-head.margin-bottom-large > h4 > a',
      );
      return _title.textContent.trim();
    });
  }

  async getAuthor(page: Page): Promise<string> {
    return page.evaluate(async () => {
      const _author = document.querySelector(
        'div.ed.flex.flex-wrap > span:nth-child(1) > a',
      );
      return _author?.textContent.trim();
    });
  }

  log = (msg: any) => {
    console.log(msg);
  };
  async getCreatedAt(page: Page): Promise<string> {
    const createdAt = await page.evaluate(async () => {
      const _1 = document.querySelector('.ed.flex.flex-wrap');
      const _2 = _1.querySelectorAll('.ed.margin-right-small');
      const _createdAt = _2[1];
      return _createdAt ? _createdAt.textContent.trim() : null;
    });
    return calculateTimeAgo(createdAt);
  }

  async getContentText(page: Page): Promise<string> {
    return null;
  }

  async getContentImageUrl(page: Page, baseUrl: string): Promise<string> {
    const contentImgUrl = await page.evaluate(async () => {
      const _1 = document.querySelector('#article_1');
      const _contentImgUrl = _1.querySelectorAll('img');
      if (_contentImgUrl.length > 1) {
        return _contentImgUrl[1]?.getAttribute('src');
      } else {
        return _contentImgUrl[0]?.getAttribute('src');
      }
    });
    return contentImgUrl ? baseUrl + normalizeUrl(contentImgUrl) : null;
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
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (
        req.resourceType() === 'stylesheet' ||
        req.resourceType() === 'font'
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.exposeFunction('log', this.log);

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
          waitUntil: WAIT_UNTIL_NETWOKR_IDLE_2,
        });

        console.log(pageUrl);
        const urls = await this.getContentUrls(page);
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
            console.log(title);
            const author = await this.getAuthor(page);
            console.log(author);
            const createdAt = await this.getCreatedAt(page);
            console.log(createdAt);

            const contentText = await this.getContentText(page);
            const contentImageUrl = await this.getContentImageUrl(
              page,
              this.channel.base_url,
            );
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
