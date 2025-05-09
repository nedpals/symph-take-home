import { useState, useEffect } from 'react';
import { fetchUrlMetadata } from '../api_utils';

export interface URLMetadata {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  url?: string;
  favicon?: string;
}

const METADATA_CACHE_KEY = 'url_metadata_cache';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

// Load cached metadata
const loadCachedMetadata = (): Record<string, { data: URLMetadata; timestamp: number }> => {
  try {
    const cached = localStorage.getItem(METADATA_CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (err) {
    console.error('Error loading cached metadata:', err);
    return {};
  }
};

// Save metadata to cache
const saveMetadataToCache = (url: string, data: URLMetadata) => {
  try {
    const cache = loadCachedMetadata();
    const newCache = {
      ...cache,
      [url]: {
        data,
        timestamp: Date.now()
      }
    };

    // Clean expired entries
    Object.entries(newCache).forEach(([key, entry]) => {
      if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
        delete newCache[key];
      }
    });

    localStorage.setItem(METADATA_CACHE_KEY, JSON.stringify(newCache));
  } catch (err) {
    console.error('Error saving metadata to cache:', err);
  }
};

export function useUrlMetadata(url: string) {
  const [metadata, setMetadata] = useState<URLMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!url) return;
    
    const fetchMetadata = async () => {
      // Check cache first
      const cache = loadCachedMetadata();
      if (cache[url] && Date.now() - cache[url].timestamp < CACHE_EXPIRY) {
        setMetadata(cache[url].data);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchUrlMetadata(url);
        setMetadata(data);
        saveMetadataToCache(url, data);
      } catch (err) {
        console.error("Error fetching metadata:", err);
        setError(err instanceof Error ? err : new Error('Failed to fetch metadata'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [url]);

  return { metadata, isLoading, error };
}
