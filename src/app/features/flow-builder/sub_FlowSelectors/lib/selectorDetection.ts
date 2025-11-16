import { DetectedElement } from './types';

/**
 * API response from selector detection endpoint
 */
interface SelectorDetectionResponse {
  elements: DetectedElement[];
}

/**
 * Detect selectors from a given URL
 */
export async function detectSelectors(url: string): Promise<DetectedElement[]> {
  if (!url || url.trim().length === 0) {
    throw new Error('Please enter a target URL first');
  }

  const response = await fetch('/api/selectors/detect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to detect selectors');
  }

  const data: SelectorDetectionResponse = await response.json();
  return data.elements || [];
}
