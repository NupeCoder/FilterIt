const puppeteer = require('puppeteer');

const EXTENSION_PATH = '/Users/zaffar/Desktop/FilterIt/FilterIt';
const EXTENSION_ID = 'bpepedfhfdmgemfhndigcfjnngkjjcea';

describe('Add word Test', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`
      ]
    });

    const popupPage = await browser.newPage();
    page = popupPage;
    await page.goto(`chrome-extension://${EXTENSION_ID}/main.html`);

    
  });

  test('should open the extension popup and add a word to the list', async () => {

    // --- New code to add a word to the list ---
    const testWord = 'TestWordssss';

    page.on('dialog', async dialog => {
      await dialog.accept();
    })

    await page.type('#keyword', testWord);       // Type the word
    await page.click('#add');                    // Click the "Add" button


    await page.click('#toggle-list');            // Open the word list section
    await page.waitForSelector('#word-list');    // Wait for list to appear

    const listItems = await page.$$eval('#word-list li', items =>
      items.map(item => item.childNodes[0].textContent.trim()) // deals with the X 
    );

    expect(listItems).toContain(testWord);       // Check if word was added
  });

  afterAll(async () => {
    await browser.close();
    browser = undefined;
  });


});
