"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoreTask = void 0;
const base_1 = require("./base");
class MoreTask extends base_1.TaskBase {
    constructor(supabaseService, id) {
        super(supabaseService, id);
        this.supabaseService = supabaseService;
        this.id = id;
        this.chunkSize = 50;
    }
}
exports.MoreTask = MoreTask;
//# sourceMappingURL=more_task.js.map