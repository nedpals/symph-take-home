import { URLMetadata } from '../../hooks/useUrlMetadata';

interface OpenGraphPreviewProps {
  metadata: URLMetadata | null;
  url: string;
  isLoading?: boolean;
  compact?: boolean;
}

export default function OpenGraphPreview({ 
  metadata, 
  url, 
  isLoading = false,
  compact = false 
}: OpenGraphPreviewProps) {
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
  
  if (!metadata) return null;
  
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
        {metadata.favicon && (
          <img 
            src={metadata.favicon} 
            alt="" 
            className="w-4 h-4 flex-shrink-0"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        <span className="text-xs text-gray-500 truncate flex-grow">
          {metadata.title || hostname}
        </span>
      </div>
    );
  }

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden transition-all">
      <div className="flex">
        {metadata.image && (
          <div className="w-1/4 max-h-16 overflow-hidden bg-gray-50">
            <img 
              src={metadata.image} 
              alt={metadata.title || "Website preview"} 
              className="h-full w-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
        )}
        <div className="p-2 flex-1">
          <div className="flex items-center mb-1">
            {metadata.favicon && (
              <img 
                src={metadata.favicon} 
                alt="" 
                className="w-3 h-3 mr-1.5"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
            <span className="text-xs text-gray-500 truncate">
              {metadata.siteName || hostname}
            </span>
          </div>
          <h4 className="text-xs font-medium text-gray-700 line-clamp-1">
            {metadata.title || "No title available"}
          </h4>
        </div>
      </div>
    </div>
  );
}
