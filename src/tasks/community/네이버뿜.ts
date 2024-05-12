import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { removeParamUrl } from '../../app/utils/url';
import { IContent } from '../../app/interfaces/content';
import { WAIT_UNTIL_DOMCONTENT_LOADED } from '../../app/constants/value';
import { ICategory } from '../../app/interfaces/category';
import { Browser, Page } from 'puppeteer';
import { sleep } from '../../app/utils/time';
import { TASK_MAP } from '../task.constant';
import { getBrowser } from '../task.utils';
import { TelegramService } from '../../telegram/telegram.service';
import { CustomTask } from '../../app/templates/custom_task';

const task = TASK_MAP.네이버뿜;

@Injectable()
export class 네이버뿜 extends CustomTask {
  gatherContentUrls(): Promise<string[]> {
    throw new Error('Method not implemented.');
  }
  clickMore() {
    throw new Error('Method not implemented.');
  }
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

  // to page scroll bottom down
  async scrollBottom(page: Page) {
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
  }

  async getContents(
    page: Page,
    category: ICategory,
    baseUrl: string,
    startIndex: number,
  ): Promise<IContent[]> {
    const contents: IContent[] = [];
    const rows = await page.$$('.List_item__LcNFs');
    const splitRows = rows.slice(startIndex);

    for await (const row of splitRows) {
      const infoSection = await row.$('.ListItem_info__gX3Y8');
      const titleSection = await infoSection.$('strong');
      const title = await titleSection.evaluate((el) => el.textContent);
      const authorSection = await infoSection.$(
        '.ListItem_name-date-wrap__LIAJZ > .ListItem_name__nkBcm',
      );
      const author = await authorSection.evaluate((el) => el.textContent);
      const createdAtSection = await infoSection.$('.ListItem_date__KMpBY');
      const createdAtValue = await createdAtSection.evaluate(
        (el) => el.textContent,
      );
      const createdAt = createdAtValue
        .replace(/\./g, '-')
        .replace(/\s/g, '')
        .replace(/-$/, '');

      const imageSection = await row.$('.ListItem_thumb__mv_1S > img');
      const imageUrl = await imageSection.evaluate((el) =>
        el.getAttribute('src'),
      );
      const contentUrlSection = await infoSection.$('.ListItem_comment__ucjlV');
      // get contentUrl href
      const contentUrlValue = await contentUrlSection.evaluate((el) =>
        el.getAttribute('href'),
      );
      const contentUrl = removeParamUrl(
        baseUrl.replace('{url}', contentUrlValue),
        ['entrance'],
      );
      contents.push({
        category_id: category.id,
        title,
        content_img_url: imageUrl,
        author,
        url: contentUrl,
        created_at: createdAt,
      });
    }
    return contents;
  }

  async run(limitPage?: number) {
    if (this.isChannelRunning) return;

    await this.telegramServie.sendMessage(`${task.name} 작업 시작`);

    this.isChannelRunning = true;
    this.browser = await getBrowser(false);

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

    const total = 0;
    const page = await this.browser.newPage();

    try {
      await this.telegramServie.sendMessage(`${jobId} 작업 시작`);
      this.logger.log(`${jobId} 작업 시작`);

      const list_view_template = this.channel.list_view_url;
      const list_view_url = list_view_template.replace(
        '{category}',
        category.path,
      );

      let startIndex = 0;
      await page.goto(list_view_url, {
        waitUntil: WAIT_UNTIL_DOMCONTENT_LOADED,
      });
      while (true) {
        this.logger.debug(`${jobId} 작업 갯수: ${startIndex}`);

        const contents = await this.getContents(
          page,
          category,
          this.channel.item_view_url,
          startIndex,
        );
        const urls = contents.map((content) => content.url);
        console.log(urls);
        startIndex += urls.length;

        const existsUrls = await this.findExistsUrls(urls);
        const contentUrls = await this.removeExistsUrls(urls, existsUrls);

        const newContents = contents.filter((content) =>
          contentUrls.includes(content.url),
        );

        if (newContents.length == 0) break;

        await this.supabaseService.createContents(newContents);

        await this.scrollBottom(page);

        await sleep(5000);
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
