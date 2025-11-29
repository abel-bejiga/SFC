import { chromium, Browser, Page, BrowserContext } from "playwright";
import Configstore from "configstore";
import chalk from "chalk";

const config = new Configstore("SFC");

let browser: Browser | null = null;
let page: Page | null = null;

export async function initializeBrowser(): Promise<void> {
  if (browser) return;

  try {
    browser = await chromium.launch({
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
  } catch (error) {
    console.error(
      "Failed to launch browser with default options, trying alternative configuration..."
    );
    browser = await chromium.launch({
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

  const context: BrowserContext = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
  });

  page = await context.newPage();

  // Restore session if available
  const cookies = config.get("cookies");
  if (cookies) {
    await context.addCookies(cookies);
  }
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
    page = null;
  }
}

export async function saveSession(): Promise<void> {
  if (page) {
    const cookies = await page!.context().cookies();
    config.set("cookies", cookies);
  }
}

export async function navigateTo(url: string): Promise<void> {
  if (!page) await initializeBrowser();
  console.log(chalk.blue(`→ Navigating to: ${url}`));

  try {
    // First, just go to the URL without waiting for anything specific
    await page!.goto(url, { waitUntil: "commit", timeout: 30000 });

    // Then wait for either the case content or a login page
    await Promise.race([
      page!.waitForSelector(
        "h1, h2, h3, .slds-form-element, .test-id__field-label",
        { timeout: 60000 }
      ),
      page!.waitForSelector("#username", { timeout: 10000 }),
      page!.waitForSelector(".slds-icon-waffle", { timeout: 60000 }),
    ]);

    // Check if we're on a login page
    const currentUrl = page!.url();
    if (currentUrl.includes("login") || currentUrl.includes("Login")) {
      throw new Error("Redirected to login page");
    }

    console.log(chalk.green("✓ Page loaded successfully"));
  } catch (error) {
    console.log(
      chalk.yellow(`→ Navigation warning: ${(error as Error).message}`)
    );

    // Try to continue anyway if we have a valid URL
    const currentUrl = page!.url();
    if (
      currentUrl.includes("lightning.force.com") &&
      !currentUrl.includes("login")
    ) {
      console.log(chalk.green("✓ Page appears to be loaded despite warning"));
      return;
    }

    throw error;
  }
}

export async function waitForElement(
  selector: string,
  timeout: number = 10000
): Promise<void> {
  if (!page) await initializeBrowser();
  await page!.waitForSelector(selector, { timeout });
}

export async function clickElement(selector: string): Promise<void> {
  if (!page) await initializeBrowser();
  await page!.click(selector);
}

export async function typeText(selector: string, text: string): Promise<void> {
  if (!page) await initializeBrowser();
  await page!.fill(selector, text);
}

export async function evaluate(
  fn: (...args: any[]) => any,
  ...args: any[]
): Promise<any> {
  if (!page) await initializeBrowser();
  return await page!.evaluate(fn, ...args);
}

export async function getInnerHTML(selector: string): Promise<string> {
  if (!page) await initializeBrowser();
  return await page!.$eval(selector, (el) => el.innerHTML);
}

export async function getTextContent(selector: string): Promise<string> {
  if (!page) await initializeBrowser();
  return await page!.$eval(selector, (el) => el.textContent || "");
}

// Scrolls the page down and back up to trigger lazy-loaded content
export async function scrollPage(): Promise<void> {
  if (!page) await initializeBrowser();
  console.log("→ Scrolling page to activate dynamic content...");

  await page!.evaluate(async () => {
    const scrollStep = 200;
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));
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
