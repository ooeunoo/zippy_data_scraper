import { Injectable, Logger } from '@nestjs/common';
import { PageTask } from '../../app/templates/page_task';
import { SupabaseService } from '../../supabase/supabase.service';
import { normalizeUrl, removeParamUrl } from '../../app/utils/url';
import { IContent } from '../../app/interfaces/content';
import { WAIT_UNTIL_DOMCONTENT_LOADED } from '../../app/constants/value';
import { ICategory } from '../../app/interfaces/category';
import puppeteer, { Browser, Page } from 'puppeteer';
import { sleep } from '../../app/utils/time';
import { PAGE_SLEEP, TASK_MAP } from '../task.constant';
import { getBrowser } from '../task.utils';
import { TelegramService } from '../../telegram/telegram.service';

const task = TASK_MAP.뽐뿌;

@Injectable()
export class 뽐뿌 extends PageTask {
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
    return `${listViewUrl}&page=${page + 1}`;
  }

  async getContentUrls(page: Page, baseUrl: string): Promise<string[]> {
    const urls = await page.evaluate(async (baseUrl: string) => {
      const table = document.querySelector('#revolution_main_table > tbody');
      const contents = table.querySelectorAll('tr.baseList ');
      const urls = [];
      for (const content of contents) {
        const titleSection = content.querySelector('td:nth-child(3)');
        if (titleSection) {
          const urlElement = titleSection.querySelector('a');
          if (urlElement) {
            const url = urlElement.getAttribute('href');
            if (url) {
              urls.push(baseUrl.replace('{url}', url));
            }
          }
        }
      }

      return urls;
    }, baseUrl);

    return urls.map((url) => removeParamUrl(url, ['divpage', 'page']));
  }

  async getTitle(page: Page): Promise<string> {
    return page.evaluate(async () => {
      const _title = document.querySelector('#topTitle > h1');
      return _title.textContent.trim();
    });
  }

  async getAuthor(page: Page): Promise<string> {
    return page.evaluate(async () => {
      const _author = document.querySelector(
        '#topTitle > div > ul > li.topTitle-name > strong > a',
      );
      return _author?.textContent.trim();
    });
  }

  async getCreatedAt(page: Page): Promise<string> {
    const createdAt = await page.evaluate(async () => {
      const _createdAt = document.querySelector(
        '#topTitle > div > ul > li:nth-child(2)',
      );
      return _createdAt
        ? _createdAt.textContent.replace('등록일', '').trim()
        : null;
    });
    return createdAt;
  }

  async getContentText(page: Page): Promise<string> {
    return null;
  }

  async getContentImageUrl(page: Page): Promise<string> {
    const contentImgUrl = await page.evaluate(async () => {
      const _1 = document.querySelector('.board-contents');
      const _contentImgUrl = _1.querySelectorAll('img');
      if (_contentImgUrl.length > 1) {
        return _contentImgUrl[1]?.getAttribute('src');
      } else {
        return _contentImgUrl[0]?.getAttribute('src');
      }
    });
    return contentImgUrl ? normalizeUrl(contentImgUrl) : null;
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
