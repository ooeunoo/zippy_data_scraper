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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
const table_1 = require("../app/constants/table");
let SupabaseService = class SupabaseService {
    constructor(configService) {
        this.configService = configService;
        this._supabase = (0, supabase_js_1.createClient)(this.configService.get('SUPABASE_URL'), this.configService.get('SUPABASE_ANON_URL'));
    }
    get client() {
        return this._supabase;
    }
    async createContents(data) {
        try {
            await this._supabase.from(table_1.TABLE.content).insert(data);
        }
        catch (e) {
            console.log(e);
        }
    }
    async updateCategoryRunning(categoryId, running) {
        try {
            await this._supabase
                .from(table_1.TABLE.category)
                .update({ is_running: running })
                .eq('id', categoryId);
        }
        catch (e) {
            console.log(e);
        }
    }
    async updateChannelRunning(channelId, running) {
        try {
            await this._supabase
                .from(table_1.TABLE.channel)
                .update({ is_running: running })
                .eq('id', channelId);
        }
        catch (e) {
            console.log(e);
        }
    }
};
SupabaseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SupabaseService);
exports.SupabaseService = SupabaseService;
//# sourceMappingURL=supabase.service.js.map