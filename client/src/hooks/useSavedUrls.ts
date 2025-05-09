import { useState, useEffect } from 'react';
import { ShortURL } from '../../../shared/types/url_shortener';
import { URLMetadata } from '../../../shared/types/url_metadata';
import { fetchUrlMetadata } from '../api_utils';

interface SavedUrl {
  shortUrl: ShortURL;
  originalUrl: string;
  savedAt: number;
  metadata?: URLMetadata;
}

const STORAGE_KEY = 'saved_urls';

export function useSavedUrls() {
  const [savedUrls, setSavedUrls] = useState<SavedUrl[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setSavedUrls(JSON.parse(saved));
    }
  }, []);
  
  // Function to fetch missing metadata
  useEffect(() => {
    const fetchMissingMetadata = async () => {
      const updatedUrls = [...savedUrls];
      let hasUpdates = false;
      
      for (let i = 0; i < updatedUrls.length; i++) {
        const url = updatedUrls[i];
        
        if (!url.metadata && !isLoadingMetadata[url.shortUrl.id]) {
          setIsLoadingMetadata(prev => ({ ...prev, [url.shortUrl.id]: true }));
          
          try {
            const metadata = await fetchUrlMetadata(url.originalUrl);
            updatedUrls[i] = { ...url, metadata };
            hasUpdates = true;
          } catch (error) {
            console.error(`Failed to fetch metadata for ${url.originalUrl}:`, error);
          } finally {
            setIsLoadingMetadata(prev => ({ ...prev, [url.shortUrl.id]: false }));
          }
        }
      }
      
      if (hasUpdates) {
        setSavedUrls(updatedUrls);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUrls));
      }
    };
    
    fetchMissingMetadata();
  }, [savedUrls, isLoadingMetadata]);

  const saveUrl = (shortUrl: ShortURL, originalUrl: string, metadata?: URLMetadata) => {
    const newUrl: SavedUrl = {
      shortUrl,
      originalUrl,
      savedAt: Date.now(),
      metadata
    };

    const updatedUrls = [newUrl, ...savedUrls].slice(0, 10); // Keep only last 10 URLs
    setSavedUrls(updatedUrls);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUrls));
  };

  const removeUrl = (id: string) => {
    const updatedUrls = savedUrls.filter(url => url.shortUrl.id !== id);
    setSavedUrls(updatedUrls);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUrls));
  };

  return { 
    savedUrls, 
    saveUrl, 
    removeUrl,
    isLoadingMetadata 
  };
}
