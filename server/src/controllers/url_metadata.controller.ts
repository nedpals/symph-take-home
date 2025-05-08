import { Request, Response } from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

import { URLMetadata } from '@shared/types/url_metadata';

/**
 * Fetch and extract metadata from a URL including OpenGraph tags
 */
export async function getURLMetadata(req: Request, res: Response) {
  const { url } = req.query;
  
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    // Validate URL format
    const parsedUrl = new URL(url);
    
    // Fetch the URL with a timeout
    const response = await axios.get(url, { 
      timeout: 12000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; URLShortenerBot/1.0)',
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);
    
    // Extract metadata
    const metadata = {
      url: url,
      title: $('title').text() || $('meta[property="og:title"]').attr('content') || '',
      description: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '',
      image: $('meta[property="og:image"]').attr('content') || '',
      siteName: $('meta[property="og:site_name"]').attr('content') || '',
      favicon: getFaviconUrl($, parsedUrl)
    } as URLMetadata;

    return res.json(metadata);
  } catch (error) {
    console.error('Error fetching URL metadata:', error);
    return res.status(500).json({ error: 'Failed to fetch URL metadata' });
  }
}

/**
 * Extract favicon URL from HTML or construct a default one
 */
function getFaviconUrl($: cheerio.CheerioAPI, parsedUrl: URL): string {
  // Try different favicon possibilities
  const favicon = $('link[rel="icon"]').attr('href') || 
                  $('link[rel="shortcut icon"]').attr('href') || 
                  $('link[rel="apple-touch-icon"]').attr('href');
  
  if (favicon) {
    // Handle relative URLs
    if (favicon.startsWith('/')) {
      return `${parsedUrl.protocol}//${parsedUrl.host}${favicon}`;
    } else if (!favicon.startsWith('http')) {
      return `${parsedUrl.protocol}//${parsedUrl.host}/${favicon}`;
    }
    return favicon;
  }
  
  // Default to standard favicon location
  return `${parsedUrl.protocol}//${parsedUrl.host}/favicon.ico`;
}
