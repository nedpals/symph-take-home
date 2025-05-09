export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
export const API_URL = BACKEND_URL + "/api";

export function createURL(endpoint: string) {
  const url = new URL(endpoint, BACKEND_URL);
  return url.toString();
}

export function apiEndpointURL(endpoint: string) {
  if (endpoint.startsWith("/")) {
    endpoint = endpoint.substring(1);
  }
  return createURL(`api/${endpoint}`);
}

export async function fetchUrlMetadata(url: string) {
  try {
    const endpoint = apiEndpointURL(`/urls/metadata?url=${encodeURIComponent(url)}`);
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Error fetching URL metadata: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch URL metadata:", error);
    return null;
  }
}

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
};