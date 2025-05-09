import { useState } from 'react';
import { ShortURL, URLStats } from '../../../../shared/types/url_shortener';
import AnalyticsModal from './AnalyticsModal';
import { apiEndpointURL, createURL } from '../../api_utils';
import OpenGraphPreview from '../common/OpenGraphPreview';
import { URLMetadata } from '../../hooks/useUrlMetadata';

interface SavedURLsListProps {
  urls: Array<{
    shortUrl: ShortURL;
    originalUrl: string;
    savedAt: number;
    metadata?: URLMetadata;
  }>;
  onRemove: (id: string) => void;
  isLoadingMetadata?: Record<string, boolean>;
}

export default function SavedUrlsList({ 
  urls, 
  onRemove,
  isLoadingMetadata = {}
}: SavedURLsListProps) {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<URLStats | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const handleShowAnalytics = async (slug: string) => {
    setSelectedUrl(slug);
    setIsLoadingAnalytics(true);
    
    try {
      const response = await fetch(apiEndpointURL(`/urls/${slug}/stats`));
      const data = await response.json();
      setAnalytics(data.stats);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setAnalytics(null);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (urls.length === 0) return null;

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-lg font-medium text-gray-800 flex items-center">
        <svg className="w-5 h-5 mr-2 text-purple-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
        Recently Shortened URLs
      </h2>
      <div className="space-y-2 rounded-xl overflow-hidden border border-gray-200/80 divide-y divide-gray-100">
        {urls.map(({ shortUrl, originalUrl, metadata }) => (
          <div
            key={shortUrl.id}
            className="group bg-white/90 hover:bg-purple-50/80 transition-colors duration-200"
          >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-900 truncate flex items-center">
                      <svg className="w-3 h-3 mr-1.5 text-purple-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                      </svg>
                      {createURL(shortUrl.slug)}
                    </p>
                    
                    {/* Compact preview in non-expanded mode */}
                    {!expandedItems[shortUrl.id] && (
                      <button 
                        onClick={() => toggleExpanded(shortUrl.id)}
                        className="ml-2 text-xs text-purple-500 hover:text-purple-700"
                      >
                        Show more
                      </button>
                    )}
                  </div>
                  
                  <div className="mt-1.5">
                    {expandedItems[shortUrl.id] ? (
                      <div className="animate-fadeIn space-y-2">
                        <p className="text-xs text-gray-500">{originalUrl}</p>
                        {/* Full preview in expanded mode */}
                        <OpenGraphPreview 
                          metadata={metadata || null} 
                          url={originalUrl} 
                          isLoading={isLoadingMetadata[shortUrl.id]}
                        />
                        <div className="flex justify-end">
                          <button 
                            onClick={() => toggleExpanded(shortUrl.id)}
                            className="text-xs text-purple-500 hover:text-purple-700 mt-1"
                          >
                            Show less
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <OpenGraphPreview 
                          metadata={metadata || null} 
                          url={originalUrl} 
                          isLoading={isLoadingMetadata[shortUrl.id]} 
                          compact={true}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0 flex items-center space-x-1">
                  <button
                    onClick={() => handleShowAnalytics(shortUrl.slug)}
                    className="text-gray-400 hover:text-purple-600 transition-colors p-2 hover:bg-white rounded-lg"
                    title="View analytics"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createURL(shortUrl.slug));
                    }}
                    className="text-gray-400 hover:text-purple-600 transition-colors p-2 hover:bg-white rounded-lg"
                    title="Copy to clipboard"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onRemove(shortUrl.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors p-2 hover:bg-white rounded-lg"
                    title="Delete"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnalyticsModal
        isOpen={selectedUrl !== null}
        onClose={() => setSelectedUrl(null)}
        stats={analytics}
        isLoading={isLoadingAnalytics}
      />
    </div>
  );
}
