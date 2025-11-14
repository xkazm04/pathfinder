import { NextRequest, NextResponse } from 'next/server';
import {
  getIgnoreRegions,
  saveIgnoreRegion,
} from '@/lib/supabase/visualRegressions';
import type { IgnoreRegion } from '@/lib/diff/screenshotComparator';

/**
 * GET /api/diff/ignore-regions?suiteId=xxx&testName=xxx&viewport=xxx
 * Get ignore regions for a test
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const suiteId = searchParams.get('suiteId');
    const testName = searchParams.get('testName') || undefined;
    const viewport = searchParams.get('viewport') || undefined;

    if (!suiteId) {
      return NextResponse.json(
        { error: 'Missing required parameter: suiteId' },
        { status: 400 }
      );
    }

    const regions = await getIgnoreRegions(suiteId, testName, viewport);

    return NextResponse.json({
      success: true,
      count: regions.length,
      regions,
    });
  } catch (error: any) {
    console.error('Get ignore regions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch ignore regions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/diff/ignore-regions
 * Add an ignore region
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { suiteId, testName, viewport, region } = body;

    if (!suiteId || !region) {
      return NextResponse.json(
        { error: 'Missing required fields: suiteId and region' },
        { status: 400 }
      );
    }

    // Validate region structure
    if (
      typeof region.x !== 'number' ||
      typeof region.y !== 'number' ||
      typeof region.width !== 'number' ||
      typeof region.height !== 'number'
    ) {
      return NextResponse.json(
        {
          error: 'Invalid region format. Must include x, y, width, height (numbers)',
        },
        { status: 400 }
      );
    }

    const ignoreRegion: IgnoreRegion = {
      x: region.x,
      y: region.y,
      width: region.width,
      height: region.height,
      reason: region.reason || 'Dynamic content',
    };

    await saveIgnoreRegion(suiteId, ignoreRegion, testName, viewport);

    return NextResponse.json({
      success: true,
      message: 'Ignore region added successfully',
    });
  } catch (error: any) {
    console.error('Save ignore region error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save ignore region' },
      { status: 500 }
    );
  }
}
