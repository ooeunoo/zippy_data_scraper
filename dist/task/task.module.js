"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskModule = void 0;
const common_1 = require("@nestjs/common");
const ______1 = require("./community/\uB514\uC2DC\uC778\uC0AC\uC774\uB4DC");
const supabase_module_1 = require("../supabase/supabase.module");
const config_1 = require("@nestjs/config");
let TaskModule = class TaskModule {
};
TaskModule = __decorate([
    (0, common_1.Module)({
        imports: [supabase_module_1.SupabaseModule, config_1.ConfigModule.forRoot()],
        providers: [______1.디시인사이드],
    })
], TaskModule);
exports.TaskModule = TaskModule;
//# sourceMappingURL=task.module.js.map