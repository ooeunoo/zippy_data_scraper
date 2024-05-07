"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memeory = exports.error = exports.end = exports.start = void 0;
const memory_1 = require("../utils/memory");
const start = (id) => `${id} 작업 시작`;
exports.start = start;
const end = (id) => `${id} 작업 마침`;
exports.end = end;
const error = (id, error) => `${id} 작업 오류: ${error}`;
exports.error = error;
const memeory = (id) => {
    return `${id}가 ${(0, memory_1.calculateMemoryMB)()}MB만큼 사용중입니다.`;
};
exports.memeory = memeory;
//# sourceMappingURL=message.js.map