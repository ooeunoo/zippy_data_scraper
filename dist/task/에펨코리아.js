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
exports.에펨코리아 = void 0;
const common_1 = require("@nestjs/common");
const page_task_1 = require("../app/templates/page_task");
const supabase_service_1 = require("../supabase/supabase.service");
const schedule_1 = require("@nestjs/schedule");
const value_1 = require("../app/constants/value");
const cron_1 = require("cron");
const puppeteer_1 = require("puppeteer");
const time_1 = require("../app/utils/time");
const message_1 = require("../app/logger/message");
const config_1 = require("@nestjs/config");
const TASK = {
    id: 8,
    name: '에펨코리아',
};
let 에펨코리아 = class 에펨코리아 extends page_task_1.PageTask {
    constructor(supabaseService, schedulerRegistry, configService) {
        super(supabaseService, TASK.id);
        this.supabaseService = supabaseService;
        this.schedulerRegistry = schedulerRegistry;
        this.configService = configService;
        this.isChannelRunning = false;
        this.isCategoryRunning = {};
        this.logger = new common_1.Logger(TASK.name);
        this.browser = null;
    }
    getPageUrl(listViewUrl, page) {
        return `${listViewUrl}&page=${page + 1}`;
    }
    async getContents(page, channel, category) {
        const results = await page.evaluate((channel, category) => {
            var _a, _b;
            const contents = [];
            const table = document.querySelector('table > tbody');
            const rows = table === null || table === void 0 ? void 0 : table.querySelectorAll('tr:not(.notice)');
            for (const row of rows) {
                const titleCol = row.querySelector('.title');
                const titlePart = titleCol === null || titleCol === void 0 ? void 0 : titleCol.querySelector('a');
                const prevUrl = titlePart === null || titlePart === void 0 ? void 0 : titlePart.getAttribute('href');
                if (prevUrl == null)
                    continue;
                const url = channel.item_view_url.replace('{url}', prevUrl);
                const title = titlePart === null || titlePart === void 0 ? void 0 : titlePart.textContent;
                if (title == null)
                    continue;
                const author = (_a = row.querySelector('.author')) === null || _a === void 0 ? void 0 : _a.textContent;
                const createdAt = (_b = row.querySelector('.time')) === null || _b === void 0 ? void 0 : _b.textContent;
                contents.push({
                    category_id: category.id,
                    url,
                    title: title === null || title === void 0 ? void 0 : title.trim(),
                    author: author === null || author === void 0 ? void 0 : author.trim(),
                    created_at: createdAt,
                });
            }
            return contents;
        }, channel, category);
        return results.map((result) => {
            result.created_at = result.created_at
                ? this.formatCreatedAt(result.created_at)
                : null;
            return result;
        });
    }
    formatCreatedAt(text) {
        const today = new Date();
        const [hours, minutes] = text.split(':');
        const formattedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(hours), parseInt(minutes));
        const formattedDateString = `${formattedDate.getFullYear()}-${(formattedDate.getMonth() + 1)
            .toString()
            .padStart(2, '0')}-${formattedDate
            .getDate()
            .toString()
            .padStart(2, '0')} ${formattedDate
            .getHours()
            .toString()
            .padStart(2, '0')}:${formattedDate
            .getMinutes()
            .toString()
            .padStart(2, '0')}`;
        return formattedDateString;
    }
    async runChannel() {
        var e_1, _a;
        if (this.isChannelRunning)
            return;
        if (this.browser == null) {
            this.browser = await puppeteer_1.default.launch({
                headless: false,
            });
        }
        setInterval(() => {
            console.log((0, message_1.memeory)(TASK.name));
        }, 10000);
        this.isChannelRunning = true;
        try {
            for (var _b = __asyncValues(this.categories), _c; _c = await _b.next(), !_c.done;) {
                const category = _c.value;
                const jobId = `${this.channel.name_ko}/${category.name}`;
                const exists = await this.schedulerRegistry.doesExist('cron', jobId);
                if (!exists) {
                    this.isCategoryRunning[jobId] = false;
                    const job = new cron_1.CronJob(this.configService.get('NODE_ENV') == 'production'
                        ? schedule_1.CronExpression.EVERY_HOUR
                        : schedule_1.CronExpression.EVERY_SECOND, async () => {
                        await this.runCategory(jobId, category);
                    });
                    await this.schedulerRegistry.addCronJob(jobId, job);
                    job.start();
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) await _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        this.isChannelRunning = false;
    }
    async runCategory(jobId, category) {
        if (this.isCategoryRunning[jobId])
            return;
        this.isCategoryRunning[jobId] = true;
        const page = await this.browser.newPage();
        try {
            this.logger.log(`${jobId} 시작`);
            const list_view_template = this.channel.list_view_url;
            const list_view_url = list_view_template.replace('{category}', category.path);
            let pageNum = 0;
            while (true) {
                const pageUrl = this.getPageUrl(list_view_url, pageNum);
                await (0, time_1.sleep)(5000);
                await page.goto(pageUrl, {
                    waitUntil: value_1.WAIT_UNTIL_DOMCONTENT_LOADED,
                });
                const contents = await this.getContents(page, this.channel, category);
                const contentUrls = contents.map(({ url }) => url);
                const existsUrls = await this.findExistsUrls(contentUrls);
                const newContents = contents.filter((content) => !existsUrls.includes(content.url));
                console.log(newContents);
                if (newContents.length == 0)
                    break;
                await this.supabaseService.createContents(newContents);
                pageNum += 1;
            }
        }
        catch (e) {
            this.logger.error(`${jobId} ${e}`);
        }
        finally {
            this.isCategoryRunning[jobId] = false;
            this.logger.log(`${jobId} 끝`);
            await page.close();
        }
    }
};
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_SECOND, { name: TASK.name }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], 에펨코리아.prototype, "runChannel", null);
에펨코리아 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        schedule_1.SchedulerRegistry,
        config_1.ConfigService])
], 에펨코리아);
exports.에펨코리아 = 에펨코리아;
//# sourceMappingURL=%EC%97%90%ED%8E%A8%EC%BD%94%EB%A6%AC%EC%95%84.js.map