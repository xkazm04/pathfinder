import { supabase } from '../supabase';

export interface ScreenshotMetadata {
  testRunId: string;
  testName: string;
  stepName: string;
  viewport: string;
  timestamp: number;
}

/**
 * Upload a screenshot to Supabase Storage
 */
export async function uploadScreenshot(
  screenshot: Buffer,
  metadata: ScreenshotMetadata
): Promise<string> {
  const fileName = `${metadata.testRunId}/${metadata.viewport}/${metadata.stepName}-${metadata.timestamp}.png`;

  try {
    // Check if bucket exists first
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

    if (bucketError || !buckets?.find(b => b.name === 'test-screenshots')) {
      console.warn('Screenshot storage bucket not found. Screenshots will not be uploaded.');
      return ''; // Return empty string instead of failing
    }

    const { data, error } = await supabase.storage
      .from('test-screenshots')
      .upload(fileName, screenshot, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.warn(`Screenshot upload failed: ${error.message}`);
      return ''; // Return empty string instead of throwing
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('test-screenshots')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.warn('Failed to upload screenshot:', error);
    return ''; // Return empty string instead of throwing
  }
}

/**
 * Upload multiple screenshots in batch
 */
export async function uploadScreenshots(
  screenshots: Array<{ buffer: Buffer; metadata: ScreenshotMetadata }>,
  testRunId: string,
  viewportId: string
): Promise<string[]> {
  const urls: string[] = [];

  for (const screenshot of screenshots) {
    try {
      const url = await uploadScreenshot(screenshot.buffer, screenshot.metadata);
      urls.push(url);
    } catch (error) {
      console.error(`Failed to upload screenshot for ${screenshot.metadata.stepName}:`, error);
      // Continue with other screenshots even if one fails
    }
  }

  return urls;
}

/**
 * Delete screenshots for a test run
 */
export async function deleteTestRunScreenshots(testRunId: string): Promise<void> {
  try {
    // List all files in the test run folder
    const { data: files, error: listError } = await supabase.storage
      .from('test-screenshots')
      .list(testRunId);

    if (listError) {
      throw new Error(`Failed to list screenshots: ${listError.message}`);
    }

    if (!files || files.length === 0) {
      return;
    }

    // Delete all files
    const filePaths = files.map(file => `${testRunId}/${file.name}`);
    const { error: deleteError } = await supabase.storage
      .from('test-screenshots')
      .remove(filePaths);

    if (deleteError) {
      throw new Error(`Failed to delete screenshots: ${deleteError.message}`);
    }
  } catch (error) {
    console.error('Failed to delete test run screenshots:', error);
    throw error;
  }
}

/**
 * Get screenshot URLs for a test run
 */
export async function getTestRunScreenshots(testRunId: string): Promise<string[]> {
  try {
    const { data: files, error } = await supabase.storage
      .from('test-screenshots')
      .list(testRunId, {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'asc' },
      });

    if (error) {
      throw new Error(`Failed to list screenshots: ${error.message}`);
    }

    if (!files || files.length === 0) {
      return [];
    }

    // Get public URLs for all files
    const urls = files.map(file => {
      const { data } = supabase.storage
        .from('test-screenshots')
        .getPublicUrl(`${testRunId}/${file.name}`);
      return data.publicUrl;
    });

    return urls;
  } catch (error) {
    console.error('Failed to get test run screenshots:', error);
    return [];
  }
}

/**
 * Convert base64 image to Buffer
 */
export function base64ToBuffer(base64: string): Buffer {
  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

/**
 * Compress screenshot before upload (optional optimization)
 */
export async function compressScreenshot(buffer: Buffer, quality: number = 80): Promise<Buffer> {
  // For now, return the buffer as-is
  // In a production app, you'd use a library like sharp for compression
  return buffer;
}
