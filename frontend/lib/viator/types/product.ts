/**
 * Viator Product Types
 */

import { 
  LocationReference, 
  PricingInfo, 
  Image, 
  Tag, 
  ReviewSummary, 
  Duration,
  AgeBand,
  BookingQuestion,
  ProductFlag
} from './common';

export interface ProductSummary {
  productCode: string;
  productName: string;
  productUrl: string;
  destinationName: string;
  duration: Duration;
  pricing: {
    summary: {
      fromPrice: number;
      currencyCode: string;
    };
    includesBookingFee: boolean;
  };
  images: Image[];
  reviews: ReviewSummary;
  flags: ProductFlag[];
  tags: Tag[];
  operatedIn?: string[];
}

export interface Product extends ProductSummary {
  // Additional fields for full product details
  description: string;
  highlights: string[];
  inclusions: Array<{
    category: string;
    items: string[];
  }>;
  exclusions: Array<{
    category: string;
    items: string[];
  }>;
  itinerary: Array<{
    title: string;
    description: string;
    duration?: Duration;
    location?: LocationReference;
    admissionIncluded?: boolean;
  }>;
  additionalInfo: {
    confirmationType: 'INSTANT' | 'WITHIN_24_HOURS' | 'WITHIN_48_HOURS' | 'MANUAL';
    voucherType: 'MOBILE' | 'PAPER' | 'DIGITAL';
    guideLanguages?: string[];
    accessibility?: string[];
    maxTravelers?: number;
    minTravelers?: number;
  };
  bookingQuestions?: BookingQuestion[];
  cancellationPolicy: {
    type: 'FREE_CANCELLATION' | 'CONDITIONAL' | 'NO_REFUND';
    description: string;
    cancelBefore?: {
      hours: number;
    };
    refundEligibility?: Array<{
      daysBefore: number;
      percentageRefund: number;
    }>;
  };
  logistics: {
    start: Array<{
      location: LocationReference;
      time?: string;
      description?: string;
    }>;
    end: Array<{
      location: LocationReference;
      description?: string;
    }>;
    travelerPickup?: {
      enabled: boolean;
      locations?: LocationReference[];
    };
  };
  productOptions: ProductOption[];
  pricingOptions?: PricingOption[];
}

export interface ProductOption {
  productOptionCode: string;
  description: string;
  title?: string;
  languageGuides?: string[];
}

export interface PricingOption {
  pricingOptionCode: string;
  description: string;
  ageBands: AgeBand[];
}

export interface ProductSearchParams {
  destination?: string;
  destId?: string;
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
  sorting?: 'TOP_SELLERS' | 'REVIEW_RATING' | 'PRICE_LOW_TO_HIGH' | 'PRICE_HIGH_TO_LOW';
  filtering?: {
    priceRange?: {
      min: number;
      max: number;
      currencyCode: string;
    };
    duration?: {
      min: number;
      max: number;
    };
    rating?: number;
    flags?: ProductFlag[];
    tags?: string[];
  };
  pagination: {
    offset: number;
    limit: number;
  };
  currency?: string;
}

export interface ProductSearchResponse {
  products: ProductSummary[];
  totalCount: number;
  pagination: {
    offset: number;
    limit: number;
    hasMore: boolean;
  };
}