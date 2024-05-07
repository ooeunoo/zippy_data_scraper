"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageTask = void 0;
const base_1 = require("./base");
class PageTask extends base_1.TaskBase {
    constructor(supabaseService, id) {
        super(supabaseService, id);
        this.supabaseService = supabaseService;
        this.id = id;
    }
}
exports.PageTask = PageTask;
//# sourceMappingURL=page_task.js.map