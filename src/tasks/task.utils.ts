import puppeteer from 'puppeteer';

export const getBrowser = async () => {
  return puppeteer.launch({
    headless: false,
    ignoreDefaultArgs: ['--disable-extensions'],
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
};
