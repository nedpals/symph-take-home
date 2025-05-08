import { useState } from "react";
import { ShortURL } from "../../../../shared/types/url_shortener";
import { createURL } from "../../api_utils";

export default function URLShortenerResult({
  shortUrl,
  originalUrl,
  onReset,
}: {
  shortUrl: ShortURL;
  originalUrl: string;
  onReset: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const formattedShortUrl = createURL(shortUrl.slug);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedShortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto rounded-xl shadow-sm bg-white border border-gray-100 animate-fadeIn">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
              <svg className="h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-gray-800">URL Shortened Successfully</h2>
          </div>
          <button
            onClick={onReset}
            className="text-sm text-purple-600 hover:text-purple-800 transition-colors flex items-center"
          >
            <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Create another
          </button>
        </div>

        <div className="space-y-4 mt-5">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Original URL</p>
            <p className="text-gray-800 break-all">{originalUrl}</p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <p className="text-sm text-gray-500 mb-1">Shortened URL</p>
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
                className={`ml-3 px-4 py-2 rounded-md text-sm flex items-center shadow-sm transition-all ${
                  copied
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                {copied ? (
                  <>
                    <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-500 flex">
            <svg className="h-5 w-5 text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>This link will work even after you close this window</span>
          </div>
        </div>
      </div>
    </div>
  );
}
