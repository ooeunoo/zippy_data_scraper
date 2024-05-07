import puppeteer from 'puppeteer';

export const getBrowser = async () => {
  return puppeteer.launch({
    headless: true,
    ignoreDefaultArgs: ['--disable-extensions'],
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
};
