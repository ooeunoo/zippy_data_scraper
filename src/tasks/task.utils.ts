import puppeteer from 'puppeteer';

export const getBrowser = async (headless = true) => {
  return puppeteer.launch({
    headless: headless,
    ignoreDefaultArgs: ['--disable-extensions'],
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
};
