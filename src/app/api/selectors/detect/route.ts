import { NextResponse } from 'next/server';
import { chromium } from 'playwright';

export const maxDuration = 60;

interface DetectedElement {
  type: 'button' | 'input' | 'link' | 'select' | 'text' | 'other';
  selector: string;
  text?: string;
  placeholder?: string;
  role?: string;
  ariaLabel?: string;
  id?: string;
  name?: string;
  className?: string;
}

/**
 * Detect interactive elements and their selectors on a webpage
 * POST /api/selectors/detect
 * Body: { url: string }
 */
export async function POST(request: Request) {
  let browser;

  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Launch browser
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    const page = await context.newPage();

    // Navigate to URL
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Detect interactive elements
    const elements = await page.evaluate(() => {
      const results: DetectedElement[] = [];

      // Helper to generate a good selector
      function generateSelector(element: Element): string {
        // Try ID first
        if (element.id) {
          return `#${element.id}`;
        }

        // Try data-testid or similar attributes
        const testId = element.getAttribute('data-testid') ||
                       element.getAttribute('data-test') ||
                       element.getAttribute('data-cy');
        if (testId) {
          return `[data-testid="${testId}"]`;
        }

        // Try name attribute
        const name = element.getAttribute('name');
        if (name) {
          return `[name="${name}"]`;
        }

        // Try aria-label
        const ariaLabel = element.getAttribute('aria-label');
        if (ariaLabel) {
          return `[aria-label="${ariaLabel}"]`;
        }

        // Try role + text content
        const role = element.getAttribute('role');
        const text = element.textContent?.trim();
        if (role && text && text.length < 50) {
          return `[role="${role}"]:has-text("${text.substring(0, 30)}")`;
        }

        // Try placeholder for inputs
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          const placeholder = (element as HTMLInputElement).placeholder;
          if (placeholder) {
            return `[placeholder="${placeholder}"]`;
          }
        }

        // Fallback to class + tag
        if (element.className && typeof element.className === 'string') {
          const classes = element.className.split(' ').filter(c => c.length > 0);
          if (classes.length > 0) {
            return `${element.tagName.toLowerCase()}.${classes[0]}`;
          }
        }

        // Last resort: tag name with nth-of-type
        const parent = element.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter(
            child => child.tagName === element.tagName
          );
          const index = siblings.indexOf(element) + 1;
          return `${element.tagName.toLowerCase()}:nth-of-type(${index})`;
        }

        return element.tagName.toLowerCase();
      }

      // Detect buttons
      document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]').forEach((el) => {
        const text = el.textContent?.trim() || (el as HTMLInputElement).value;
        if (text) {
          results.push({
            type: 'button',
            selector: generateSelector(el),
            text,
            role: el.getAttribute('role') || undefined,
            ariaLabel: el.getAttribute('aria-label') || undefined,
            id: el.id || undefined,
            className: el.className || undefined,
          });
        }
      });

      // Detect inputs
      document.querySelectorAll('input:not([type="hidden"]):not([type="button"]):not([type="submit"]), textarea').forEach((el) => {
        const input = el as HTMLInputElement | HTMLTextAreaElement;
        results.push({
          type: 'input',
          selector: generateSelector(el),
          placeholder: input.placeholder || undefined,
          name: input.name || undefined,
          id: input.id || undefined,
          ariaLabel: el.getAttribute('aria-label') || undefined,
        });
      });

      // Detect links
      document.querySelectorAll('a[href]').forEach((el) => {
        const text = el.textContent?.trim();
        if (text && text.length < 100) {
          results.push({
            type: 'link',
            selector: generateSelector(el),
            text,
            id: el.id || undefined,
          });
        }
      });

      // Detect selects
      document.querySelectorAll('select').forEach((el) => {
        results.push({
          type: 'select',
          selector: generateSelector(el),
          name: (el as HTMLSelectElement).name || undefined,
          id: el.id || undefined,
          ariaLabel: el.getAttribute('aria-label') || undefined,
        });
      });

      // Detect clickable text elements (with role or onclick handlers)
      document.querySelectorAll('[role="link"], [role="menuitem"], [onclick]').forEach((el) => {
        if (!el.matches('button, a, input')) { // Avoid duplicates
          const text = el.textContent?.trim();
          if (text && text.length < 100) {
            results.push({
              type: 'other',
              selector: generateSelector(el),
              text,
              role: el.getAttribute('role') || undefined,
            });
          }
        }
      });

      return results;
    });

    await browser.close();

    // Deduplicate based on selector
    const uniqueElements = Array.from(
      new Map(elements.map(el => [el.selector, el])).values()
    );

    return NextResponse.json({
      success: true,
      url,
      elements: uniqueElements,
      count: uniqueElements.length,
    });

  } catch (error: unknown) {
    if (browser) {
      await browser.close();
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to detect selectors';
    console.error('Selector detection error:', error);

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
