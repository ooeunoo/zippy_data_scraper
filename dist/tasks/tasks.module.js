"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksModule = void 0;
const common_1 = require("@nestjs/common");
const supabase_module_1 = require("../supabase/supabase.module");
const config_1 = require("@nestjs/config");
const ______1 = require("./community/\uB514\uC2DC\uC778\uC0AC\uC774\uB4DC");
const tasks_controller_1 = require("./tasks.controller");
const ___1 = require("./community/\uAC1C\uB4DC\uB9BD");
const ____1 = require("./community/\uB124\uC774\uD2B8\uD310");
const ___2 = require("./community/\uB8E8\uB9AC\uC6F9");
const __1 = require("./community/\uBF50\uBFCC");
const _____1 = require("./community/\uC5D0\uD3A8\uCF54\uB9AC\uC544");
const _____2 = require("./community/\uC624\uB298\uC758\uC720\uBA38");
const ____2 = require("./community/\uC6C3\uAE34\uB300\uD559");
const ____3 = require("./community/\uC778\uC2A4\uD2F0\uC988");
const _____3 = require("./community/\uC5E0\uC5D8\uBE44\uD30C\uD06C");
const ____4 = require("./news/\uC5F0\uD569\uB274\uC2A4");
const ___3 = require("./community/\uD074\uB9AC\uC559");
const telegram_module_1 = require("../telegram/telegram.module");
let TasksModule = class TasksModule {
};
TasksModule = __decorate([
    (0, common_1.Module)({
        imports: [supabase_module_1.SupabaseModule, config_1.ConfigModule.forRoot(), telegram_module_1.TelegramModule],
        providers: [
            ______1.디시인사이드,
            ___1.개드립,
            ____1.네이트판,
            ___2.루리웹,
            __1.뽐뿌,
            _____1.에펨코리아,
            _____2.오늘의유머,
            ____2.웃긴대학,
            ____3.인스티즈,
            ___3.클리앙,
            _____3.엠엘비파크,
            ____4.연합뉴스,
        ],
        controllers: [tasks_controller_1.TasksController],
    })
], TasksModule);
exports.TasksModule = TasksModule;
//# sourceMappingURL=tasks.module.js.map