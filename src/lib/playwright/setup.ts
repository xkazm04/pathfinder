import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { ViewportConfig } from '../config';

let browser: Browser | null = null;

/**
 * Get or create a Playwright browser instance
 */
export async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    });
  }
  return browser;
}

/**
 * Close the browser instance
 */
export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

/**
 * Create a new browser context with specified viewport
 */
export async function createContext(
  viewport: ViewportConfig
): Promise<BrowserContext> {
  const browserInstance = await getBrowser();
  return await browserInstance.newContext({
    viewport: {
      width: viewport.width,
      height: viewport.height,
    },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
}

/**
 * Navigate to URL with proper error handling and wait strategies
 */
export async function navigateToUrl(
  page: Page,
  url: string,
  timeout: number = 30000
): Promise<void> {
  try {
    await page.goto(url, {
      timeout,
      waitUntil: 'networkidle',
    });
  } catch (error) {
    // Fallback to 'load' if 'networkidle' times out
    try {
      await page.goto(url, {
        timeout,
        waitUntil: 'load',
      });
    } catch (retryError) {
      throw new Error(`Failed to navigate to ${url}: ${(retryError as Error).message}`);
    }
  }
}

/**
 * Capture full-page screenshot
 */
export async function captureScreenshot(
  page: Page,
  options?: { fullPage?: boolean }
): Promise<Buffer> {
  return await page.screenshot({
    fullPage: options?.fullPage ?? true,
    type: 'png',
  });
}
