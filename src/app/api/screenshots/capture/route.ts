import { NextRequest, NextResponse } from 'next/server';
import { VIEWPORTS, PAGE_LOAD_TIMEOUT } from '@/lib/config';
import { createContext, navigateToUrl, captureScreenshot, closeBrowser } from '@/lib/playwright/setup';
import { ScreenshotMetadata } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds for serverless function

interface CaptureRequest {
  url: string;
  viewports?: string[]; // viewport keys from VIEWPORTS config
}

export async function POST(request: NextRequest) {
  try {
    const body: CaptureRequest = await request.json();
    const { url, viewports: requestedViewports } = body;

    // Validate URL
    if (!url || !isValidUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL provided' },
        { status: 400 }
      );
    }

    // Determine which viewports to capture
    const viewportsToCapture = requestedViewports && requestedViewports.length > 0
      ? requestedViewports.filter(v => v in VIEWPORTS)
      : Object.keys(VIEWPORTS);

    if (viewportsToCapture.length === 0) {
      return NextResponse.json(
        { error: 'No valid viewports specified' },
        { status: 400 }
      );
    }

    const screenshots: ScreenshotMetadata[] = [];

    // Capture screenshots for each viewport
    for (const viewportKey of viewportsToCapture) {
      const viewport = VIEWPORTS[viewportKey];

      try {
        const context = await createContext(viewport);
        const page = await context.newPage();

        // Navigate to URL
        await navigateToUrl(page, url, PAGE_LOAD_TIMEOUT);

        // Wait a bit for dynamic content
        await page.waitForTimeout(1000);

        // Capture screenshot
        const screenshotBuffer = await captureScreenshot(page, { fullPage: true });

        // Convert to base64
        const base64 = screenshotBuffer.toString('base64');

        screenshots.push({
          viewportName: viewport.name,
          width: viewport.width,
          height: viewport.height,
          url: url,
          base64: base64,
        });

        // Cleanup
        await context.close();
      } catch (error) {
        console.error(`Failed to capture screenshot for ${viewport.name}:`, error);
        // Continue with other viewports even if one fails
      }
    }

    if (screenshots.length === 0) {
      return NextResponse.json(
        { error: 'Failed to capture any screenshots' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      screenshots,
      url,
    });

  } catch (error) {
    console.error('Screenshot capture error:', error);
    return NextResponse.json(
      { error: `Screenshot capture failed: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}
