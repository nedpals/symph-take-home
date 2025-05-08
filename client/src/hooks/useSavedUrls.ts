import { useState, useEffect } from 'react';
import { ShortURL } from '../../../shared/types/url_shortener';

interface SavedUrl {
  shortUrl: ShortURL;
  originalUrl: string;
  savedAt: number;
}

const STORAGE_KEY = 'saved_urls';

export function useSavedUrls() {
  const [savedUrls, setSavedUrls] = useState<SavedUrl[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setSavedUrls(JSON.parse(saved));
    }
  }, []);

  const saveUrl = (shortUrl: ShortURL, originalUrl: string) => {
    const newUrl: SavedUrl = {
      shortUrl,
      originalUrl,
      savedAt: Date.now(),
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

  return { savedUrls, saveUrl, removeUrl };
}
