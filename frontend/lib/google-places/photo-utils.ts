/**
 * Utility functions for handling Google Places photos
 */

/**
 * Extracts a usable photo URL from the new Places API photo response
 * Uses our proxy endpoint to handle authentication
 */
export function getPhotoUrl(photo: any, apiKey: string): string | undefined {
  if (!photo) return undefined;

  // Option 1: If we have a photo name (new API format)
  if (photo.name) {
    // Use our proxy endpoint to fetch the photo
    return `/api/places/photo?name=${encodeURIComponent(photo.name)}&maxWidth=800&maxHeight=600`;
  }

  // Option 2: If the photo has a photoReference property (older API style)
  if (photo.photoReference) {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photoReference}&key=${apiKey}`;
  }

  // Option 3: If the photo has an authorPhotoUri or similar public URL
  if (photo.authorPhotoUri || photo.googleMapsUri) {
    return photo.authorPhotoUri || photo.googleMapsUri;
  }

  // Option 4: Try to extract from the getURI method if it exists
  if (typeof photo.getURI === 'function') {
    try {
      const uri = photo.getURI({ maxWidth: 800, maxHeight: 600 });
      // If it's a new API URI, extract the photo name and use our proxy
      if (uri && uri.includes('/v1/places/')) {
        const match = uri.match(/places\/[^/]+\/photos\/[^/]+/);
        if (match) {
          return `/api/places/photo?name=${encodeURIComponent(match[0])}&maxWidth=800&maxHeight=600`;
        }
      }
      return uri;
    } catch (error) {
      console.error('Error getting photo URI:', error);
    }
  }

  return undefined;
}

/**
 * Gets a fallback image URL based on the destination
 */
export function getFallbackImage(destinationName: string): string {
  // Use Unsplash for fallback images
  const query = encodeURIComponent(destinationName.toLowerCase());
  return `https://source.unsplash.com/800x600/?${query},travel,city`;
}