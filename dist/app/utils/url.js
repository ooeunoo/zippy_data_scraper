"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParamValue = exports.removeParamUrl = exports.normalizeUrl = void 0;
const url_1 = require("url");
const normalizeUrl = (originUrl) => {
    if (originUrl === null || originUrl === void 0 ? void 0 : originUrl.startsWith('//')) {
        return `https:${originUrl}`;
    }
    else {
        return originUrl;
    }
};
exports.normalizeUrl = normalizeUrl;
const removeParamUrl = (originUrl, keys) => {
    const url = new URL(originUrl);
    const searchParams = new url_1.URLSearchParams(url.search);
    keys.forEach((key) => searchParams.delete(key));
    const modifiedUrl = `${url.origin}${url.pathname}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    return modifiedUrl;
};
exports.removeParamUrl = removeParamUrl;
const getParamValue = (originUrl, key) => {
    const url = new URL(originUrl);
    const value = url.searchParams.get(key);
    return value;
};
exports.getParamValue = getParamValue;
//# sourceMappingURL=url.js.map