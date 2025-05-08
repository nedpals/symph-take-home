import { ShortURL } from '../../../../shared/types/url_shortener';

interface SavedURLsListProps {
  urls: Array<{
    shortUrl: ShortURL;
    originalUrl: string;
    savedAt: number;
  }>;
  onRemove: (id: string) => void;
}

export default function SavedURLsList({ urls, onRemove }: SavedURLsListProps) {
  if (urls.length === 0) return null;

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-lg font-medium text-gray-800">Recently Shortened URLs</h2>
      <div className="space-y-2">
        {urls.map(({ shortUrl, originalUrl }) => (
          <div
            key={shortUrl.id}
            className="group p-3 bg-white/80 rounded-lg border border-gray-200 hover:border-purple-200 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {window.location.origin}/{shortUrl.slug}
                </p>
                <p className="text-xs text-gray-500 truncate">{originalUrl}</p>
              </div>
              <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/${shortUrl.slug}`);
                  }}
                  className="text-gray-400 hover:text-purple-600 transition-colors p-1"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
                <button
                  onClick={() => onRemove(shortUrl.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors p-1"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
