import { useState, useEffect, useMemo } from "react";
import { CreateShortURLParams, UTMParameters } from "../../../../shared/types/url_shortener";
import { BACKEND_URL, createURL, isValidUrl } from "../../api_utils";
import { useUrlMetadata } from '../../hooks/useUrlMetadata';
import UtmParametersModal from './UtmParametersModal';
import PopupContainer from '../PopupContainer';
import ExpirationPopup, { EXPIRATION_OPTIONS } from './ExpirationPopup';
import { cn } from "../../utils";

const formatCustomDate = (date: string) => {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(d);
};

const formatDurationOrDate = (durationMs?: number, date?: Date | string) => {
  if (durationMs) {
    const selectedOption = EXPIRATION_OPTIONS.find(opt => opt.duration === durationMs);
    if (selectedOption) return selectedOption.label;
    
    const days = Math.floor(durationMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((durationMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    return parts.join(' ');
  }
  
  if (date) {
    const expireDate = new Date(date);
    const now = Date.now();
    const diff = expireDate.getTime() - now;

    // Otherwise show remaining time
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 && days === 0) parts.push(`${minutes}m`);
    return parts.join(' ') + ' remaining';
  }

  return 'Expiration';
};

type PopupType = 'slug' | 'expiration' | 'utm' | null;

export default function UrlShortenerForm({ onSubmit, isLoading }: {
  onSubmit: (data: CreateShortURLParams) => Promise<void>;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<CreateShortURLParams & { expireDurationMs?: number }>({
    originalUrl: "",
    slug: "",
    expiresAt: undefined,
    utmParameters: {},
    expireDurationMs: undefined
  });

  const [urlError, setUrlError] = useState<string>("");
  const [slugError, setSlugError] = useState<string>("");
  const [clipboardAvailable, setClipboardAvailable] = useState<boolean>(false);
  
  const { metadata: urlMetadata, isLoading: isLoadingMetadata } = useUrlMetadata(
    isValidUrl(formData.originalUrl) ? formData.originalUrl : '',
    800 // debounce delay
  );

  const [currentPopup, setCurrentPopup] = useState<PopupType>(null);
  const [customExpirationDate, setCustomExpirationDate] = useState<string>("");

  // Check if clipboard API is available
  useEffect(() => {
    setClipboardAvailable(
      navigator.clipboard && typeof navigator.clipboard.readText === 'function'
    );
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear URL error when typing in URL field
    if (name === "originalUrl") {
      setUrlError("");
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

  const handlePasteUrl = async () => {
    if (clipboardAvailable) {
      try {
        const text = await navigator.clipboard.readText();
        if (text && validateUrl(text)) {
          setFormData(prev => ({ ...prev, originalUrl: text }));
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

    // Calculate expiresAt from either duration or custom date
    const expiresAt = formData.expireDurationMs
      ? new Date(Date.now() + formData.expireDurationMs)
      : formData.expiresAt
        ? new Date(formData.expiresAt)
        : undefined;

    // Submit form data without showAdvanced property
    const submitData = {
      originalUrl: formData.originalUrl,
      slug: formData.slug,
      expiresAt,
      utmParameters: Object.keys(utmParameters).length > 0 ? utmParameters : undefined
    };

    await onSubmit(submitData);
  };

  const formState = useMemo(() => {
    if (isLoading) return 'loading';
    if (urlError) return 'error';
    if (slugError) return 'error';
    if (!formData.originalUrl) return 'empty';
    if (formData.originalUrl && isValidUrl(formData.originalUrl) && !urlError) return 'valid';
    return 'empty';
  }, [formData.originalUrl, urlError, slugError, isLoading]) as 'empty' | 'error' | 'valid' | 'loading';

  // Build a preview of what the shortened URL might look like
  const previewUrl = createURL(formData.slug || "random-slug");

  return (
    <div className={cn(
      "max-w-2xl mx-auto rounded-2xl shadow-md bg-white/95 backdrop-blur",
      "border transition-all duration-200",
      {
        'border-red-200 ring-2 ring-red-100': formState === 'error',
        'border-purple-200 ring-2 ring-purple-100': formState === 'valid',
        'border-purple-100/20': formState === 'empty' || formState === 'loading'
      }
    )}>
      <form onSubmit={handleSubmit}>
        {/* URL Input Section */}
        <div className="relative rounded-t-lg pb-2">
          <label className="block text-xs font-medium text-gray-800 ml-4 mt-4">
            URL to Shorten
          </label>
          <div className="flex items-center relative">
            <input
              type="text"
              name="originalUrl"
              value={formData.originalUrl}
              onChange={handleInputChange}
              placeholder="https://example.com/very-long-url"
              className={cn(
                "block w-full px-4 py-3 bg-white/50",
                "transition-all duration-200 ring-0 focus:ring-0 focus:ring-transparent focus:ring-offset-0 focus:outline-0 focus:outline-none",
              )}
              required
            />
            {clipboardAvailable && (
              <button
                type="button"
                onClick={handlePasteUrl}
                className={cn(
                  "absolute right-4 top-1/2 -translate-y-1/2",
                  "bg-gray-50 text-gray-700 px-2.5 py-1.5 rounded-lg shadow-sm",
                  "border border-gray-200 transition-all duration-200",
                  "hover:bg-gray-100 hover:border-gray-300 hover:shadow-md",
                  "focus:outline-none focus:ring-2 focus:ring-purple-500/20",
                  "flex items-center gap-2 text-sm font-medium"
                )}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
                Paste URL
              </button>
            )}
          </div>
          {urlError && (
            <div className="bg-red-50 py-2 px-4 mt-2 mb-1 flex items-start">
              <svg className="h-5 w-5 text-red-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="ml-2 text-sm text-red-600">{urlError}</p>
            </div>
          )}
        </div>

        {/* Options Bar with Submit Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-3">
          {/* Left side - Customize buttons */}
          <div className="w-full lg:w-auto flex items-center gap-2">
            {/* Slug Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setCurrentPopup(currentPopup === 'slug' ? null : 'slug')}
                className={cn(
                  "px-2 py-1 text-sm rounded transition-all duration-200", 
                  "flex items-center",
                  formData.slug
                    ? 'bg-purple-50 text-purple-700 shadow-sm'
                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                )}
              >
                <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
                Custom Slug
              </button>

              {/* Slug Popup */}
              <PopupContainer
                isOpen={currentPopup === 'slug'}
                onClose={() => setCurrentPopup(null)}
                title="Custom Slug"
              >
                <div className={cn("relative rounded-lg", {'ring-2 ring-red-100': slugError})}>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    placeholder="custom-slug"
                    className={cn(
                      `block w-full pl-[calc(1.5rem+${BACKEND_URL.length/3}ch)] px-4 py-2.5`,
                      "bg-white/50 border rounded-lg transition-all duration-200",
                      "focus:ring-2 focus:ring-purple-100 focus:border-purple-300",
                      slugError ? 'border-red-200 text-red-600' : 'border-gray-200 hover:border-gray-300'
                    )}
                  />
                </div>
                {slugError && (
                  <div className="mt-2 flex items-start">
                    <svg className="h-4 w-4 text-red-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="ml-2 text-xs text-red-600">{slugError}</p>
                  </div>
                )}
                {!slugError && (
                  <p className="mt-2 text-xs text-gray-500">
                    Leave empty to generate a random slug
                  </p>
                )}
              </PopupContainer>
            </div>

            {/* Expiration Button and Popup */}
            <ExpirationPopup
              isOpen={currentPopup === 'expiration'}
              onClose={() => setCurrentPopup(null)}
              hasExpiration={Boolean(formData.expireDurationMs || formData.expiresAt)}
              customDate={customExpirationDate}
              onOptionSelect={(duration) => {
                if (duration) {
                  setFormData(prev => ({ 
                    ...prev, 
                    expireDurationMs: duration,
                    expiresAt: undefined
                  }));
                  setCustomExpirationDate("");
                }
              }}
              onCustomDateSelect={(value) => {
                setCustomExpirationDate(value);
                setFormData(prev => ({ 
                  ...prev,
                  expireDurationMs: undefined,
                  expiresAt: new Date(value) 
                }));
              }}
              onRemove={() => {
                setFormData(prev => ({ 
                  ...prev, 
                  expireDurationMs: undefined,
                  expiresAt: undefined 
                }));
                setCustomExpirationDate("");
              }}
              render={({ hasExpiration }) => (
                <button
                  type="button"
                  onClick={() => setCurrentPopup(currentPopup === 'expiration' ? null : 'expiration')}
                  className={cn(
                    "px-2 py-1 text-sm rounded transition-all duration-200",
                    "flex items-center",
                    hasExpiration
                      ? 'bg-purple-50 text-purple-700 shadow-sm'
                      : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                  )}
                >
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span className="truncate">
                    {customExpirationDate ? formatCustomDate(customExpirationDate) : formatDurationOrDate(formData.expireDurationMs, formData.expiresAt)}
                  </span>
                </button>
              )}
            />

            {/* UTM Parameters Button */}
            <button
              type="button"
              onClick={() => setCurrentPopup('utm')}
              className={cn(
                "px-2 py-1 text-sm rounded transition-all duration-200",
                "flex items-center",
                Object.values(formData.utmParameters || {}).some(v => v)
                  ? 'bg-purple-50 text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
              )}
            >
              <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" />
                <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
              </svg>
              UTM Parameters
            </button>
          </div>

          {/* Right side - Submit button */}
          <button
            type="submit"
            disabled={formState === 'loading' || formState === 'error' || formState === 'empty'}
            className={cn(
              "w-full lg:w-auto",
              "bg-purple-600 text-white py-2 px-6 rounded-lg shadow-sm",
              "shadow-purple-200/50 transition-all duration-200 whitespace-nowrap flex-shrink-0",
              "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 font-medium",
              formState === 'valid' 
                ? 'hover:bg-purple-700 active:bg-purple-800 hover:shadow-md hover:shadow-purple-200/50'
                : 'opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400 shadow-none'
            )}
          >
            {formState === 'loading' ? 
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Shortening...
              </span> 
              : 'Shorten'
            }
          </button>
        </div>

        {/* Previews Section */}
        {formState === 'valid' && (
          <div className="border-t border-gray-100 p-4 space-y-4">
            {/* Shortened URL Preview - only show when custom slug is set */}
            {formData.slug && (
              <div className="p-4 bg-white border border-gray-200 rounded-lg overflow-hidden">
                <p className="text-xs font-medium text-gray-500 mb-2">Shortened URL Preview</p>
                <div className="flex items-center">
                  <p className="text-sm font-medium text-gray-800 truncate">{previewUrl}</p>
                  <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">Preview</span>
                </div>
              </div>
            )}

            {/* OpenGraph Preview */}
            {isLoadingMetadata ? (
              <div className="p-4 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                <div className="flex items-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm text-gray-600">Loading preview...</span>
                </div>
              </div>
            ) : urlMetadata ? (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
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
      </form>

      {/* UTM Parameters Modal */}
      <UtmParametersModal
        isOpen={currentPopup === 'utm'}
        onClose={() => setCurrentPopup(null)}
        utmParameters={formData.utmParameters ?? {}}
        onChange={(params) => setFormData(prev => ({ ...prev, utmParameters: params }))}
      />
    </div>
  );
}
