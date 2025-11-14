export interface ViewportConfig {
  width: number;
  height: number;
  name: string;
}

export const VIEWPORTS: Record<string, ViewportConfig> = {
  mobile_small: { width: 375, height: 667, name: 'iPhone SE' },
  mobile_large: { width: 390, height: 844, name: 'iPhone 12' },
  tablet: { width: 768, height: 1024, name: 'iPad' },
  desktop: { width: 1920, height: 1080, name: 'Desktop HD' },
  desktop_large: { width: 2560, height: 1440, name: 'Desktop 2K' },
};

export const SCREENSHOT_TIMEOUT = 30000; // 30 seconds
export const PAGE_LOAD_TIMEOUT = 30000; // 30 seconds
export const DEFAULT_WAIT_FOR = 'networkidle' as const;

export const API_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
};
