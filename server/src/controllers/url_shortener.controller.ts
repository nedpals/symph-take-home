import { Request, Response } from "express";
import { CreateShortURLParams } from "@shared/types/url_shortener";
import { URLShortenerService } from "@app/services/url_shortener.service";
import { respondError } from "@app/utils";

const urlService = new URLShortenerService();

/**
 * Create a shortened URL
 */
export async function createShortURL(req: Request, res: Response) {
  try {
    const { originalUrl, slug, expiresAt, utmParameters } = req.body as CreateShortURLParams;
    // Validate the URL
    if (!originalUrl) {
      return respondError(res, "Original URL is required");
    }
    
    // Check if the URL is valid
    try {
      new URL(originalUrl); 
    } catch (err) {
      return respondError(res, "Invalid URL format");
    }
    
    // Create the short URL
    const shortUrl = await urlService.createShortURL({
      originalUrl,
      slug,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      utmParameters
    });
    
    // Return the created short URL
    return res.status(201).json({ shortUrl });
  } catch (error: any) {
    if (error instanceof Error && error.message === "Custom slug already exists") {
      return respondError(res, error, 409);
    }
    
    console.error("Error creating short URL:", error);
    return respondError(res, "Failed to create shortened URL", 500);
  }
}

/**
 * Redirect to the original URL
 */
export async function redirectToURL(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    
    if (!slug) {
      return respondError(res, "Slug is required");
    }
    
    const shortUrl = await urlService.getBySlugAndTrack(slug);
    if (!shortUrl) {
      return respondError(res, "URL not found or has expired", 404);
    }
    
    // Redirect to the original URL
    return res.redirect(shortUrl.originalURL);
  } catch (error) {
    console.error("Error redirecting to URL:", error);
    return respondError(res, "Failed to redirect to URL", 500);
  }
}

/**
 * Get statistics for a shortened URL
 */
export async function getURLStats(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    if (!slug) {
      return respondError(res, "Slug is required");
    }
    
    const stats = await urlService.getStats(slug);
    if (!stats) {
      return respondError(res, "URL not found or has expired", 404);
    }
    
    return res.json({ stats });
  } catch (error) {
    console.error("Error getting URL stats:", error);
    return respondError(res, "Failed to get URL stats", 500);
  }
}
