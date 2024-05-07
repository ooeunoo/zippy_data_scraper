import { URLSearchParams } from 'url';

export const normalizeUrl = (originUrl: string): string => {
  if (originUrl?.startsWith('//')) {
    return `https:${originUrl}`;
  } else {
    return originUrl;
  }
};

export const removeParamUrl = (originUrl: string, keys: string[]) => {
  const url = new URL(originUrl);

  const searchParams = new URLSearchParams(url.search);
  keys.forEach((key) => searchParams.delete(key));

  const modifiedUrl = `${url.origin}${url.pathname}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  return modifiedUrl;
};

export const getParamValue = (originUrl: string, key: string) => {
  const url = new URL(originUrl);
  const value = url.searchParams.get(key);
  return value;
};
