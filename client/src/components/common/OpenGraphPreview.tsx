import { useEffect, useState } from "react";
import { URLMetadata } from "../../../../shared/types/url_metadata";

export default function OpenGraphPreview({ 
  metadata, 
  url, 
  isLoading = false,
  compact = false 
}: {
  metadata: URLMetadata | null;
  url: string;
  isLoading?: boolean;
  compact?: boolean;
  isLink?: boolean;
}) {
  const [cachedMetadata, setCachedMetadata] = useState<URLMetadata | null>(null);
  
  useEffect(() => {
    setCachedMetadata(metadata);
  }, [metadata]);

  if (isLoading) {
    return (
      <div className="border border-gray-100 rounded-lg p-3 flex items-center justify-center h-12">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-4 w-4 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-xs text-gray-500">Loading preview...</span>
        </div>
      </div>
    );
  }
  
  if (!cachedMetadata) return null;
  
  // Generate hostname from URL for display
  const hostname = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  })();
  
  if (compact) {
    return (
      <div className="flex items-center space-x-2 py-1">
        {cachedMetadata.favicon ? (
          <img 
            src={cachedMetadata.favicon} 
            alt="" 
            className="w-4 h-4 flex-shrink-0"
            onError={() => { 
              // Show fallback icon container when image fails to load
              setCachedMetadata((prev) => prev ? ({
                ...prev,
                favicon: '',
              }) : prev);
            }}
          />
        ) : (
          <div className="fallback-icon w-4 h-4 flex-shrink-0 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-purple-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        <span className="text-xs text-gray-500 truncate flex-grow">
          {cachedMetadata.title || hostname}
        </span>
      </div>
    );
  }

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden transition-all">
      <div className="flex">
        {cachedMetadata.image && (
          <div className="w-1/4 max-h-16 overflow-hidden bg-gray-50">
            <img 
              src={cachedMetadata.image} 
              alt={cachedMetadata.title || "Website preview"} 
              className="h-full w-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
        )}
        <div className="p-2 flex-1">
          <div className="flex items-center mb-1">
            {cachedMetadata.favicon ? (
              <img 
                src={cachedMetadata.favicon} 
                alt="" 
                className="w-3 h-3 mr-1.5"
                onError={(e) => { 
                  e.currentTarget.style.display = 'none';
                  // Show fallback icon container when image fails to load
                  const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                  if (fallback) (fallback as HTMLElement).style.display = 'flex';
                }}
              />
            ) : (
              <div className="fallback-icon w-3 h-3 mr-1.5 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-2 h-2 text-purple-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <span className="text-xs text-gray-500 truncate">
              {cachedMetadata.siteName || hostname}
            </span>
          </div>
          <h4 className="text-xs font-medium text-gray-700 line-clamp-1">
            {cachedMetadata.title || "No title available"}
          </h4>
        </div>
      </div>
    </div>
  );
}
