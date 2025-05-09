import { ShortURL } from "../../../../shared/types/url_shortener";
import { createURL } from "../../api_utils";
import { useUrlMetadata } from "../../hooks/useUrlMetadata";
import { cn } from "../../utils";
import { useClipboard } from '../../hooks/useClipboard';
import OpenGraphPreview from "../OpenGraphPreview";

export default function UrlShortenerResult({
  shortUrl,
  originalUrl,
  onReset,
}: {
  shortUrl: ShortURL;
  originalUrl: string;
  onReset: () => void;
}) {
  const formattedShortUrl = createURL(shortUrl.slug);
  const { copied, copyToClipboard } = useClipboard();
  const { metadata, isLoading } = useUrlMetadata(originalUrl);

  const handleCopy = () => {
    copyToClipboard(formattedShortUrl);
  };

  return (
    <div className="max-w-2xl mx-auto rounded-2xl shadow-md bg-white/95 backdrop-blur border border-purple-200 ring-2 ring-purple-100">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center mr-3">
              <svg className="h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-gray-800">URL Shortened Successfully</h2>
          </div>
          <button
            onClick={onReset}
            className={cn(
              "text-sm text-purple-600 hover:text-purple-800 transition-colors",
              "flex items-center py-2 px-3 rounded-lg",
              "hover:bg-purple-50 border border-transparent",
              "hover:border-purple-100 font-medium"
            )}
          >
            <svg className="h-4 w-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Create another
          </button>
        </div>

        <div className="space-y-4">
          {/* Original URL with OpenGraph Preview */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-500 flex items-center">
                <svg className="h-4 w-4 mr-1.5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
                </svg>
                Original URL
              </p>
              <p className="text-gray-800 break-all mt-1">{originalUrl}</p>
            </div>
            <OpenGraphPreview metadata={metadata} url={originalUrl} isLoading={isLoading} />
          </div>

          {/* Shortened URL */}
          <div className="bg-purple-50 rounded-lg border border-purple-100 p-4">
            <p className="text-sm font-medium text-gray-600 mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-purple-600" viewBox="0 0 24 24">
                <path fill="currentColor" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1M8 13h8v-2H8zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5"></path>
              </svg>
              Shortened URL
            </p>
            <div className="flex items-center">
              <a
                href={formattedShortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-700 hover:text-purple-900 font-medium truncate flex-grow"
              >
                {formattedShortUrl}
              </a>
              <button
                onClick={handleCopy}
                className={cn(
                  "ml-3 px-4 py-2 rounded-lg text-sm flex items-center shadow-sm transition-all",
                  "border font-medium",
                  copied
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-white text-gray-700 hover:text-purple-700 border-gray-200 hover:border-purple-200 hover:bg-purple-50"
                )}
              >
                {copied ? (
                  <>
                    <svg className="h-4 w-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex bg-blue-50 p-4 rounded-lg border border-blue-100">
            <svg className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-blue-700">This link will work even after you close this window</p>
          </div>
        </div>
      </div>
    </div>
  );
}
