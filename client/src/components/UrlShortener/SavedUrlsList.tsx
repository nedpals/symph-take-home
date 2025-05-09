import { useState } from 'react';
import { ShortURL, URLStats } from '../../../../shared/types/url_shortener';
import { apiEndpointURL, createURL } from '../../api_utils';
import { URLMetadata } from '../../../../shared/types/url_metadata';
import { useClipboard } from '../../hooks/useClipboard';
import AnalyticsModal from './AnalyticsModal';
import OpenGraphPreview from '../OpenGraphPreview';
import Tooltip from '../common/Tooltip';

const timeAgo = (timestamp: number): string => {
  const now = new Date();
  const savedDate = new Date(timestamp);
  const seconds = Math.round((now.getTime() - savedDate.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return `${seconds} sec ago`;
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  if (days < 7) return `${days} day(s) ago`;
  return savedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function SavedUrlsList({ 
  urls, 
  onRemove,
}: {
  urls: {
    shortUrl: ShortURL;
    originalUrl: string;
    savedAt: number;
    metadata?: URLMetadata;
  }[];
  onRemove: (id: string) => void;
  isLoadingMetadata?: Record<string, boolean>;
}) {
  const { copyToClipboard } = useClipboard();
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<URLStats | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

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

  if (urls.length === 0) {
    return (
      <div className="mt-8">
        <div className="rounded-2xl border border-purple-100 p-8 text-center">
          <div className="inline-block p-3 bg-purple-50 mb-4">
            <svg className="w-6 h-6 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No shortened URLs yet</h3>
          <p className="text-gray-500 text-sm">Your shortened URLs will appear here once you create them.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-medium text-gray-800 flex items-center mb-4">
        <svg className="w-5 h-5 mr-2 text-purple-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
        Recently shortened URLs in your device
      </h2>

      <div className="space-y-4">
        {urls.map(({ shortUrl, originalUrl, metadata }) => (
          <div
            key={shortUrl.id}
            className="group rounded-xl border border-gray-200/80 shadow-md bg-white/90 hover:bg-white/95 hover:border-purple-200 hover:shadow transition-all duration-200"
          >
            <div className="relative p-3 sm:p-4">
              <div className="flex items-start justify-between gap-3">
                {/* URL Info and Preview Section */}
                <div className="min-w-0 flex-1">
                  <a 
                    href={createURL(shortUrl.slug)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group/link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-sm font-medium text-gray-900 group-hover/link:text-purple-700 transition-colors flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                      </svg>
                      <span className="truncate">{createURL(shortUrl.slug)}</span>
                      <svg className="w-3.5 h-3.5 text-gray-400 group-hover/link:text-purple-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                      </svg>
                    </p>
                  </a>

                  <div className="mt-2 space-y-2">
                    <OpenGraphPreview 
                      url={originalUrl}
                      initialMetadata={metadata}
                    />
                  </div>

                  <p className="mt-4 text-xs text-gray-600">
                    Saved {timeAgo((shortUrl.createdAt instanceof Date ? shortUrl.createdAt : new Date(shortUrl.createdAt)).getTime())}
                  </p>
                </div>

                {/* Action Buttons */}
                <div 
                  className="flex items-center gap-1 self-start -mr-1" 
                  onClick={e => e.stopPropagation()}
                >
                  <Tooltip content="Copy to clipboard">
                    <button
                      onClick={() => copyToClipboard(createURL(shortUrl.slug))}
                      className="text-gray-400 hover:text-purple-600 transition-colors p-2 hover:bg-purple-50 rounded-lg"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2m-7 0a1 1 0 0 1 1 1a1 1 0 0 1-1 1a1 1 0 0 1-1-1a1 1 0 0 1 1-1M7 7h10V5h2v14H5V5h2z"></path>
                      </svg>
                    </button>
                  </Tooltip>
                  <Tooltip content="View analytics">
                    <button
                      onClick={() => handleShowAnalytics(shortUrl.slug)}
                      className="text-gray-400 hover:text-purple-600 transition-colors p-2 hover:bg-purple-50 rounded-lg"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                        <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 10.105A1.105 1.105 0 0 1 11.105 9h1.79A1.105 1.105 0 0 1 14 10.105v9.79A1.105 1.105 0 0 1 12.895 21h-1.79A1.105 1.105 0 0 1 10 19.895zm7-6A1.105 1.105 0 0 1 18.105 3h1.79A1.105 1.105 0 0 1 21 4.105v15.79A1.105 1.105 0 0 1 19.895 21h-1.79A1.105 1.105 0 0 1 17 19.895zM3 19a2 2 0 1 0 4 0a2 2 0 1 0-4 0"></path>
                      </svg>
                    </button>
                  </Tooltip>
                  <Tooltip content="Delete URL">
                    <button
                      onClick={() => onRemove(shortUrl.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </Tooltip>
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
