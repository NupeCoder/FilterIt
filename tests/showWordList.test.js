const puppeteer = require('puppeteer');

const EXTENSION_PATH = '/Users/zaffar/Desktop/FilterIt/FilterIt';
const EXTENSION_ID = 'bpepedfhfdmgemfhndigcfjnngkjjcea';

let browser;

beforeEach(async () => {
    browser = await puppeteer.launch({
        headless: false,
        args: [
          `--disable-extensions-except=${EXTENSION_PATH}`,
          `--load-extension=${EXTENSION_PATH}`
        ]
      });
});

test('popup renders correctly', async () => {
    const page = await browser.newPage();
    await page.goto(`chrome-extension://${EXTENSION_ID}/main.html`);
  });

afterEach(async () => {
    await browser.close();
    browser = undefined;
});