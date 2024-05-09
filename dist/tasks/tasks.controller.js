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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksController = void 0;
const common_1 = require("@nestjs/common");
const ______1 = require("./community/\uB514\uC2DC\uC778\uC0AC\uC774\uB4DC");
const ___1 = require("./community/\uAC1C\uB4DC\uB9BD");
const task_constant_1 = require("./task.constant");
const ____1 = require("./community/\uB124\uC774\uD2B8\uD310");
const ___2 = require("./community/\uB8E8\uB9AC\uC6F9");
const __1 = require("./community/\uBF50\uBFCC");
const _____1 = require("./community/\uC5D0\uD3A8\uCF54\uB9AC\uC544");
const _____2 = require("./community/\uC624\uB298\uC758\uC720\uBA38");
const ____2 = require("./community/\uC6C3\uAE34\uB300\uD559");
const ____3 = require("./community/\uC778\uC2A4\uD2F0\uC988");
const ___3 = require("./community/\uD074\uB9AC\uC559");
const _____3 = require("./community/\uC5E0\uC5D8\uBE44\uD30C\uD06C");
const ____4 = require("./news/\uC5F0\uD569\uB274\uC2A4");
let TasksController = class TasksController {
    constructor(_디시인사이드, _개드립, _네이트판, _루리웹, _뽐뿌, _에펨코리아, _오늘의유머, _웃긴대학, _인스티즈, _클리앙, _엠엘비파크, _연합뉴스) {
        this._디시인사이드 = _디시인사이드;
        this._개드립 = _개드립;
        this._네이트판 = _네이트판;
        this._루리웹 = _루리웹;
        this._뽐뿌 = _뽐뿌;
        this._에펨코리아 = _에펨코리아;
        this._오늘의유머 = _오늘의유머;
        this._웃긴대학 = _웃긴대학;
        this._인스티즈 = _인스티즈;
        this._클리앙 = _클리앙;
        this._엠엘비파크 = _엠엘비파크;
        this._연합뉴스 = _연합뉴스;
        this.logger = new common_1.Logger('컨트롤러');
    }
    async start(id) {
        switch (id) {
            case task_constant_1.TASK_MAP.디시인사이드.name:
                await this._디시인사이드.run();
                break;
            case task_constant_1.TASK_MAP.개드립.name:
                await this._개드립.run();
                break;
            case task_constant_1.TASK_MAP.네이트판.name:
                await this._네이트판.run();
                break;
            case task_constant_1.TASK_MAP.루리웹.name:
                await this._루리웹.run();
                break;
            case task_constant_1.TASK_MAP.뽐뿌.name:
                await this._뽐뿌.run();
                break;
            case task_constant_1.TASK_MAP.에펨코리아.name:
                await this._에펨코리아.run();
                break;
            case task_constant_1.TASK_MAP.오늘의유머.name:
                await this._오늘의유머.run();
                break;
            case task_constant_1.TASK_MAP.웃긴대학.name:
                await this._웃긴대학.run();
                break;
            case task_constant_1.TASK_MAP.인스티즈.name:
                await this._인스티즈.run();
                break;
            case task_constant_1.TASK_MAP.클리앙.name:
                await this._클리앙.run();
                break;
            case task_constant_1.TASK_MAP.엠엘비파크.name:
                await this._엠엘비파크.run();
                break;
            case task_constant_1.TASK_MAP.연합뉴스.name:
                await this._연합뉴스.run();
                break;
        }
        return true;
    }
    async startAll(page) {
        try {
            await this._루리웹.run(page);
            await this._개드립.run(page);
            await this._네이트판.run(page);
            await this._뽐뿌.run(page);
            await this._디시인사이드.run(page);
            await this._에펨코리아.run(page);
            await this._오늘의유머.run(page);
            await this._웃긴대학.run(page);
            await this._인스티즈.run(page);
            await this._클리앙.run(page);
            await this._엠엘비파크.run(page);
            this.logger.log('작업이 모두 완료되었습니다.');
        }
        catch (e) {
            console.log(e);
        }
        return true;
    }
};
__decorate([
    (0, common_1.Post)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "start", null);
__decorate([
    (0, common_1.Post)('/limitpage/:page'),
    __param(0, (0, common_1.Param)('page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "startAll", null);
TasksController = __decorate([
    (0, common_1.Controller)('task'),
    __metadata("design:paramtypes", [______1.디시인사이드,
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
        ____4.연합뉴스])
], TasksController);
exports.TasksController = TasksController;
//# sourceMappingURL=tasks.controller.js.map