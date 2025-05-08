import { useState, useEffect } from "react";
import { CreateShortURLParams, UTMParameters } from "../../../../shared/types/url_shortener";
import { fetchUrlMetadata } from "../../api_utils";

type FormData = CreateShortURLParams & { showAdvanced: boolean };

interface UrlMetadata {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  url?: string;
  favicon?: string;
}


// Debounce function to prevent too many API calls
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const debounce = <T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void => {
  let timeoutId: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export default function URLShortenerForm({ onSubmit, isLoading }: {
  onSubmit: (data: CreateShortURLParams) => Promise<void>;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<FormData>({
    originalUrl: "",
    slug: "",
    expiresAt: undefined,
    showAdvanced: false,
    utmParameters: {}
  });

  const [urlError, setUrlError] = useState<string>("");
  const [slugError, setSlugError] = useState<string>("");
  const [clipboardAvailable, setClipboardAvailable] = useState<boolean>(false);
  const [urlMetadata, setUrlMetadata] = useState<UrlMetadata | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(false);

  // Check if clipboard API is available
  useEffect(() => {
    setClipboardAvailable(
      navigator.clipboard && typeof navigator.clipboard.readText === 'function'
    );
  }, []);

  // Fetch URL metadata when a valid URL is entered
  const fetchMetadata = async (url: string) => {
    if (!url || !isValidUrl(url)) return;
    
    setIsLoadingMetadata(true);
    setUrlMetadata(null);
    
    try {
      const metadata = await fetchUrlMetadata(url);
      setUrlMetadata(metadata);
    } catch (error) {
      console.error("Error fetching metadata:", error);
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  // Debounced version of fetchMetadata
  const debouncedFetchMetadata = debounce(fetchMetadata, 800);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validate URL when changing original URL
    if (name === "originalUrl") {
      const isValid = validateUrl(value);
      if (isValid && value) {
        debouncedFetchMetadata(value);
      } else if (!value) {
        setUrlMetadata(null);
      }
    }
    
    // Validate slug
    if (name === "slug") {
      validateSlug(value);
    }
  };

  const validateUrl = (url: string): boolean => {
    if (!url) {
      setUrlError("");
      return false;
    }
    
    try {
      new URL(url);
      setUrlError("");
      return true;
    } catch (_) {
      setUrlError("Please enter a valid URL (e.g., https://example.com)");
      return false;
    }
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  };

  const validateSlug = (slug: string): boolean => {
    if (!slug) {
      setSlugError("");
      return true; // Empty slug is valid as it will be auto-generated
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(slug)) {
      setSlugError("Slug can only contain letters, numbers, hyphens and underscores");
      return false;
    }

    setSlugError("");
    return true;
  };

  const handleUtmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      utmParameters: {
        ...prev.utmParameters,
        [name]: value
      }
    }));
  };

  const toggleAdvanced = () => {
    setFormData(prev => ({ ...prev, showAdvanced: !prev.showAdvanced }));
  };

  const handlePasteUrl = async () => {
    if (clipboardAvailable) {
      try {
        const text = await navigator.clipboard.readText();
        if (text && validateUrl(text)) {
          setFormData(prev => ({ ...prev, originalUrl: text }));
          fetchMetadata(text); // Immediately fetch metadata without debounce for paste
        }
      } catch (err) {
        console.error("Failed to read clipboard:", err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate URL
    if (!formData.originalUrl) {
      setUrlError("URL is required");
      return;
    }

    if (!validateUrl(formData.originalUrl)) {
      return;
    }

    // Validate slug if provided
    if (formData.slug && !validateSlug(formData.slug)) {
      return;
    }

    // Filter out empty UTM parameters
    const utmParameters = Object.entries(formData.utmParameters ?? {})
      .filter(([_, value]) => value.trim().length > 0)
      .reduce((obj, [key, value]: [string, string]) => {
        obj[key as keyof UTMParameters] = value;
        return obj;
      }, {} as UTMParameters);

    // Submit form data without showAdvanced property
    const submitData = {
      originalUrl: formData.originalUrl,
      slug: formData.slug,
      expiresAt: formData.expiresAt,
      utmParameters: Object.keys(utmParameters).length > 0 ? utmParameters : undefined
    };

    await onSubmit(submitData);
  };

  // Build a preview of what the shortened URL might look like
  const baseUrl = window.location.origin;
  const previewSlug = formData.slug || "random-slug";
  const previewUrl = `${baseUrl}/${previewSlug}`;

  return (
    <div className="max-w-2xl mx-auto rounded-xl shadow-sm bg-white border border-gray-100">
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL to Shorten
            </label>
            <div className={`relative rounded-md shadow-sm ${urlError ? 'ring-2 ring-red-100' : formData.originalUrl && !urlError ? 'ring-2 ring-green-100' : ''}`}>
              <input
                type="text"
                name="originalUrl"
                value={formData.originalUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/very-long-url"
                className={`block w-full px-4 py-3 pr-16 rounded-md focus:ring focus:ring-purple-100 focus:border-purple-400 border-gray-200 transition-colors ${
                  urlError ? 'border-red-300 text-red-800 placeholder-red-300' : 
                  formData.originalUrl && !urlError ? 'border-green-300' : 'border-gray-200'
                }`}
                required
              />
              {clipboardAvailable && (
                <button
                  type="button"
                  onClick={handlePasteUrl}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-purple-600"
                  title="Paste from clipboard"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                </button>
              )}
            </div>
            {urlError && <p className="mt-2 text-sm text-red-600">{urlError}</p>}
            
            {/* URL Preview with OpenGraph data */}
            {formData.originalUrl && !urlError && (
              <div className="mt-3">
                <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Shortened URL Preview:</p>
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-800 truncate">{previewUrl}</p>
                    <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Preview</span>
                  </div>
                </div>
                
                {/* OpenGraph Preview */}
                {isLoadingMetadata ? (
                  <div className="mt-3 p-4 border border-gray-200 rounded-md flex items-center justify-center">
                    <div className="flex items-center space-x-2">
                      <svg className="animate-spin h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm text-gray-600">Loading preview...</span>
                    </div>
                  </div>
                ) : urlMetadata ? (
                  <div className="mt-3 border border-gray-200 rounded-md overflow-hidden">
                    <div className="flex flex-col sm:flex-row">
                      {urlMetadata.image && (
                        <div className="sm:w-1/3 max-h-36 sm:max-h-none overflow-hidden bg-gray-100">
                          <img 
                            src={urlMetadata.image} 
                            alt={urlMetadata.title || "Website preview"} 
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              // Hide image on error
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="p-4 sm:w-2/3">
                        {urlMetadata.favicon && (
                          <div className="flex items-center mb-2">
                            <img 
                              src={urlMetadata.favicon} 
                              alt="" 
                              className="w-4 h-4 mr-2"
                              onError={(e) => {
                                // Hide favicon on error
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <span className="text-xs text-gray-500 truncate">
                              {urlMetadata.siteName || new URL(formData.originalUrl).hostname}
                            </span>
                          </div>
                        )}
                        <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                          {urlMetadata.title || "No title available"}
                        </h3>
                        {urlMetadata.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {urlMetadata.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={toggleAdvanced}
              className="text-sm text-purple-600 hover:text-purple-800 focus:outline-none flex items-center transition-colors"
            >
              <svg 
                className={`w-4 h-4 mr-1 transition-transform duration-200 ${formData.showAdvanced ? 'rotate-90' : ''}`} 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
              {formData.showAdvanced ? 'Hide Options' : 'More Options'}
            </button>

            {formData.showAdvanced && (
              <div className="mt-4 space-y-4 p-5 bg-gray-50 rounded-lg border border-gray-100 animate-fadeIn transition-all duration-300">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    Custom Slug (Optional)
                    <span className="ml-2 group relative">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        Customize the end of your short URL
                      </span>
                    </span>
                  </label>
                  <div className={`relative rounded-md shadow-sm ${slugError ? 'ring-2 ring-red-100' : ''}`}>
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 select-none">
                      {baseUrl}/
                    </span>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      placeholder="custom-slug"
                      className={`block w-full pl-[calc(1.5rem+${baseUrl.length/3}ch)] px-3 py-2 border border-gray-200 rounded-md focus:ring focus:ring-purple-100 focus:border-purple-400 transition-colors ${
                        slugError ? 'border-red-300 text-red-600' : ''
                      }`}
                    />
                  </div>
                  {slugError && <p className="mt-1 text-xs text-red-600">{slugError}</p>}
                  {!slugError && (
                    <p className="mt-1 text-xs text-gray-500">
                      Leave empty to generate a random slug
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    Expiration (Optional)
                    <span className="ml-2 group relative">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        URL will stop working after this date
                      </span>
                    </span>
                  </label>
                  <input
                    type="datetime-local"
                    name="expiresAt"
                    value={formData.expiresAt as unknown as string || ""}
                    onChange={handleInputChange}
                    min={new Date().toISOString().slice(0, 16)}
                    className="block w-full px-4 py-2 border border-gray-200 rounded-md focus:ring focus:ring-purple-100 focus:border-purple-400 transition-colors"
                  />
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                    UTM Parameters (Optional)
                    <span className="ml-2 group relative">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        Track campaigns with these parameters
                      </span>
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mb-3">Add tracking parameters to your URL for analytics</p>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Source</label>
                        <input
                          type="text"
                          name="utm_source"
                          value={formData.utmParameters?.utm_source || ""}
                          onChange={handleUtmChange}
                          placeholder="e.g., twitter"
                          className="block w-full px-3 py-2 border border-gray-200 rounded-md focus:ring focus:ring-purple-100 focus:border-purple-400 transition-colors text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Medium</label>
                        <input
                          type="text"
                          name="utm_medium"
                          value={formData.utmParameters?.utm_medium || ""}
                          onChange={handleUtmChange}
                          placeholder="e.g., social"
                          className="block w-full px-3 py-2 border border-gray-200 rounded-md focus:ring focus:ring-purple-100 focus:border-purple-400 transition-colors text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Campaign</label>
                        <input
                          type="text"
                          name="utm_campaign"
                          value={formData.utmParameters?.utm_campaign || ""}
                          onChange={handleUtmChange}
                          placeholder="e.g., summer_sale"
                          className="block w-full px-3 py-2 border border-gray-200 rounded-md focus:ring focus:ring-purple-100 focus:border-purple-400 transition-colors text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Content</label>
                        <input
                          type="text"
                          name="utm_content"
                          value={formData.utmParameters?.utm_content || ""}
                          onChange={handleUtmChange}
                          placeholder="e.g., link_bio"
                          className="block w-full px-3 py-2 border border-gray-200 rounded-md focus:ring focus:ring-purple-100 focus:border-purple-400 transition-colors text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isLoading || !!urlError || !!slugError}
              className={`w-full bg-purple-600 text-white py-3 px-6 rounded-md shadow-sm transition-all
              ${(isLoading || !!urlError || !!slugError)
                ? 'opacity-70 cursor-not-allowed' 
                : 'hover:bg-purple-700 active:bg-purple-800 hover:shadow'
              } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 font-medium`}
            >
              {isLoading ? 
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Shortening...
                </span> 
                : 'Shorten URL'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
