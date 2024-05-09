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
exports.인스티즈 = void 0;
const common_1 = require("@nestjs/common");
const page_task_1 = require("../../app/templates/page_task");
const supabase_service_1 = require("../../supabase/supabase.service");
const url_1 = require("../../app/utils/url");
const value_1 = require("../../app/constants/value");
const time_1 = require("../../app/utils/time");
const task_constant_1 = require("../task.constant");
const task_utils_1 = require("../task.utils");
const telegram_service_1 = require("../../telegram/telegram.service");
const task = task_constant_1.TASK_MAP.인스티즈;
let 인스티즈 = class 인스티즈 extends page_task_1.PageTask {
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
        return urls.map((url) => (0, url_1.removeParamUrl)(url, ['page', 'category', 'green', 'grnpage']));
    }
    async getTitle(page) {
        return page.evaluate(async () => {
            const titleGroup = document.querySelector('#nowsubject');
            if (titleGroup) {
                const cmtElement = titleGroup === null || titleGroup === void 0 ? void 0 : titleGroup.querySelector('.cmt');
                cmtElement.remove();
            }
            return titleGroup === null || titleGroup === void 0 ? void 0 : titleGroup.textContent;
        });
    }
    async getAuthor(page) {
        return page.evaluate(async () => {
            const infoGroup = document.querySelector('.tb_left');
            const author = infoGroup === null || infoGroup === void 0 ? void 0 : infoGroup.querySelector('a');
            return author === null || author === void 0 ? void 0 : author.textContent;
        });
    }
    async getCreatedAt(page) {
        return page.evaluate(async () => {
            const infoGroup = document.querySelector('.tb_left');
            const createdAt = infoGroup.querySelector('span[itemprop="datePublished"]');
            return createdAt === null || createdAt === void 0 ? void 0 : createdAt.getAttribute('content');
        });
    }
    async getContentText(page) {
        return null;
    }
    async getContentImageUrl(page) {
        return page.evaluate(async () => {
            const _1 = document.querySelector('#memo_content_1');
            const _2 = _1.querySelector('img');
            return _2 === null || _2 === void 0 ? void 0 : _2.getAttribute('src');
        });
    }
    async run(limitPage) {
        if (this.isChannelRunning)
            return;
        await this.telegramServie.sendMessage(`${task.name} 작업 시작`);
        this.isChannelRunning = true;
        this.browser = await (0, task_utils_1.getBrowser)();
        await Promise.all(this.categories.map(async (category) => {
            const jobId = `${this.channel.name_ko}/${category.name}`;
            await this.runCategory(jobId, category, limitPage);
        }));
        this.isChannelRunning = false;
        this.browser.close();
    }
    async runCategory(jobId, category, limitPage) {
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
                this.logger.debug(`${jobId} 작업 현재 페이지: ${pageNum}`);
                if (limitPage != null) {
                    if (pageNum == limitPage) {
                        this.logger.debug(`${jobId} 마지막 작업페이지 도달하여 작업을 중단합니다.`);
                        break;
                    }
                }
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
                this.logger.debug(`${jobId}: ${data.length} 추가되었습니다.`);
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
인스티즈 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        telegram_service_1.TelegramService])
], 인스티즈);
exports.인스티즈 = 인스티즈;
//# sourceMappingURL=%EC%9D%B8%EC%8A%A4%ED%8B%B0%EC%A6%88.js.map