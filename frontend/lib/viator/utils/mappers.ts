/**
 * Data mappers for Viator to NovaTrek conversions
 */

import { Product, ProductSummary } from '../types/product';
import { ActivityV2 } from '@/types/travel-v2';
import { getViatorAffiliateUrl } from '../config';

/**
 * Convert Viator product to NovaTrek activity format
 */
export function viatorProductToActivity(
  product: Product | ProductSummary,
  dayId: string,
  tripId: string
): Partial<ActivityV2> {
  // Determine if it's a full product or summary
  const isFullProduct = 'description' in product;
  
  // Extract duration in minutes
  const durationMinutes = extractDurationMinutes(product.duration);
  
  // Extract location info
  const location = extractLocation(product);
  
  // Determine activity type based on tags/flags
  const activityType = determineActivityType(product);
  
  // Extract price
  const price = extractPrice(product);
  
  return {
    name: product.productName,
    description: isFullProduct ? (product as Product).description : `Experience: ${product.productName}`,
    type: activityType,
    category: 'viator',
    location,
    duration: durationMinutes,
    cost: price ? {
      amount: price.amount,
      currency: price.currency,
      perPerson: true,
    } : undefined,
    tags: [
      'viator',
      ...product.tags.map(t => t.name),
      ...product.flags.map(f => f.toLowerCase().replace(/_/g, '-')),
    ],
    status: 'planned',
    priority: 'nice-to-have',
    rating: product.reviews.combinedAverageRating,
    photos: product.images.slice(0, 3).map(img => {
      // Get the largest variant
      const variant = img.variants.reduce((prev, curr) => 
        (curr.width > prev.width) ? curr : prev
      );
      return variant.url;
    }),
    bookingUrl: getViatorAffiliateUrl(product.productCode, product.destinationName),
    bookingRequired: true,
    // Viator-specific metadata
    metadata: {
      source: 'viator',
      productCode: product.productCode,
      destinationName: product.destinationName,
      reviewCount: product.reviews.totalReviewCount,
      flags: product.flags,
    },
  };
}

/**
 * Extract duration in minutes
 */
function extractDurationMinutes(duration: any): number {
  if (duration?.fixedDuration) {
    return (duration.fixedDuration.hours || 0) * 60 + (duration.fixedDuration.minutes || 0);
  }
  
  if (duration?.variableDuration) {
    // Use average of min and max
    const minMinutes = (duration.variableDuration.from.hours || 0) * 60 + 
                      (duration.variableDuration.from.minutes || 0);
    const maxMinutes = (duration.variableDuration.to.hours || 0) * 60 + 
                      (duration.variableDuration.to.minutes || 0);
    return Math.round((minMinutes + maxMinutes) / 2);
  }
  
  // Default to 2 hours if no duration specified
  return 120;
}

/**
 * Extract location information
 */
function extractLocation(product: Product | ProductSummary): ActivityV2['location'] {
  // For full products, check logistics
  if ('logistics' in product && product.logistics?.start?.[0]?.location) {
    const startLocation = product.logistics.start[0].location;
    return {
      address: startLocation.name || product.destinationName,
      lat: startLocation.coordinates?.latitude || 0,
      lng: startLocation.coordinates?.longitude || 0,
      placeId: startLocation.ref,
    };
  }
  
  // Fallback to destination name
  return {
    address: product.destinationName,
    lat: 0,
    lng: 0,
  };
}

/**
 * Determine activity type based on product data
 */
function determineActivityType(product: Product | ProductSummary): ActivityV2['type'] {
  const tags = product.tags.map(t => t.name.toLowerCase());
  const productName = product.productName.toLowerCase();
  
  // Check for dining/food tours
  if (tags.some(t => t.includes('food') || t.includes('dining') || t.includes('culinary')) ||
      productName.includes('dinner') || productName.includes('lunch') || productName.includes('food')) {
    return 'dining';
  }
  
  // Check for transport
  if (tags.some(t => t.includes('transport') || t.includes('transfer')) ||
      productName.includes('transfer') || productName.includes('transport')) {
    return 'transport';
  }
  
  // Check for activities/adventures
  if (tags.some(t => t.includes('adventure') || t.includes('sport') || t.includes('activity'))) {
    return 'activity';
  }
  
  // Default to sightseeing
  return 'sightseeing';
}

/**
 * Extract price information
 */
function extractPrice(product: Product | ProductSummary): { amount: number; currency: string } | null {
  if (product.pricing?.summary) {
    return {
      amount: product.pricing.summary.fromPrice,
      currency: product.pricing.summary.currencyCode,
    };
  }
  
  return null;
}

/**
 * Convert Viator search filters to API format
 */
export function buildViatorSearchFilters(filters: {
  priceMin?: number;
  priceMax?: number;
  durationMin?: number;
  durationMax?: number;
  rating?: number;
  categories?: string[];
}) {
  const viatorFilters: any = {};
  
  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    viatorFilters.priceRange = {
      min: filters.priceMin || 0,
      max: filters.priceMax || 999999,
      currencyCode: 'USD',
    };
  }
  
  if (filters.durationMin !== undefined || filters.durationMax !== undefined) {
    viatorFilters.duration = {
      min: filters.durationMin || 0,
      max: filters.durationMax || 1440, // 24 hours
    };
  }
  
  if (filters.rating !== undefined) {
    viatorFilters.rating = filters.rating;
  }
  
  return viatorFilters;
}