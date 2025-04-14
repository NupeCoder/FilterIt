// tests/addWord.test.js
const puppeteer = require('puppeteer');
const path = require('path');

const EXTENSION_PATH = path.join(__dirname, '../'); // Root of your extension

describe('Extension popup', () => {
  let browser, page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
      ],
    });

    const extensionPage = await browser.newPage();
    const targets = await browser.targets();
    const extensionTarget = targets.find(
      t => t.type() === 'background_page' || t.url().includes('popup.html')
    );

    const targetPage = await extensionTarget.page();
    page = targetPage;
    await page.bringToFront();
  });

  afterAll(() => {
    browser.close();
  });

  it('should add a word to the word list', async () => {
    await page.waitForSelector('#keyword');
    await page.type('#keyword', 'testword');
    await page.click('#add');

    const listText = await page.$eval('#word-list', el => el.innerText);
    expect(listText).toContain('testword');
  });
});
