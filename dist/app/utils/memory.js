"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateMemoryMB = void 0;
const calculateMemoryMB = () => {
    const use = process.memoryUsage().heapUsed / 1024 / 1024;
    return Math.round(use * 100) / 100;
};
exports.calculateMemoryMB = calculateMemoryMB;
//# sourceMappingURL=memory.js.map