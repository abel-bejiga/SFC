"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeBrowser = initializeBrowser;
exports.closeBrowser = closeBrowser;
exports.saveSession = saveSession;
exports.navigateTo = navigateTo;
exports.waitForElement = waitForElement;
exports.clickElement = clickElement;
exports.typeText = typeText;
exports.evaluate = evaluate;
exports.getInnerHTML = getInnerHTML;
exports.getTextContent = getTextContent;
exports.scrollPage = scrollPage;
const playwright_1 = require("playwright");
const configstore_1 = __importDefault(require("configstore"));
const chalk_1 = __importDefault(require("chalk"));
const config = new configstore_1.default("SFC");
let browser = null;
let page = null;
async function initializeBrowser() {
    if (browser)
        return;
    try {
        browser = await playwright_1.chromium.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-accelerated-2d-canvas",
                "--no-first-run",
                "--no-zygote",
                "--disable-gpu",
                "--window-size=1280,800",
            ],
        });
    }
    catch (error) {
        console.error("Failed to launch browser with default options, trying alternative configuration...");
        browser = await playwright_1.chromium.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-accelerated-2d-canvas",
                "--no-first-run",
                "--no-zygote",
                "--disable-gpu",
                "--window-size=1280,800",
            ],
        });
    }
    const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        viewport: { width: 1280, height: 800 },
    });
    page = await context.newPage();
    // Restore session if available
    const cookies = config.get("cookies");
    if (cookies) {
        await context.addCookies(cookies);
    }
}
async function closeBrowser() {
    if (browser) {
        await browser.close();
        browser = null;
        page = null;
    }
}
async function saveSession() {
    if (page) {
        const cookies = await page.context().cookies();
        config.set("cookies", cookies);
    }
}
async function navigateTo(url) {
    if (!page)
        await initializeBrowser();
    console.log(chalk_1.default.blue(`→ Navigating to: ${url}`));
    try {
        // First, just go to the URL without waiting for anything specific
        await page.goto(url, { waitUntil: "commit", timeout: 30000 });
        // Then wait for either the case content or a login page
        await Promise.race([
            page.waitForSelector("h1, h2, h3, .slds-form-element, .test-id__field-label", { timeout: 60000 }),
            page.waitForSelector("#username", { timeout: 10000 }),
            page.waitForSelector(".slds-icon-waffle", { timeout: 60000 }),
        ]);
        // Check if we're on a login page
        const currentUrl = page.url();
        if (currentUrl.includes("login") || currentUrl.includes("Login")) {
            throw new Error("Redirected to login page");
        }
        console.log(chalk_1.default.green("✓ Page loaded successfully"));
    }
    catch (error) {
        console.log(chalk_1.default.yellow(`→ Navigation warning: ${error.message}`));
        // Try to continue anyway if we have a valid URL
        const currentUrl = page.url();
        if (currentUrl.includes("lightning.force.com") &&
            !currentUrl.includes("login")) {
            console.log(chalk_1.default.green("✓ Page appears to be loaded despite warning"));
            return;
        }
        throw error;
    }
}
async function waitForElement(selector, timeout = 10000) {
    if (!page)
        await initializeBrowser();
    await page.waitForSelector(selector, { timeout });
}
async function clickElement(selector) {
    if (!page)
        await initializeBrowser();
    await page.click(selector);
}
async function typeText(selector, text) {
    if (!page)
        await initializeBrowser();
    await page.fill(selector, text);
}
async function evaluate(fn, ...args) {
    if (!page)
        await initializeBrowser();
    return await page.evaluate(fn, ...args);
}
async function getInnerHTML(selector) {
    if (!page)
        await initializeBrowser();
    return await page.$eval(selector, (el) => el.innerHTML);
}
async function getTextContent(selector) {
    if (!page)
        await initializeBrowser();
    return await page.$eval(selector, (el) => el.textContent || "");
}
// Scrolls the page down and back up to trigger lazy-loaded content
async function scrollPage() {
    if (!page)
        await initializeBrowser();
    console.log("→ Scrolling page to activate dynamic content...");
    await page.evaluate(async () => {
        const scrollStep = 200;
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        let totalHeight = document.body.scrollHeight;
        for (let y = 0; y < totalHeight; y += scrollStep) {
            window.scrollTo(0, y);
            await delay(100);
        }
        // Scroll back to top
        for (let y = totalHeight; y > 0; y -= scrollStep) {
            window.scrollTo(0, y);
            await delay(100);
        }
        window.scrollTo(0, 0);
    });
}
//# sourceMappingURL=playwright-browser.js.map