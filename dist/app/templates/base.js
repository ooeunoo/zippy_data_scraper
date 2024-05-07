"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskBase = void 0;
const table_1 = require("../constants/table");
const schedule_1 = require("@nestjs/schedule");
const CRON = schedule_1.CronExpression.EVERY_MINUTE;
class TaskBase {
    constructor(supabaseService, id) {
        this.supabaseService = supabaseService;
        this.id = id;
    }
    async onModuleInit() {
        await this._setupInfo();
    }
    async _setupInfo() {
        const { data: channel } = await this.supabaseService.client
            .from(table_1.TABLE.channel)
            .select('*')
            .eq('id', this.id)
            .single();
        const { data: categories } = await this.supabaseService.client
            .from(table_1.TABLE.category)
            .select('*')
            .eq('channel_id', this.id)
            .eq('status', true);
        this.channel = channel;
        this.categories = categories;
    }
    async updateChannelStatus(status) {
        await this.supabaseService.client
            .from(table_1.TABLE.channel)
            .update({ status: status })
            .eq('id', this.id);
    }
    async findExistsUrls(urls) {
        const { data } = await this.supabaseService.client
            .from(table_1.TABLE.content)
            .select('url')
            .in('url', urls);
        return data.map(({ url }) => url);
    }
    removeExistsUrls(newUrls, existsUrls) {
        return newUrls.filter((newUrl) => !existsUrls.includes(newUrl));
    }
}
exports.TaskBase = TaskBase;
//# sourceMappingURL=base.js.map