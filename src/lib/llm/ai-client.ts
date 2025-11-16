import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateGroqCompletion, isGroqConfigured } from './groq';
import { jsonrepair } from 'jsonrepair';

// Lazy initialization - only create client when needed (server-side only)
let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    // Check if we're in a server environment
    if (typeof window !== 'undefined') {
      throw new Error('Gemini client cannot be used in browser environment');
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

// Configuration
const GEMINI_MODEL = 'gemini-flash-latest';
const RATE_LIMIT_DELAY = 4000; // 4 seconds for Gemini
const MAX_GEMINI_RETRIES = 1; // Retry once with Gemini before falling back to Groq

let lastGeminiRequestTime = 0;

/**
 * Wait for rate limit delay if needed
 */
async function waitForGeminiRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastGeminiRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    const waitTime = RATE_LIMIT_DELAY - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  lastGeminiRequestTime = Date.now();
}

/**
 * Check if error is a rate limit error
 */
function isRateLimitError(error: unknown): boolean {
  if (!error) return false;

  const errorMessage = (error as Error).message || '';
  return (
    errorMessage.includes('429') ||
    errorMessage.includes('quota') ||
    errorMessage.includes('rate limit') ||
    errorMessage.toLowerCase().includes('resource exhausted')
  );
}

/**
 * Check if error is a network error (should trigger fallback to Groq)
 */
function isNetworkError(error: unknown): boolean {
  if (!error) return false;

  const errorMessage = (error as Error).message || '';
  return (
    errorMessage.includes('fetch failed') ||
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('ENOTFOUND') ||
    errorMessage.includes('ETIMEDOUT') ||
    errorMessage.includes('network') ||
    errorMessage.includes('connection')
  );
}

/**
 * Shared Gemini retry logic with Groq fallback
 */
async function executeWithRetryAndFallback(
  executeGemini: () => Promise<string>,
  prompt: string,
  options?: { temperature?: number; maxTokens?: number; systemPrompt?: string }
): Promise<{ text: string; provider: 'gemini' | 'groq' }> {
  let lastError: Error | null = null;

  // Try Gemini first (with one retry on rate limit)
  for (let attempt = 0; attempt <= MAX_GEMINI_RETRIES; attempt++) {
    try {
      await waitForGeminiRateLimit();
      const text = await executeGemini();
      return { text, provider: 'gemini' };
    } catch (error) {
      lastError = error as Error;

      // Network errors should trigger immediate fallback to Groq
      if (isNetworkError(error)) {
        console.warn(`[AI] Gemini network error: ${lastError.message}. Attempting Groq fallback...`);
        break; // Fall through to Groq fallback
      }

      if (isRateLimitError(error)) {
        if (attempt < MAX_GEMINI_RETRIES) {
          // Wait before retrying Gemini
          console.warn(`[AI] Gemini rate limited. Retrying in 15 seconds... (attempt ${attempt + 1}/${MAX_GEMINI_RETRIES})`);
          const retryDelay = 15000; // 15 seconds
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        // After max retries, fall through to Groq fallback
        console.warn(`[AI] Gemini rate limit exceeded after ${MAX_GEMINI_RETRIES} retries. Attempting Groq fallback...`);
        break;
      } else {
        // Other errors: log and rethrow
        console.error(`[AI] Gemini error (non-retryable): ${lastError.message}`);
        throw lastError;
      }
    }
  }

  // Fallback to Groq
  if (isGroqConfigured()) {
    try {
      console.log('[AI] Using Groq as fallback provider');
      const text = await generateGroqCompletion(prompt, options);
      console.log('[AI] Groq request successful');
      return { text, provider: 'groq' };
    } catch (groqError) {
      console.error('[AI] Groq fallback also failed:', (groqError as Error).message);
      throw new Error(
        `Both Gemini and Groq failed. Gemini: ${lastError?.message}, Groq: ${(groqError as Error).message}`
      );
    }
  } else {
    console.error('[AI] Groq not configured, cannot fallback. Set GROQ_API_KEY in .env.local');
    throw new Error(
      `Gemini failed and Groq not configured. Gemini error: ${lastError?.message}. Configure GROQ_API_KEY for fallback support.`
    );
  }
}

/**
 * Generate text completion using Gemini with Groq fallback
 * Retries once with Gemini on rate limit, then falls back to Groq
 */
export async function generateCompletion(
  prompt: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  }
): Promise<{ text: string; provider: 'gemini' | 'groq' }> {
  return executeWithRetryAndFallback(
    async () => {
      const client = getGeminiClient();
      const model = client.getGenerativeModel({ model: GEMINI_MODEL });

      // Build the full prompt with system instruction if provided
      const fullPrompt = options?.systemPrompt
        ? `${options.systemPrompt}\n\n${prompt}`
        : prompt;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 4096, // Increased from 2048 to 4096 for longer responses
        },
      });

      return result.response.text();
    },
    prompt,
    options
  );
}

/**
 * Generate completion with image support
 * Note: Falls back to text-only Groq if Gemini fails
 */
export async function generateCompletionWithImages(
  prompt: string,
  images: Array<{ data: string; mimeType: string }>,
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): Promise<{ text: string; provider: 'gemini' | 'groq' }> {
  return executeWithRetryAndFallback(
    async () => {
      const client = getGeminiClient();
      const model = client.getGenerativeModel({ model: GEMINI_MODEL });

      const imageParts = images.map(img => ({
        inlineData: {
          data: img.data,
          mimeType: img.mimeType,
        },
      }));

      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }, ...imageParts],
          },
        ],
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 8192, // Increased for image analysis with multiple scenarios
        },
      });

      return result.response.text();
    },
    prompt,
    options
  );
}

// Enable debug logging only in development
const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Parse JSON from AI response with robust error handling
 */
export function parseAIJsonResponse<T>(text: string): T {
  // Log first 500 chars of response for debugging
  if (DEBUG) {
    console.log('[parseAIJsonResponse] Raw response preview:', text.substring(0, 500));
  }

  // Detect truncated JSON responses
  const openBraces = (text.match(/\{/g) || []).length;
  const closeBraces = (text.match(/\}/g) || []).length;
  const openBrackets = (text.match(/\[/g) || []).length;
  const closeBrackets = (text.match(/\]/g) || []).length;

  if (openBraces !== closeBraces || openBrackets !== closeBrackets) {
    console.warn('[parseAIJsonResponse] Response appears truncated or malformed:', {
      openBraces,
      closeBraces,
      openBrackets,
      closeBrackets,
      responseLength: text.length
    });
  }

  // First, try to extract JSON from markdown code blocks
  let jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);

  if (jsonMatch && jsonMatch[1]) {
    try {
      const cleaned = sanitizeJsonString(jsonMatch[1].trim());
      const parsed = JSON.parse(cleaned);
      if (DEBUG) console.log('[parseAIJsonResponse] Successfully parsed from markdown code block');
      return parsed;
    } catch (error) {
      if (DEBUG) console.warn('[parseAIJsonResponse] Failed to parse markdown code block:', (error as Error).message);
      // Try jsonrepair on markdown content
      try {
        const repaired = jsonrepair(jsonMatch[1].trim());
        const parsed = JSON.parse(repaired);
        if (DEBUG) console.log('[parseAIJsonResponse] Successfully parsed markdown with jsonrepair');
        return parsed;
      } catch (repairError) {
        if (DEBUG) console.warn('[parseAIJsonResponse] jsonrepair also failed on markdown:', (repairError as Error).message);
        // Continue to next parsing method
      }
    }
  }

  // Try to find a JSON object or array in the response
  // Look for the first { or [ and try to parse from there
  const startBrace = text.indexOf('{');
  const startBracket = text.indexOf('[');

  // Determine which comes first
  let startPos = -1;
  if (startBrace !== -1 && (startBracket === -1 || startBrace < startBracket)) {
    startPos = startBrace;
  } else if (startBracket !== -1) {
    startPos = startBracket;
  }

  if (startPos !== -1) {
    // Try to parse from this position to the end
    const jsonCandidate = text.substring(startPos);

    // Try to parse the whole thing first with aggressive sanitization
    try {
      const cleaned = sanitizeJsonString(jsonCandidate);
      const parsed = JSON.parse(cleaned);
      if (DEBUG) console.log('[parseAIJsonResponse] Successfully parsed from JSON candidate');
      return parsed;
    } catch (error) {
      if (DEBUG) console.warn('[parseAIJsonResponse] Failed to parse full JSON candidate:', (error as Error).message);

      // Try with balanced extraction
      try {
        const extracted = extractBalancedJson(jsonCandidate);
        if (extracted) {
          const cleaned = sanitizeJsonString(extracted);
          const parsed = JSON.parse(cleaned);
          if (DEBUG) console.log('[parseAIJsonResponse] Successfully parsed from balanced extraction');
          return parsed;
        }
      } catch (balancedError) {
        if (DEBUG) console.warn('[parseAIJsonResponse] Failed to parse balanced JSON:', (balancedError as Error).message);
      }

      // Try aggressive line-by-line repair
      try {
        const repaired = repairJsonString(jsonCandidate);
        const parsed = JSON.parse(repaired);
        if (DEBUG) console.log('[parseAIJsonResponse] Successfully parsed after JSON repair');
        return parsed;
      } catch (repairError) {
        if (DEBUG) console.warn('[parseAIJsonResponse] Failed to parse repaired JSON:', (repairError as Error).message);
      }

      // Try jsonrepair library (most robust option)
      try {
        const repairedWithLib = jsonrepair(jsonCandidate);
        const parsed = JSON.parse(repairedWithLib);
        if (DEBUG) console.log('[parseAIJsonResponse] Successfully parsed using jsonrepair library');
        return parsed;
      } catch (libError) {
        if (DEBUG) console.warn('[parseAIJsonResponse] Failed to parse with jsonrepair library:', (libError as Error).message);
        // Continue to next parsing method
      }
    }
  }

  // Last resort: try to find just the scenarios array
  const scenariosMatch = text.match(/"scenarios"\s*:\s*(\[[\s\S]*?\])\s*[,}]/);
  if (scenariosMatch && scenariosMatch[1]) {
    try {
      const cleaned = sanitizeJsonString(scenariosMatch[1]);
      const scenarios = JSON.parse(cleaned);
      if (DEBUG) console.log('[parseAIJsonResponse] Successfully parsed scenarios array');
      return { scenarios } as T;
    } catch (error) {
      if (DEBUG) console.warn('[parseAIJsonResponse] Failed to parse scenarios array:', (error as Error).message);
      // Fall through to error
    }
  }

  // Log the full response for debugging when all parsing fails
  if (DEBUG) {
    console.error('[parseAIJsonResponse] All parsing methods failed. Full response:', text);
  }

  throw new Error(`Failed to parse JSON from AI response. Response length: ${text.length} chars. Preview: ${text.substring(0, 200)}...`);
}

/**
 * Sanitize JSON string by removing common AI response issues
 */
function sanitizeJsonString(jsonString: string): string {
  // Remove trailing commas before closing braces/brackets
  let cleaned = jsonString.replace(/,(\s*[}\]])/g, '$1');

  // Remove comments (// or /* */)
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  cleaned = cleaned.replace(/\/\/.*/g, '');

  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Aggressively repair JSON string with common issues
 */
function repairJsonString(jsonString: string): string {
  let repaired = jsonString;

  // First apply basic sanitization
  repaired = sanitizeJsonString(repaired);

  // Fix unescaped quotes in strings (common AI mistake)
  // This is a simple heuristic - look for patterns like: "text with "quotes" inside"
  // and replace with: "text with \"quotes\" inside"
  repaired = repaired.replace(/"([^"]*)"([^"]*)"([^"]*)":/g, (match, p1, p2, p3) => {
    // If p2 contains a colon, it's likely a value with unescaped quotes
    if (p2.includes(':')) {
      return match; // Leave as is, probably correct
    }
    // Otherwise escape the inner quotes
    return `"${p1}\\"${p2}\\"${p3}":`;
  });

  // Fix single quotes used instead of double quotes for keys
  repaired = repaired.replace(/'([^']+)':/g, '"$1":');

  // Remove trailing commas more aggressively
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

  // Fix missing commas between array elements (heuristic)
  repaired = repaired.replace(/\}(\s*)\{/g, '},$1{');
  repaired = repaired.replace(/\](\s*)\[/g, '],$1[');

  // Remove any null bytes or other control characters
  repaired = repaired.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, '');

  return repaired;
}

/**
 * Extract balanced JSON from a string (finds matching braces/brackets)
 */
function extractBalancedJson(text: string): string | null {
  const firstChar = text.charAt(0);
  if (firstChar !== '{' && firstChar !== '[') {
    return null;
  }

  const openChar = firstChar;
  const closeChar = openChar === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i);

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === openChar) {
      depth++;
    } else if (char === closeChar) {
      depth--;
      if (depth === 0) {
        const extracted = text.substring(0, i + 1);
        if (DEBUG) console.log('[extractBalancedJson] Successfully extracted', extracted.length, 'characters');
        return extracted;
      }
    }
  }

  if (DEBUG) console.error('[extractBalancedJson] Unbalanced JSON, final depth:', depth);
  return null;
}

/**
 * Get the Gemini model instance (for direct use cases that need specific Gemini features)
 */
export function getGeminiModel() {
  const client = getGeminiClient();
  return client.getGenerativeModel({ model: GEMINI_MODEL });
}

/**
 * Check if AI client is properly configured
 * Safe to call from both client and server
 */
export function isAIConfigured(): {
  gemini: boolean;
  groq: boolean;
  hasAnyProvider: boolean;
} {
  // Return false for all if in browser environment
  if (typeof window !== 'undefined') {
    return {
      gemini: false,
      groq: false,
      hasAnyProvider: false,
    };
  }

  const gemini = Boolean(process.env.GEMINI_API_KEY);
  const groq = isGroqConfigured();

  return {
    gemini,
    groq,
    hasAnyProvider: gemini || groq,
  };
}
