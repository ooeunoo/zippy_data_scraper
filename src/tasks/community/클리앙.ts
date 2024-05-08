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

const task = TASK_MAP.클리앙;

@Injectable()
export class 클리앙 extends PageTask {
  isChannelRunning = false;
  isCategoryRunning: Record<string, boolean> = {};
  logger = new Logger(task.name);
  private browser: Browser = null;

  constructor(
    public supabaseService: SupabaseService,
    private telegramServie: TelegramService,
  ) {
    super(supabaseService, task.id);
  }

  getPageUrl(listViewUrl: string, page: number): string {
    return `${listViewUrl}?po=${page}`;
  }
  async getContentUrls(page: Page, baseUrl: string): Promise<string[]> {
    const urls = await page.evaluate(async (baseUrl: string) => {
      const table = document.querySelector('.list_content');

      const contents = table.querySelectorAll('.list_item');
      const urls = [];
      for (const content of contents) {
        const urlElement = content.querySelector(
          'div.list_title > a.list_subject',
        );
        if (urlElement) {
          const url = urlElement.getAttribute('href');
          if (url) {
            urls.push(baseUrl.replace('{url}', url));
          }
        }
      }

      return urls;
    }, baseUrl);

    return urls.map((url) =>
      removeParamUrl(url, ['od', 'po', 'category', 'groupCd']),
    );
  }

  async getTitle(page: Page): Promise<string> {
    return page.evaluate(async () => {
      const title = document.querySelector('.post_subject');
      return title?.textContent.trim();
    });
  }

  async getAuthor(page: Page): Promise<string> {
    return page.evaluate(async () => {
      const author = document.querySelector(
        'div.post_info > div.post_contact > span.contact_name > span.nickname',
      );
      return author?.textContent.trim();
    });
  }

  async getCreatedAt(page: Page): Promise<string> {
    return page.evaluate(async () => {
      const _1 = document.querySelector('.post_author');
      const postAuthorText = _1?.textContent;
      const match = postAuthorText?.match(
        /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/,
      );
      const createdAt = match ? match[0] : null;
      return createdAt?.trim();
    });
  }

  async getContentText(page: Page): Promise<string> {
    return '';
  }

  async getContentImageUrl(page: Page): Promise<string> {
    const url = await page.evaluate(async () => {
      const _1 = document.querySelector('.post_article');
      const _2 = _1.querySelector('img');
      const contentImgUrl = _2?.getAttribute('src');
      return contentImgUrl;
    });

    return normalizeUrl(url);
  }

  async run() {
    if (this.isChannelRunning) return;
    await this.telegramServie.sendMessage(`${task.name} 작업 시작`);

    this.isChannelRunning = true;
    this.browser = await getBrowser();

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
      await this.telegramServie.sendMessage(`${jobId} 작업 시작`);
      this.logger.log(`${jobId} 작업 시작`);

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
            this.logger.log(
              `${jobId}: ${{
                category_id: category.id,
                url: contentUrl,
                title: title,
                author: author,
                content_text: contentText,
                content_img_url: contentImageUrl,
                created_at: createdAt,
              }}`,
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
        await this.supabaseService.createContents(data);
        total += data.length;
        pageNum += 1;
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
