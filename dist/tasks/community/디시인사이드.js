"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.디시인사이드 = void 0;
const common_1 = require("@nestjs/common");
const page_task_1 = require("../../app/templates/page_task");
const supabase_service_1 = require("../../supabase/supabase.service");
const url_1 = require("../../app/utils/url");
const value_1 = require("../../app/constants/value");
const time_1 = require("../../app/utils/time");
const task_constant_1 = require("../task.constant");
const task_utils_1 = require("../task.utils");
const telegram_service_1 = require("../../telegram/telegram.service");
const task = task_constant_1.TASK_MAP.디시인사이드;
let 디시인사이드 = class 디시인사이드 extends page_task_1.PageTask {
    constructor(supabaseService, telegramServie) {
        super(supabaseService, task.id);
        this.supabaseService = supabaseService;
        this.telegramServie = telegramServie;
        this.isChannelRunning = false;
        this.isCategoryRunning = {};
        this.logger = new common_1.Logger(task.name);
        this.browser = null;
    }
    getPageUrl(listViewUrl, page) {
        return `${listViewUrl}&page=${page + 1}`;
    }
    async getContentUrls(page, baseUrl) {
        const urls = await page.evaluate(async (baseUrl) => {
            const table = document.querySelector('tbody.listwrap2');
            const contents = table === null || table === void 0 ? void 0 : table.querySelectorAll('tr.ub-content.us-post');
            const urls = [];
            for (const content of contents) {
                const title_section = content.querySelector('td.gall_tit.ub-word');
                if (title_section) {
                    const urlElement = title_section.querySelector('a');
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
        return urls.map((url) => (0, url_1.removeParamUrl)(url, ['page']));
    }
    async getTitle(page) {
        return page.evaluate(async () => {
            const _title = document.querySelector('#container > section > article:nth-child(3) > div.view_content_wrap > header > div > h3 > span.title_subject');
            return _title === null || _title === void 0 ? void 0 : _title.textContent.trim();
        });
    }
    async getAuthor(page) {
        return page.evaluate(async () => {
            const _author = document.querySelector('#container > section > article:nth-child(3) > div.view_content_wrap > header > div > div > div.fl > span.nickname > em');
            return _author === null || _author === void 0 ? void 0 : _author.textContent.trim();
        });
    }
    async getCreatedAt(page) {
        const createdAt = await page.evaluate(async () => {
            const _createdAt = document.querySelector('#container > section > article:nth-child(3) > div.view_content_wrap > header > div > div > div.fl > span.gall_date');
            return _createdAt === null || _createdAt === void 0 ? void 0 : _createdAt.getAttribute('title');
        });
        return createdAt;
    }
    async getContentText(page) {
        return null;
    }
    async getContentImageUrl(page) {
        const contentImgUrl = await page.evaluate(async () => {
            const _1 = document.querySelector('div.write_div');
            const _contentImgUrl = _1.querySelector('img');
            return _contentImgUrl === null || _contentImgUrl === void 0 ? void 0 : _contentImgUrl.getAttribute('src');
        });
        return contentImgUrl ? (0, url_1.normalizeUrl)(contentImgUrl) : null;
    }
    formatTimestamp(timestamp) {
        const year = Math.floor(timestamp / 100000000);
        const month = Math.floor((timestamp % 100000000) / 1000000);
        const day = Math.floor((timestamp % 1000000) / 10000);
        const hour = Math.floor((timestamp % 10000) / 100);
        const minute = timestamp % 100;
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
    async run() {
        if (this.isChannelRunning)
            return;
        await this.telegramServie.sendMessage(`${task.name} 작업 시작`);
        this.isChannelRunning = true;
        this.browser = await (0, task_utils_1.getBrowser)();
        await Promise.all(this.categories.map(async (category) => {
            const jobId = `${this.channel.name_ko}/${category.name}`;
            await this.runCategory(jobId, category);
        }));
        this.isChannelRunning = false;
        this.browser.close();
    }
    async runCategory(jobId, category) {
        var e_1, _a;
        if (this.isCategoryRunning[jobId])
            return;
        this.isCategoryRunning[jobId] = true;
        let total = 0;
        const page = await this.browser.newPage();
        try {
            await this.telegramServie.sendMessage(`${jobId} 작업 시작`);
            this.logger.log(`${jobId} 작업 시작`);
            const list_view_template = this.channel.list_view_url;
            const list_view_url = list_view_template.replace('{category}', category.path);
            let pageNum = 0;
            while (true) {
                const data = [];
                const pageUrl = this.getPageUrl(list_view_url, pageNum);
                await page.goto(pageUrl, {
                    waitUntil: value_1.WAIT_UNTIL_DOMCONTENT_LOADED,
                });
                const urls = await this.getContentUrls(page, this.channel.item_view_url);
                const existsUrls = await this.findExistsUrls(urls);
                const contentUrls = await this.removeExistsUrls(urls, existsUrls);
                if (contentUrls.length == 0)
                    break;
                try {
                    for (var contentUrls_1 = (e_1 = void 0, __asyncValues(contentUrls)), contentUrls_1_1; contentUrls_1_1 = await contentUrls_1.next(), !contentUrls_1_1.done;) {
                        const contentUrl = contentUrls_1_1.value;
                        try {
                            await page.goto(contentUrl, {
                                waitUntil: value_1.WAIT_UNTIL_DOMCONTENT_LOADED,
                            });
                            await (0, time_1.sleep)(task_constant_1.PAGE_SLEEP);
                            const title = await this.getTitle(page);
                            const author = await this.getAuthor(page);
                            const createdAt = await this.getCreatedAt(page);
                            const contentText = await this.getContentText(page);
                            const contentImageUrl = await this.getContentImageUrl(page);
                            this.logger.log(`${jobId}: ${JSON.stringify({
                                category_id: category.id,
                                url: contentUrl,
                                title: title,
                                author: author,
                                content_text: contentText,
                                content_img_url: contentImageUrl,
                                created_at: createdAt,
                            })}`);
                            data.push({
                                category_id: category.id,
                                url: contentUrl,
                                title: title,
                                author: author,
                                content_text: contentText,
                                content_img_url: contentImageUrl,
                                created_at: createdAt,
                            });
                        }
                        catch (e) {
                            this.logger.warn(`${jobId}-${contentUrl}-${e}`);
                            continue;
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (contentUrls_1_1 && !contentUrls_1_1.done && (_a = contentUrls_1.return)) await _a.call(contentUrls_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                const { error } = await this.supabaseService.createContents(data);
                if (error != null) {
                    this.logger.error(error);
                }
                total += data.length;
                pageNum += 1;
                this.logger.log(`${jobId}: ${data.length} 추가되었습니다.`);
                await this.telegramServie.sendMessage(`${jobId}: ${data.length} 추가되었습니다.`);
            }
        }
        catch (e) {
            this.logger.error(`${jobId} ${e}`);
            await this.telegramServie.sendMessage(`${jobId}: ${e}`);
        }
        finally {
            this.isCategoryRunning[jobId] = false;
            this.logger.log(`${task.name} 작업 마침: ${total}개 업데이트되었습니다.`);
            await this.telegramServie.sendMessage(`${task.name} 작업 마침: ${total}개 업데이트되었습니다.`);
            await page.close();
        }
    }
};
디시인사이드 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        telegram_service_1.TelegramService])
], 디시인사이드);
exports.디시인사이드 = 디시인사이드;
//# sourceMappingURL=%EB%94%94%EC%8B%9C%EC%9D%B8%EC%82%AC%EC%9D%B4%EB%93%9C.js.map