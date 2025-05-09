import { db } from "../db/knex";
import crypto from "crypto";
import { UAParser } from 'ua-parser-js';
import { Request } from "express";
import axios from "axios";

import { CreateShortURLParams, ShortURL, URLStats, ClickAnalytics, UnwrappedURL, ShortenURLResponse } from "@shared/types/url_shortener"
import { USER_AGENT } from "@app/utils";

// Simple in-memory cache for frequently accessed URLs
const urlCache = new Map<string, string>();
const CACHE_MAX_SIZE = 1000; // Maximum cache size

export class URLShortenerService {
  /**
   * Generate a random slug of specified length
   */
  private generateSlug(length: number = 8): string {
    return crypto.randomBytes(length).toString('hex').substring(0, length);
  }

  /**
   * Create a shortened URL with optional parameters and unwrap the original URL (if it's a redirect)
   */
  async createShortURL(params: CreateShortURLParams): Promise<ShortenURLResponse> {
    let { originalUrl, slug, expiresAt, utmParameters } = params;

    // Try to unwrap the URL in the background
    let unwrappedUrl: UnwrappedURL | undefined;
    try {
      unwrappedUrl = await this.unwrapURL(originalUrl);
      originalUrl = unwrappedUrl.unwrappedURL; // Use the unwrapped URL
    } catch (error) {
      console.error("Error unwrapping URL during creation:", error);
      // Continue without unwrapped URL if there was an error
    }
    
    // Add UTM parameters to the original URL if provided
    if (utmParameters && Object.keys(utmParameters).length > 0) {
      const url = new URL(originalUrl);
      Object.entries(utmParameters).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
      originalUrl = url.toString();
    }
    
    // Generate a random slug if none provided
    if (!slug) {
      slug = this.generateSlug();
      // Ensure slug is unique
      let isUnique = false;
      while (!isUnique) {
        const existing = await db("shortened_urls").where({ slug }).first();
        if (!existing) {
          isUnique = true;
        } else {
          slug = this.generateSlug();
        }
      }
    } else {
      // Check if custom slug already exists
      const existing = await db("shortened_urls").where({ slug }).first();
      if (existing) {
        throw new Error("Custom slug already exists");
      }
    }
    
    // Insert the new shortened URL into the database
    const [shortUrl] = await db("shortened_urls")
      .insert({
        originalURL: originalUrl,
        slug,
        expiresAt: expiresAt,
        utmParameters: utmParameters,
      })
      .returning("*");
    
    return { shortURL: shortUrl, unwrappedURL: unwrappedUrl };
  }

  /**
   * Get a shortened URL by slug and track click data
   */
  async getBySlugAndTrack(slug: string, req?: Request): Promise<ShortURL | null> {
    // Check cache first
    if (urlCache.has(slug)) {
      const originalUrl = urlCache.get(slug);
      if (originalUrl) {
        // Get the short URL data for tracking
        const shortUrl = await db("shortened_urls").where({ slug }).first();
        if (shortUrl) {
          // Track click in background without waiting
          void this.trackClick(shortUrl.id, req);
          // Update click count and last access time
          void db("shortened_urls")
            .where({ id: shortUrl.id })
            .increment("clickCount", 1)
            .update({ lastAccessedAt: new Date() });
        }
        
        return {
          id: shortUrl?.id || "",
          originalURL: originalUrl,
          slug,
          expiresAt: null,
          clickCount: 0,
          lastAccessedAt: null,
          utmParameters: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
    }

    // If not in cache, fetch from database
    const shortUrl = await db("shortened_urls")
      .where({ slug })
      .first();
    
    if (!shortUrl) {
      return null;
    }
    
    // Check if URL has expired
    if (shortUrl.expiresAt && new Date(shortUrl.expiresAt) < new Date()) {
      return null;
    }
    
    // Track click
    await this.trackClick(shortUrl.id, req);
    
    // Update click count and last access time
    await db("shortened_urls")
      .where({ id: shortUrl.id })
      .increment("clickCount", 1)
      .update({ lastAccessedAt: new Date() });
    
    // Add to cache
    this.addToCache(slug, shortUrl.originalURL);
    
    return shortUrl;
  }

  /**
   * Track click data for a shortened URL
   */
  private async trackClick(shortUrlId: string, req?: Request): Promise<void> {
    if (!req) return;

    const rawUserAgent = req.headers['user-agent'];
    const referrer = req.headers['referer'] || req.headers['referrer'] || null;

    const ua = new UAParser(rawUserAgent || '');
    const uaResult = ua.getResult();

    await db("link_clicks").insert({
      shortUrlId,
      ipAddress: req.ip,
      userAgent: rawUserAgent,
      browser: uaResult.browser.name,
      browserVersion: uaResult.browser.version,
      os: uaResult.os.name,
      osVersion: uaResult.os.version,
      device: uaResult.device.model || uaResult.device.type,
      isMobile: Boolean(uaResult.device.type === 'mobile'),
      isBot: /bot|crawler|spider|crawling/i.test(rawUserAgent || ''),
      referer: referrer
    });
  }

  /**
   * Get statistics for a shortened URL
   */
  async getStats(slug: string): Promise<ShortURL | null> {
    return await db("shortened_urls")
      .where({ slug })
      .first();
  }
  
  /**
   * Add a URL to the cache
   */
  private addToCache(slug: string, originalUrl: string): void {
    // If cache is full, remove the oldest entry (first inserted)
    if (urlCache.size >= CACHE_MAX_SIZE) {
      const firstKey = urlCache.keys().next().value;
      if (!firstKey) return;
      // Remove the first key from the cache
      urlCache.delete(firstKey);
    }
    
    urlCache.set(slug, originalUrl);
  }

  /**
   * Get detailed statistics for a shortened URL
   */
  async getDetailedStats(slug: string): Promise<URLStats | null> {
    const shortUrl = await db("shortened_urls")
      .where({ slug })
      .first();

    if (!shortUrl) {
      return null;
    }

    const clicks = await this.getClickAnalytics(shortUrl.id);
    return {
      ...shortUrl,
      clicks
    };
  }

  /**
   * Get click analytics for a shortened URL
   */
  private async getClickAnalytics(shortUrlId: string): Promise<ClickAnalytics> {
    // Get all clicks for the URL
    const clicks = await db("link_clicks")
      .where({ shortUrlId })
      .orderBy("timestamp", "asc");

    // Initialize analytics object
    const analytics: ClickAnalytics = {
      total: clicks.length,
      browsers: {},
      os: {},
      devices: {},
      referrers: {},
      overTime: [],
      mobileVsDesktop: {
        mobile: 0,
        desktop: 0
      }
    };

    // Create a map for tracking daily clicks
    const dailyClicks = new Map<string, number>();

    // Process each click
    clicks.forEach(click => {
      // Count browsers
      if (click.browser) {
        analytics.browsers[click.browser] = (analytics.browsers[click.browser] || 0) + 1;
      }

      // Count operating systems
      if (click.os) {
        analytics.os[click.os] = (analytics.os[click.os] || 0) + 1;
      }

      // Count devices
      if (click.device) {
        analytics.devices[click.device] = (analytics.devices[click.device] || 0) + 1;
      }

      // Count referrers
      if (click.referer) {
        const referrerHost = new URL(click.referer).hostname;
        analytics.referrers[referrerHost] = (analytics.referrers[referrerHost] || 0) + 1;
      }

      // Track mobile vs desktop
      if (click.isMobile) {
        analytics.mobileVsDesktop.mobile++;
      } else {
        analytics.mobileVsDesktop.desktop++;
      }

      // Track clicks over time
      const date = new Date(click.timestamp).toISOString().split('T')[0];
      dailyClicks.set(date, (dailyClicks.get(date) || 0) + 1);
    });

    // Convert daily clicks to sorted array
    analytics.overTime = Array.from(dailyClicks.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return analytics;
  }

  /**
   * Unwrap a shortened URL to find the final destination
   * Follows redirect chains including popular URL shorteners
   */
  async unwrapURL(url: string, maxRedirects: number = 10): Promise<UnwrappedURL> {
    const startTime = Date.now();
    const redirectChain: string[] = [url];
    let currentUrl = url;
    let finalUrl = url;
    let hopCount = 0;

    try {
      // Follow redirects until we reach the final destination or max redirects
      while (hopCount < maxRedirects) {
        const response = await axios.head(currentUrl, {
          maxRedirects: 0,
          validateStatus: status => status < 400 || status === 429 || status === 301 || status === 302 || status === 307 || status === 308,
          timeout: 5000,
          headers: {
            'User-Agent': USER_AGENT
          }
        });

        // Check if we have a redirect
        if (response.status >= 300 && response.status < 400 && response.headers.location) {
          const nextUrl = new URL(response.headers.location, currentUrl).toString();
          
          // Prevent infinite loops
          if (redirectChain.includes(nextUrl)) {
            break;
          }
          
          redirectChain.push(nextUrl);
          currentUrl = nextUrl;
          finalUrl = nextUrl;
          hopCount++;
        } else {
          // No more redirects, we've reached the final URL
          finalUrl = currentUrl;
          break;
        }
      }

      const elapsedTime = Date.now() - startTime;

      return {
        originalURL: url,
        unwrappedURL: finalUrl,
        redirectChain,
        hopCount,
        elapsedTime
      };
    } catch (error) {
      console.error("Error unwrapping URL:", error);
      
      // Return what we have so far
      return {
        originalURL: url,
        unwrappedURL: finalUrl,
        redirectChain,
        hopCount,
        elapsedTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
}
