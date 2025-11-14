import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { supabase } from '../supabase';

export interface ComparisonResult {
  pixelsDifferent: number;
  percentageDifferent: number;
  diffImageBuffer: Buffer;
  diffImageUrl?: string;
  baselineUrl: string;
  currentUrl: string;
  dimensions: { width: number; height: number };
  threshold: number;
  isSignificant: boolean;
}

export interface IgnoreRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  reason: string;
}

export interface ComparisonOptions {
  threshold?: number; // Percentage (0.1 = 10%) difference to flag as significant
  includeAntialiasing?: boolean;
  ignoreRegions?: IgnoreRegion[];
}

/**
 * Compare two screenshots and generate diff image
 */
export async function compareScreenshots(
  baselineUrl: string,
  currentUrl: string,
  options: ComparisonOptions = {}
): Promise<ComparisonResult> {
  try {
    // Fetch both images
    const baseline = await fetchImage(baselineUrl);
    const current = await fetchImage(currentUrl);

    // Normalize dimensions if different
    const { img1, img2 } = normalizeImages(baseline, current);

    // Apply ignore regions if provided
    const processedBaseline = options.ignoreRegions
      ? applyIgnoreRegions(img1, options.ignoreRegions)
      : img1;
    const processedCurrent = options.ignoreRegions
      ? applyIgnoreRegions(img2, options.ignoreRegions)
      : img2;

    // Create diff image buffer
    const { width, height } = processedBaseline;
    const diff = new PNG({ width, height });

    // Perform pixel comparison
    const numDiffPixels = pixelmatch(
      processedBaseline.data,
      processedCurrent.data,
      diff.data,
      width,
      height,
      {
        threshold: 0.1, // Pixel sensitivity (0.0 - 1.0)
        includeAA: options.includeAntialiasing || false,
        alpha: 0.1,
        diffColor: [255, 0, 0], // Red for differences
      }
    );

    const totalPixels = width * height;
    const percentageDiff = (numDiffPixels / totalPixels) * 100;

    // Generate diff image buffer
    const diffBuffer = PNG.sync.write(diff);

    // Upload diff image to Supabase storage
    let diffUrl: string | undefined;
    try {
      diffUrl = await uploadDiffImage(diffBuffer, baselineUrl, currentUrl);
    } catch (error) {
      console.error('Failed to upload diff image:', error);
      // Continue without diff URL
    }

    const thresholdPercentage = options.threshold || 0.1;

    return {
      pixelsDifferent: numDiffPixels,
      percentageDifferent: Number(percentageDiff.toFixed(2)),
      diffImageBuffer: diffBuffer,
      diffImageUrl: diffUrl,
      baselineUrl,
      currentUrl,
      dimensions: { width, height },
      threshold: thresholdPercentage,
      isSignificant: percentageDiff > thresholdPercentage,
    };
  } catch (error: any) {
    console.error('Screenshot comparison error:', error);
    throw new Error(`Failed to compare screenshots: ${error.message}`);
  }
}

/**
 * Fetch image from URL and parse as PNG
 */
async function fetchImage(url: string): Promise<PNG> {
  try {
    // Handle Supabase storage URLs or external URLs
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return PNG.sync.read(buffer);
  } catch (error: any) {
    throw new Error(`Failed to fetch image from ${url}: ${error.message}`);
  }
}

/**
 * Normalize images to same dimensions
 */
function normalizeImages(
  img1: PNG,
  img2: PNG
): { img1: PNG; img2: PNG } {
  // If dimensions match, return as-is
  if (img1.width === img2.width && img1.height === img2.height) {
    return { img1, img2 };
  }

  // Use the larger dimensions
  const width = Math.max(img1.width, img2.width);
  const height = Math.max(img1.height, img2.height);

  // Resize both images to match dimensions
  const resized1 = resizeImage(img1, width, height);
  const resized2 = resizeImage(img2, width, height);

  return { img1: resized1, img2: resized2 };
}

/**
 * Resize image to target dimensions (fill with white if needed)
 */
function resizeImage(img: PNG, targetWidth: number, targetHeight: number): PNG {
  const resized = new PNG({ width: targetWidth, height: targetHeight });

  // Fill with white background
  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const idx = (y * targetWidth + x) * 4;
      resized.data[idx] = 255;     // R
      resized.data[idx + 1] = 255; // G
      resized.data[idx + 2] = 255; // B
      resized.data[idx + 3] = 255; // A
    }
  }

  // Copy original image data
  for (let y = 0; y < Math.min(img.height, targetHeight); y++) {
    for (let x = 0; x < Math.min(img.width, targetWidth); x++) {
      const srcIdx = (y * img.width + x) * 4;
      const destIdx = (y * targetWidth + x) * 4;

      resized.data[destIdx] = img.data[srcIdx];
      resized.data[destIdx + 1] = img.data[srcIdx + 1];
      resized.data[destIdx + 2] = img.data[srcIdx + 2];
      resized.data[destIdx + 3] = img.data[srcIdx + 3];
    }
  }

  return resized;
}

/**
 * Apply ignore regions to an image (mask out specified areas)
 */
function applyIgnoreRegions(img: PNG, regions: IgnoreRegion[]): PNG {
  const modified = new PNG({ width: img.width, height: img.height });
  modified.data = Buffer.from(img.data);

  // Mask out ignore regions with neutral gray
  for (const region of regions) {
    const startX = Math.max(0, region.x);
    const startY = Math.max(0, region.y);
    const endX = Math.min(img.width, region.x + region.width);
    const endY = Math.min(img.height, region.y + region.height);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const idx = (y * img.width + x) * 4;
        // Set to neutral gray
        modified.data[idx] = 128;     // R
        modified.data[idx + 1] = 128; // G
        modified.data[idx + 2] = 128; // B
        modified.data[idx + 3] = 255; // A
      }
    }
  }

  return modified;
}

/**
 * Upload diff image to Supabase storage
 */
async function uploadDiffImage(
  diffBuffer: Buffer,
  baselineUrl: string,
  currentUrl: string
): Promise<string> {
  const timestamp = Date.now();
  const filename = `diff-${timestamp}.png`;
  const path = `diffs/${filename}`;

  const { data, error } = await supabase.storage
    .from('screenshots')
    .upload(path, diffBuffer, {
      contentType: 'image/png',
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload diff image: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('screenshots')
    .getPublicUrl(path);

  return urlData.publicUrl;
}

/**
 * Generate heatmap data from diff image
 */
export function generateHeatmap(diffImage: PNG, gridSize: number = 20): number[][] {
  const { width, height, data } = diffImage;
  const heatmap: number[][] = [];

  const cellWidth = Math.ceil(width / gridSize);
  const cellHeight = Math.ceil(height / gridSize);

  for (let y = 0; y < height; y += cellHeight) {
    const row: number[] = [];
    for (let x = 0; x < width; x += cellWidth) {
      // Calculate average difference in this cell
      let cellDiff = 0;
      let pixelCount = 0;

      for (let cy = y; cy < Math.min(y + cellHeight, height); cy++) {
        for (let cx = x; cx < Math.min(x + cellWidth, width); cx++) {
          const idx = (cy * width + cx) * 4;
          // Red channel contains diff intensity
          const diff = data[idx];
          cellDiff += diff;
          pixelCount++;
        }
      }

      // Normalize to 0-1 range
      row.push(cellDiff / pixelCount / 255);
    }
    heatmap.push(row);
  }

  return heatmap;
}
