export interface CreateShortURLParams {
  originalUrl: string;
  slug?: string; // Optional custom slug
  expiresAt?: Date; // Optional expiration date
  utmParameters?: UTMParameters; // Optional UTM parameters
}

export interface ShortURL {
  id: string;
  originalURL: string;
  slug: string;
  expiresAt: Date | null;
  clickCount: number;
  lastAccessedAt: Date | null;
  utmParameters: UTMParameters | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UnwrappedURL {
  originalURL: string;
  unwrappedURL: string;
  redirectChain: string[];
  hopCount: number;
  elapsedTime: number;
  error?: string;
}

export interface ShortenURLResponse {
  shortURL: ShortURL;
  unwrappedURL?: UnwrappedURL;
}

export interface UTMParameters {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

export interface ErrorResponse {
  error: string;
}

export interface ClickData {
  id: string;
  shortUrlId: string;
  timestamp: Date;
  ipAddress: string | null;
  userAgent: string | null;
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  osVersion: string | null;
  device: string | null;
  isMobile: boolean;
  isBot: boolean;
  referer: string | null;
}

export interface URLStats extends ShortURL {
  clicks: ClickAnalytics;
}

export interface ClickAnalytics {
  total: number;
  browsers: Record<string, number>;
  os: Record<string, number>;
  devices: Record<string, number>;
  referrers: Record<string, number>;
  overTime: {
    date: string;
    count: number;
  }[];
  mobileVsDesktop: {
    mobile: number;
    desktop: number;
  };
}