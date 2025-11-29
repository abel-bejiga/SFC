"use strict";
// const puppeteer = require('puppeteer-core');
// const Configstore = require('configstore');
// const config = new Configstore('SFC');
// let browser;
// let page;
// async function initializeBrowser() {
//   if (browser) return browser;
//   // Try to get Chrome path from common locations
//   const getChromePath = () => {
//     const possiblePaths = [
//       '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
//       '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta',
//       '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
//       '/Applications/Chromium.app/Contents/MacOS/Chromium'
//     ];
//     const fs = require('fs');
//     for (const path of possiblePaths) {
//       if (fs.existsSync(path)) {
//         return path;
//       }
//     }
//     return null;
//   };
//   const chromePath = getChromePath();
//   const launchOptions = {
//     headless: 'new',
//     args: [
//       '--no-sandbox',
//       '--disable-setuid-sandbox',
//       '--disable-dev-shm-usage',
//       '--disable-accelerated-2d-canvas',
//       '--no-first-run',
//       '--no-zygote',
//       '--disable-gpu',
//       '--disable-features=site-per-process',
//       '--disable-web-security',
//       '--disable-features=VizDisplayCompositor'
//     ]
//   };
//   // If Chrome is found, use it instead of the bundled Chromium
//   if (chromePath) {
//     launchOptions.executablePath = chromePath;
//   }
//   try {
//     browser = await puppeteer.launch(launchOptions);
//   } catch (error) {
//     console.error('Failed to launch browser with default options, trying alternative configuration...');
//     // Fallback configuration
//     const fallbackOptions = {
//       headless: false, // Try non-headless mode
//       args: [
//         '--no-sandbox',
//         '--disable-setuid-sandbox',
//         '--disable-dev-shm-usage',
//         '--disable-accelerated-2d-canvas',
//         '--no-first-run',
//         '--no-zygote',
//         '--disable-gpu'
//       ]
//     };
//     if (chromePath) {
//       fallbackOptions.executablePath = chromePath;
//     }
//     browser = await puppeteer.launch(fallbackOptions);
//   }
//   page = await browser.newPage();
//   await page.setViewport({ width: 1280, height: 800 });
//   // Set user agent to avoid detection
//   await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
//   // Restore session if available
//   const cookies = config.get('cookies');
//   if (cookies) {
//     await page.setCookie(...cookies);
//   }
//   return browser;
// }
// async function closeBrowser() {
//   if (browser) {
//     await browser.close();
//     browser = null;
//     page = null;
//   }
// }
// async function saveSession() {
//   if (page) {
//     const cookies = await page.cookies();
//     config.set('cookies', cookies);
//   }
// }
// async function navigateTo(url) {
//   if (!page) await initializeBrowser();
//   await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
// }
// async function waitForElement(selector, timeout = 10000) {
//   if (!page) await initializeBrowser();
//   return await page.waitForSelector(selector, { timeout });
// }
// async function clickElement(selector) {
//   if (!page) await initializeBrowser();
//   await page.click(selector);
// }
// async function typeText(selector, text) {
//   if (!page) await initializeBrowser();
//   await page.type(selector, text);
// }
// async function evaluate(fn, ...args) {
//   if (!page) await initializeBrowser();
//   return await page.evaluate(fn, ...args);
// }
// async function getInnerHTML(selector) {
//   if (!page) await initializeBrowser();
//   return await page.$eval(selector, el => el.innerHTML);
// }
// async function getTextContent(selector) {
//   if (!page) await initializeBrowser();
//   return await page.$eval(selector, el => el.textContent);
// }
// module.exports = {
//   initializeBrowser,
//   closeBrowser,
//   saveSession,
//   navigateTo,
//   waitForElement,
//   clickElement,
//   typeText,
//   evaluate,
//   getInnerHTML,
//   getTextContent
// };
//# sourceMappingURL=browser.js.map