import { useState, useEffect, useRef } from "react";
import { CreateShortURLParams, UTMParameters } from "../../../../shared/types/url_shortener";
import { BACKEND_URL, createURL, isValidUrl } from "../../api_utils";
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { useUrlMetadata } from '../../hooks/useUrlMetadata';
import UtmParametersModal from './UtmParametersModal';
import PopupContainer from '../PopupContainer';
import ExpirationModal from "./ExpirationModal";

const EXPIRATION_OPTIONS = [
  { label: '1 hour', duration: 1 * 60 * 60 * 1000 }, // 1 hour
  { label: '24 hours', duration: 24 * 60 * 60 * 1000 }, // 1 day
  { label: '7 days', duration: 7 * 24 * 60 * 60 * 1000 }, // 7 days
  { label: '30 days', duration: 30 * 24 * 60 * 60 * 1000 }, // 30 days
  { label: 'Custom date', duration: null },
] as const;

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
  
  // Replace urlMetadata and isLoadingMetadata with hook
  const { metadata: urlMetadata, isLoading: isLoadingMetadata } = useUrlMetadata(
    isValidUrl(formData.originalUrl) ? formData.originalUrl : '',
    800 // debounce delay
  );

  // Add new state for popups and modal
  const [showSlugPopup, setShowSlugPopup] = useState(false);
  const [showExpirationPopup, setShowExpirationPopup] = useState(false);
  const [showUTMModal, setShowUTMModal] = useState(false);
  const [showExpirationModal, setShowExpirationModal] = useState(false);

  // Refs for popup containers
  const slugPopupRef = useRef<HTMLDivElement>(null);
  const expirationPopupRef = useRef<HTMLDivElement>(null);

  // Add new state for custom expiration date
  const [customExpirationDate, setCustomExpirationDate] = useState<string>("");

  // Close popups when clicking outside
  useOnClickOutside(slugPopupRef, () => setShowSlugPopup(false));
  useOnClickOutside(expirationPopupRef, () => setShowExpirationPopup(false));

  // Check if clipboard API is available
  useEffect(() => {
    setClipboardAvailable(
      navigator.clipboard && typeof navigator.clipboard.readText === 'function'
    );
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

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

  // Build a preview of what the shortened URL might look like
  const previewSlug = formData.slug || "random-slug";
  const previewUrl = createURL(previewSlug);

  return (
    <div className="max-w-2xl mx-auto rounded-2xl shadow-sm bg-white/95 backdrop-blur border border-purple-100/20">
      <div className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* URL Input and Preview Section */}
          <div>
            <label className="block text-base font-medium text-gray-800 mb-2">
              URL to Shorten
            </label>
            <div className={`relative rounded-lg ${
              urlError ? 'ring-2 ring-red-100' : 
              formData.originalUrl && !urlError ? 'ring-2 ring-purple-100' : ''
            }`}>
              <input
                type="text"
                name="originalUrl"
                value={formData.originalUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/very-long-url"
                className={`block w-full px-4 py-3 pr-16 rounded-lg bg-white/50 
                  focus:ring-2 focus:ring-purple-100 focus:border-purple-300 
                  border transition-all duration-200 ${
                    urlError ? 'border-red-200 text-red-800 placeholder-red-200' : 
                    formData.originalUrl && !urlError ? 'border-purple-200' : 'border-gray-200 hover:border-gray-300'
                  }`}
                required
              />
              {clipboardAvailable && (
                <button
                  type="button"
                  onClick={handlePasteUrl}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 
                    hover:text-purple-600 transition-colors group"
                  title="Paste from clipboard"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                  <span className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs bg-gray-800 text-white 
                    rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Paste from clipboard
                  </span>
                </button>
              )}
            </div>
            {urlError && <p className="mt-2 text-sm text-red-600">{urlError}</p>}

            {/* URL Preview */}
            {formData.originalUrl && !urlError && (
              <div className="mt-3">
                <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Shortened URL Preview:</p>
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-800 truncate">{previewUrl}</p>
                    <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Preview</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Options Bar with Submit Button */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left side - Customize buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Slug Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSlugPopup(!showSlugPopup)}
                  className={`px-4 py-2.5 text-sm rounded-lg border transition-all duration-200 
                    flex items-center ${
                    formData.slug
                      ? 'border-purple-300 bg-purple-50 text-purple-700 shadow-sm'
                      : 'border-gray-200 hover:border-purple-200 text-gray-600 hover:text-purple-600'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                  </svg>
                  Custom Slug
                </button>

                {/* Slug Popup */}
                <PopupContainer
                  isOpen={showSlugPopup}
                  onClose={() => setShowSlugPopup(false)}
                  title="Custom Slug"
                  popupRef={slugPopupRef}
                >
                  <div className={`relative rounded-lg ${slugError ? 'ring-2 ring-red-100' : ''}`}>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      placeholder="custom-slug"
                      className={`block w-full pl-[calc(1.5rem+${BACKEND_URL.length/3}ch)] px-4 py-2.5 
                        bg-white/50 border rounded-lg transition-all duration-200
                        focus:ring-2 focus:ring-purple-100 focus:border-purple-300 
                        ${slugError ? 'border-red-200 text-red-600' : 'border-gray-200 hover:border-gray-300'}`}
                    />
                  </div>
                  {slugError && <p className="mt-2 text-xs text-red-600">{slugError}</p>}
                  {!slugError && (
                    <p className="mt-2 text-xs text-gray-500">
                      Leave empty to generate a random slug
                    </p>
                  )}
                </PopupContainer>
              </div>

              {/* Expiration Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowExpirationPopup(!showExpirationPopup)}
                  className={`px-4 py-2.5 text-sm rounded-lg border transition-all duration-200
                    flex items-center ${
                    formData.expireDurationMs || formData.expiresAt
                      ? 'border-purple-300 bg-purple-50 text-purple-700 shadow-sm'
                      : 'border-gray-200 hover:border-purple-200 text-gray-600 hover:text-purple-600'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span className="truncate">
                    {customExpirationDate ? formatCustomDate(customExpirationDate) : formatDurationOrDate(formData.expireDurationMs, formData.expiresAt)}
                  </span>
                </button>

                {/* Expiration Popup */}
                <PopupContainer
                  isOpen={showExpirationPopup}
                  onClose={() => setShowExpirationPopup(false)}
                  title="Expiration Time"
                  popupRef={expirationPopupRef}
                >
                  <div className="space-y-2">
                    {EXPIRATION_OPTIONS.map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => {
                          if (option.duration) {
                            setFormData(prev => ({ 
                              ...prev, 
                              expireDurationMs: option.duration,
                              expiresAt: undefined
                            }));
                            setCustomExpirationDate("");
                            setShowExpirationPopup(false);
                          } else {
                            setShowExpirationModal(true);
                          }
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm rounded-lg 
                          hover:bg-purple-50 hover:text-purple-700 transition-colors
                          flex items-center space-x-2"
                      >
                        <span>{option.label}</span>
                        {option.duration === null && (
                          <svg className="w-3.5 h-3.5 ml-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                    {(formData.expireDurationMs || formData.expiresAt) && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ 
                            ...prev, 
                            expireDurationMs: undefined,
                            expiresAt: undefined 
                          }));
                          setShowExpirationPopup(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm rounded-lg 
                          text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Remove Expiration
                      </button>
                    )}
                  </div>
                </PopupContainer>
              </div>

              {/* UTM Parameters Button */}
              <button
                type="button"
                onClick={() => setShowUTMModal(true)}
                className={`px-4 py-2.5 text-sm rounded-lg border transition-all duration-200
                  flex items-center ${
                  Object.values(formData.utmParameters || {}).some(v => v)
                    ? 'border-purple-300 bg-purple-50 text-purple-700 shadow-sm'
                    : 'border-gray-200 hover:border-purple-200 text-gray-600 hover:text-purple-600'
                }`}
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
              disabled={isLoading || !!urlError || !!slugError}
              className={`bg-purple-600 text-white py-2.5 px-6 rounded-lg shadow-sm 
                shadow-purple-200/50 transition-all duration-200 whitespace-nowrap flex-shrink-0
                ${(isLoading || !!urlError || !!slugError)
                  ? 'opacity-70 cursor-not-allowed' 
                  : 'hover:bg-purple-700 active:bg-purple-800 hover:shadow-md hover:shadow-purple-200/50'
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

          {/* OpenGraph Preview */}
          {formData.originalUrl && !urlError && (
            <div>
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
        </form>
      </div>

      {/* UTM Parameters Modal */}
      <UtmParametersModal
        isOpen={showUTMModal}
        onClose={() => setShowUTMModal(false)}
        utmParameters={formData.utmParameters ?? {}}
        onChange={(params) => setFormData(prev => ({ ...prev, utmParameters: params }))}
      />

      {/* Expiration Modal */}
      <ExpirationModal
        isOpen={showExpirationModal}
        onClose={() => setShowExpirationModal(false)}
        value={customExpirationDate ? customExpirationDate : formData.expireDurationMs ? new Date(Date.now() + formData.expireDurationMs).toISOString().slice(0, 16) : ""}
        onChange={(value) => {
          setCustomExpirationDate(value);
          setShowExpirationModal(false);
          setShowExpirationPopup(false);
        }}
      />
    </div>
  );
}
