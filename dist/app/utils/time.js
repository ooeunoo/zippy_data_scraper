"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTimeAgo = exports.getCurrnetTime = exports.sleep = void 0;
const sleep = (ms) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};
exports.sleep = sleep;
const getCurrnetTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}`;
    return formattedDate;
};
exports.getCurrnetTime = getCurrnetTime;
const calculateTimeAgo = (timeText) => {
    const currentTime = new Date();
    if (timeText.includes('일')) {
        const daysAgo = parseInt(timeText.split(' ')[0]);
        const calculatedTime = new Date(currentTime.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        return calculatedTime.toISOString().slice(0, 19).replace('T', ' ');
    }
    else if (timeText.includes('시간')) {
        const hoursAgo = parseInt(timeText.split(' ')[0]);
        const calculatedTime = new Date(currentTime.getTime() - hoursAgo * 60 * 60 * 1000);
        return calculatedTime.toISOString().slice(0, 19).replace('T', ' ');
    }
    else if (timeText.includes('분')) {
        const minutesAgo = parseInt(timeText.split(' ')[0]);
        const calculatedTime = new Date(currentTime.getTime() - minutesAgo * 60 * 1000);
        return calculatedTime.toISOString().slice(0, 19).replace('T', ' ');
    }
    else {
        return currentTime.toISOString().slice(0, 19).replace('T', ' ');
    }
};
exports.calculateTimeAgo = calculateTimeAgo;
//# sourceMappingURL=time.js.map