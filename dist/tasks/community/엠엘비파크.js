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
exports.엠엘비파크 = void 0;
const common_1 = require("@nestjs/common");
const page_task_1 = require("../../app/templates/page_task");
const supabase_service_1 = require("../../supabase/supabase.service");
const url_1 = require("../../app/utils/url");
const value_1 = require("../../app/constants/value");
const puppeteer_1 = require("puppeteer");
const time_1 = require("../../app/utils/time");
const task_constant_1 = require("../task.constant");
const task = task_constant_1.TASK_MAP.엠엘비파크;
let 엠엘비파크 = class 엠엘비파크 extends page_task_1.PageTask {
    constructor(supabaseService) {
        super(supabaseService, task.id);
        this.supabaseService = supabaseService;
        this.isChannelRunning = false;
        this.isCategoryRunning = {};
        this.logger = new common_1.Logger(task.name);
        this.browser = null;
    }
    getPageUrl(listViewUrl, page) {
        return `${listViewUrl}&p=${page * 30 + 1}`;
    }
    async getContentUrls(page) {
        const urls = await page.evaluate(async () => {
            const table = document.querySelector('table > tbody');
            const contents = table.querySelectorAll('tr');
            const urls = [];
            for (const content of contents) {
                const titleSection = content.querySelector('div.tit');
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
        return urls.map((url) => (0, url_1.removeParamUrl)(url, [
            'site',
            'usre',
            'subquery',
            'subselect',
            'select',
            'b',
            'p',
            'user',
            'm',
            'query',
        ]));
    }
    async getTitle(page) {
        return page.evaluate(async () => {
            const element = document.querySelector('.titles');
            let title = '';
            element.childNodes.forEach((node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    title += node.textContent;
                }
            });
            return title.trim();
        });
    }
    async getAuthor(page) {
        return page.evaluate(async () => {
            const _author = document.querySelector('#container > div.contents > div.left_cont > ul > li > div.text > div.text_left > div.text1.bat > span.nick');
            return _author === null || _author === void 0 ? void 0 : _author.textContent.trim();
        });
    }
    async getCreatedAt(page) {
        const createdAt = await page.evaluate(async () => {
            const _createdAt = document.querySelector('#container > div.contents > div.left_cont > ul > li > div.text > div.text_right > div.text3 > span.val');
            return _createdAt ? _createdAt.textContent.trim() : null;
        });
        return createdAt;
    }
    async getContentText(page) {
        return '';
    }
    async getContentImageUrl(page) {
        const contentImgUrl = await page.evaluate(async () => {
            const _1 = document.querySelector('.view_context');
            const _contentImgUrl = _1.querySelector('img');
            return _contentImgUrl === null || _contentImgUrl === void 0 ? void 0 : _contentImgUrl.getAttribute('src');
        });
        if (contentImgUrl ==
            'https://yellow.contentsfeed.com/RealMedia/ads/Creatives/default/empty.gif') {
            return null;
        }
        return contentImgUrl ? (0, url_1.normalizeUrl)(contentImgUrl) : null;
    }
    async run() {
        if (this.isChannelRunning)
            return;
        this.isChannelRunning = true;
        this.browser = await puppeteer_1.default.launch({
            headless: true,
        });
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
            this.logger.log(`${jobId} 시작`);
            const list_view_template = this.channel.list_view_url;
            const list_view_url = list_view_template.replace('{category}', category.path);
            let pageNum = 0;
            while (true) {
                const data = [];
                const pageUrl = this.getPageUrl(list_view_url, pageNum);
                await page.goto(pageUrl, {
                    waitUntil: value_1.WAIT_UNTIL_DOMCONTENT_LOADED,
                });
                const urls = await this.getContentUrls(page);
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
                await this.supabaseService.createContents(data);
                total += data.length;
                pageNum += 1;
            }
        }
        catch (e) {
            this.logger.error(`${jobId} ${e}`);
        }
        finally {
            this.isCategoryRunning[jobId] = false;
            this.logger.log(`${jobId} 끝: ${total}개 업데이트`);
            await page.close();
        }
    }
};
엠엘비파크 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], 엠엘비파크);
exports.엠엘비파크 = 엠엘비파크;
//# sourceMappingURL=%EC%97%A0%EC%97%98%EB%B9%84%ED%8C%8C%ED%81%AC.js.map