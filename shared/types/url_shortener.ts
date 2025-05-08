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