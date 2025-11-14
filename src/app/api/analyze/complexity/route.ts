import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

interface ComplexityAnalysis {
  estimatedDurationMs: number;
  complexity: 'simple' | 'moderate' | 'complex';
  factors: {
    htmlSizeKb: number;
    scriptTags: number;
    styleTags: number;
    imageTags: number;
    estimatedDomNodes: number;
    externalResources: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || !isValidUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL provided' },
        { status: 400 }
      );
    }

    // Fetch the page HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();

    // Analyze complexity factors
    const analysis = analyzeComplexity(html);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error('Complexity analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Complexity analysis failed' },
      { status: 500 }
    );
  }
}

function analyzeComplexity(html: string): ComplexityAnalysis {
  // Calculate HTML size
  const htmlSizeKb = Buffer.byteLength(html, 'utf8') / 1024;

  // Count various elements
  const scriptTags = (html.match(/<script/gi) || []).length;
  const styleTags = (html.match(/<link[^>]*rel=["']stylesheet["']/gi) || []).length + (html.match(/<style/gi) || []).length;
  const imageTags = (html.match(/<img/gi) || []).length;

  // Estimate DOM nodes (rough approximation based on opening tags)
  const estimatedDomNodes = (html.match(/<[a-z][\s\S]*?>/gi) || []).length;

  // Count external resources (scripts, stylesheets, images with src)
  const externalScripts = (html.match(/<script[^>]*src=/gi) || []).length;
  const externalStyles = (html.match(/<link[^>]*rel=["']stylesheet["']/gi) || []).length;
  const externalImages = (html.match(/<img[^>]*src=/gi) || []).length;
  const externalResources = externalScripts + externalStyles + externalImages;

  // Check for SPA frameworks (React, Vue, Angular, etc.)
  const hasSpaFramework = /react|vue|angular|next-data|__nuxt/i.test(html);

  // Calculate complexity score (weighted factors)
  let complexityScore = 0;

  // HTML size contribution (0-100 points)
  complexityScore += Math.min(htmlSizeKb / 2, 100); // Every 2KB adds 1 point, max 100

  // Script tags (0-100 points)
  complexityScore += Math.min(scriptTags * 5, 100); // 5 points per script, max 100

  // Style tags (0-50 points)
  complexityScore += Math.min(styleTags * 3, 50); // 3 points per style, max 50

  // DOM nodes (0-100 points)
  complexityScore += Math.min(estimatedDomNodes / 10, 100); // 10 nodes = 1 point, max 100

  // External resources (0-100 points)
  complexityScore += Math.min(externalResources * 2, 100); // 2 points per resource, max 100

  // SPA framework bonus (adds 50 points)
  if (hasSpaFramework) {
    complexityScore += 50;
  }

  // Determine complexity level
  let complexity: 'simple' | 'moderate' | 'complex';
  if (complexityScore < 100) {
    complexity = 'simple';
  } else if (complexityScore < 250) {
    complexity = 'moderate';
  } else {
    complexity = 'complex';
  }

  // Estimate duration based on complexity
  // Base time: 30 seconds
  // Simple sites: 30s - 90s (0.5 - 1.5 minutes)
  // Moderate sites: 90s - 180s (1.5 - 3 minutes)
  // Complex sites: 180s - 300s (3 - 5 minutes)
  let estimatedDurationMs: number;

  if (complexity === 'simple') {
    // 30-90 seconds based on complexity score
    estimatedDurationMs = 30000 + (complexityScore * 600); // 0-100 score = 30-90s
  } else if (complexity === 'moderate') {
    // 90-180 seconds
    estimatedDurationMs = 90000 + ((complexityScore - 100) * 600); // 100-250 score = 90-180s
  } else {
    // 180-300 seconds
    estimatedDurationMs = 180000 + ((complexityScore - 250) * 480); // 250+ score = 180-300s
  }

  // Cap at 5 minutes maximum
  estimatedDurationMs = Math.min(estimatedDurationMs, 300000);

  return {
    estimatedDurationMs: Math.round(estimatedDurationMs),
    complexity,
    factors: {
      htmlSizeKb: Math.round(htmlSizeKb * 100) / 100,
      scriptTags,
      styleTags,
      imageTags,
      estimatedDomNodes,
      externalResources,
    },
  };
}

function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}
