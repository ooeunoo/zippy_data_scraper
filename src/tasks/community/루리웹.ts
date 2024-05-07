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

const task = TASK_MAP.루리웹;

@Injectable()
export class 루리웹 extends PageTask {
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

  async getContentUrls(page: Page): Promise<string[]> {
    const urls = await page.evaluate(async () => {
      const table = document.querySelector('.board_list_table');
      const contents = table.querySelectorAll('.table_body');
      const urls = [];
      for (const content of contents) {
        const titleSection = content.querySelector('.thumbnail_wrapper.col_3');
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

    return urls.map((url) => removeParamUrl(url, ['t']));
  }

  async getTitle(page: Page): Promise<string> {
    return page.evaluate(async () => {
      const _title = document.querySelector(
        '.subject_text > .subject_inner_text',
      );
      return _title.textContent.trim();
    });
  }

  async getAuthor(page: Page): Promise<string> {
    return page.evaluate(async () => {
      const _author = document.querySelector('.nick');
      return _author?.textContent.trim();
    });
  }

  async getCreatedAt(page: Page): Promise<string> {
    const createdAt = await page.evaluate(async () => {
      const _createdAt = document.querySelector('.regdate');
      return _createdAt
        ? _createdAt.textContent.replace('(', '').replace(')', '').trim()
        : null;
    });
    return createdAt;
  }

  async getContentText(page: Page): Promise<string> {
    return null;
  }

  async getContentImageUrl(page: Page): Promise<string> {
    const contentImgUrl = await page.evaluate(async () => {
      const _1 = document.querySelector('.board_main_view');
      const _contentImgUrl = _1.querySelectorAll('img');
      if (_contentImgUrl.length > 1) {
        return _contentImgUrl[1]?.getAttribute('src');
      } else {
        return _contentImgUrl[0]?.getAttribute('src');
      }
    });
    return contentImgUrl ? normalizeUrl(contentImgUrl) : null;
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
