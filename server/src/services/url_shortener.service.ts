import { db } from "../db/knex";
import crypto from "crypto";

import { CreateShortURLParams, ShortURL } from "../../../shared/types/url_shortener"

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
   * Get a shortened URL by slug and increment its click count
   */
  async getBySlugAndTrack(slug: string): Promise<ShortURL | null> {
    // Check cache first
    if (urlCache.has(slug)) {
      const originalUrl = urlCache.get(slug);
      if (originalUrl) {
        // Update click count and last access time in background
        void db("shortened_urls")
          .where({ slug })
          .increment("clickCount", 1) 
          .update({ lastAccessedAt: new Date() }); 
        
        return {
          id: "",
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
    
    // Update click count and last access time
    await db("shortened_urls")
      .where({ slug })
      .increment("clickCount", 1) 
      .update({ lastAccessedAt: new Date() });
    
    // Add to cache
    this.addToCache(slug, shortUrl.originalURL);
    
    return shortUrl;
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
}
