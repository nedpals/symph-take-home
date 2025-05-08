import { db } from "../db/knex";
import crypto from "crypto";
import { UAParser } from 'ua-parser-js';
import { Request } from "express";

import { CreateShortURLParams, ShortURL, URLStats, ClickAnalytics } from "../../../shared/types/url_shortener"

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
   * Create a shortened URL with optional parameters
   */
  async createShortURL(params: CreateShortURLParams): Promise<ShortURL> {
    let { originalUrl, slug, expiresAt, utmParameters } = params;
    
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
    
    return shortUrl;
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
}
