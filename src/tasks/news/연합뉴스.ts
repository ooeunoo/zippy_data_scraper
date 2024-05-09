import { Injectable, Logger } from '@nestjs/common';
import { PageTask } from '../../app/templates/page_task';
import { SupabaseService } from '../../supabase/supabase.service';
import { normalizeUrl } from '../../app/utils/url';
import { IContent } from '../../app/interfaces/content';
import { WAIT_UNTIL_DOMCONTENT_LOADED } from '../../app/constants/value';
import { ICategory } from '../../app/interfaces/category';
import puppeteer, { Browser, Page } from 'puppeteer';
import { sleep } from '../../app/utils/time';
import { PAGE_SLEEP, TASK_MAP } from '../task.constant';
import { getBrowser } from '../task.utils';
import { TelegramService } from '../../telegram/telegram.service';

const task = TASK_MAP.연합뉴스;

@Injectable()
export class 연합뉴스 extends PageTask {
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
    return `${listViewUrl}?page=${page + 1}`;
  }

  async getContentUrls(page: Page): Promise<string[]> {
    const urls = await page.evaluate(async () => {
      const table = document.querySelector('.list-type038');
      const contents = table.querySelectorAll('li:not(.aside-bnr07)');
      const urls = [];

      for (const content of contents) {
        const title_section = content.querySelector('.news-con');
        if (title_section) {
          const urlElement = title_section.querySelector('a');
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

    return urls.map((url) => normalizeUrl(url));
  }

  async getTitle(page: Page): Promise<string> {
    return page.evaluate(async () => {
      const _title = document.querySelector(
        '#articleWrap > div.content03 > header > h1',
      );
      return _title?.textContent.trim();
    });
  }

  async getAuthor(page: Page): Promise<string> {
    return page.evaluate(async () => {
      const _author = document.querySelector(
        '#newsWriterCarousel01 > div > div > div > div.li.slick-slide.slick-current.slick-active > a > div > strong',
      );
      return _author?.textContent.trim();
    });
  }

  async getCreatedAt(page: Page): Promise<string> {
    const createdAt = await page.evaluate(async () => {
      const _createdAt = document.querySelector('#newsUpdateTime01');
      return _createdAt?.getAttribute('data-published-time');
    });
    return createdAt ? this.formatTimestamp(createdAt) : null;
  }

  async getContentText(page: Page): Promise<string> {
    return page.evaluate(async () => {
      const _contentText = document.querySelector(
        '#articleWrap > div.content01.scroll-article-zone01 > div > div > article > div.tit-sub > h2',
      );
      return _contentText?.textContent.trim();
    });
  }

  async getContentImageUrl(page: Page): Promise<string> {
    const contentImgUrl = await page.evaluate(async () => {
      const _contentImgUrl = document.querySelector(
        '#articleWrap > div.content01.scroll-article-zone01 > div > div > article > div.comp-box.photo-group > figure > div > span > img',
      );
      return _contentImgUrl?.getAttribute('src');
    });
    return contentImgUrl ? normalizeUrl(contentImgUrl) : null;
  }

  formatTimestamp(timestamp): string {
    const year = Math.floor(timestamp / 100000000);
    const month = Math.floor((timestamp % 100000000) / 1000000);
    const day = Math.floor((timestamp % 1000000) / 10000);
    const hour = Math.floor((timestamp % 10000) / 100);
    const minute = timestamp % 100;

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(
      2,
      '0',
    )} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  async run() {
    if (this.isChannelRunning) return;
    await this.telegramServie.sendMessage(`${task.name} 작업 시작`);

    this.isChannelRunning = true;
    this.browser = await getBrowser();

    // await Promise.all(
    //   this.categories.map(async (category) => {
    //     const jobId = `${this.channel.name_ko}/${category.name}`;
    //     await this.runCategory(jobId, category);
    //   }),
    // );
    for await (const category of this.categories) {
      const jobId = `${this.channel.name_ko}/${category.name}`;
      await this.runCategory(jobId, category);
    }

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
        this.logger.log(`${jobId}: ${data.length} 추가되었습니다.`);
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
