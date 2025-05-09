import { useState } from "react";
import UrlShortenerForm from "../components/UrlShortener/UrlShortenerForm";
import UrlShortenerResult from "../components/UrlShortener/UrlShortenerResult";
import SavedUrlsList from "../components/UrlShortener/SavedUrlsList";
import { useSavedUrls } from "../hooks/useSavedUrls";

import { CreateShortURLParams, ErrorResponse, ShortenURLResponse, ShortURL } from "../../../shared/types/url_shortener";
import { apiEndpointURL } from "../api_utils";

interface ShortURLData {
  shortUrl: ShortURL;
  originalUrl: string;
}

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shortUrlData, setShortUrlData] = useState<ShortURLData | null>(null);
  const { savedUrls, saveUrl, removeUrl } = useSavedUrls();

  const createShortUrl = async (formData: CreateShortURLParams) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(apiEndpointURL("/urls/shorten"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || "Failed to shorten URL");
      }
      
      const data = await response.json() as ShortenURLResponse;
      if (!data.shortURL) {
        throw new Error("Failed to shorten URL");
      }

      const urlData = {
        shortUrl: data.shortURL,
        originalUrl: data.unwrappedURL?.unwrappedURL || formData.originalUrl,
      };
      
      setShortUrlData(urlData);
      saveUrl(data.shortURL, formData.originalUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      console.error("Error shortening URL:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setShortUrlData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-indigo-600 mb-8">
          symph.ly
        </h2>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            Transform Your Long URLs
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Create memorable, short links in seconds. Perfect for social media, emails, and anywhere you need concise URLs.
          </p>
        </div>
        
        {error && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-red-50 border border-red-100 text-red-800 rounded-xl flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p>{error}</p>
          </div>
        )}
        
        <div className="transition-all duration-300 ease-in-out">
          {shortUrlData ? (
            <UrlShortenerResult
              shortUrl={shortUrlData.shortUrl}
              originalUrl={shortUrlData.originalUrl}
              onReset={resetForm}
            />
          ) : (
            <UrlShortenerForm onSubmit={createShortUrl} isLoading={isLoading} />
          )}
        </div>

        <SavedUrlsList urls={savedUrls} onRemove={removeUrl} />
      </div>
    </div>
  );
}
