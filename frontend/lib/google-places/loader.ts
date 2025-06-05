/**
 * Google Maps API script loader
 */

let isLoading = false;
let isLoaded = false;
const callbacks: Array<() => void> = [];

export function loadGoogleMapsAPI(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // If already loaded, resolve immediately
    if (isLoaded && window.google) {
      resolve();
      return;
    }

    // If currently loading, add to callbacks
    if (isLoading) {
      callbacks.push(() => resolve());
      return;
    }

    // Check if already loaded by another script
    if (window.google && window.google.maps) {
      isLoaded = true;
      resolve();
      return;
    }

    isLoading = true;

    // Create script element with async loading
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps&loading=async`;
    script.async = true;
    script.defer = true;

    // Define callback
    (window as any).initGoogleMaps = () => {
      isLoaded = true;
      isLoading = false;
      resolve();
      
      // Resolve all pending callbacks
      callbacks.forEach(callback => callback());
      callbacks.length = 0;
      
      // Clean up
      delete (window as any).initGoogleMaps;
    };

    // Handle errors
    script.onerror = () => {
      isLoading = false;
      reject(new Error('Failed to load Google Maps API'));
    };

    // Add script to document
    document.head.appendChild(script);
  });
}

export function isGoogleMapsLoaded(): boolean {
  return isLoaded && !!window.google;
}