/**
 * Common types used across Viator API
 */

export interface ViatorApiResponse<T> {
  data: T;
  nextCursor?: string;
  lastModifiedDate?: string;
}

export interface ViatorError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface LocationReference {
  ref: string;
  type: 'LOCATION' | 'DESTINATION' | 'REGION' | 'COUNTRY';
  name?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface PricingInfo {
  currencyCode: string;
  retailPrice: number;
  finalPrice: number;
  bookingFee?: number;
  merchantNetPrice?: number;
}

export interface ImageVariant {
  url: string;
  width: number;
  height: number;
}

export interface Image {
  variants: ImageVariant[];
  caption?: string;
  isCover?: boolean;
}

export interface Tag {
  id: string;
  name: string;
  category?: string;
}

export interface ReviewSummary {
  combinedAverageRating: number;
  totalReviewCount: number;
  averageRating?: number;
  count?: number;
}

export interface Duration {
  fixedDuration?: {
    hours: number;
    minutes: number;
  };
  variableDuration?: {
    from: {
      hours: number;
      minutes: number;
    };
    to: {
      hours: number;
      minutes: number;
    };
  };
}

export interface AgeBand {
  id: string;
  name: string;
  minAge?: number;
  maxAge?: number;
  startAge?: number;
  endAge?: number;
}

export interface Traveler {
  ageBand: string;
  count: number;
}

export interface BookingQuestion {
  id: string;
  label: string;
  required: boolean;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'TIME' | 'TRAVELER_DETAILS';
  units?: string[];
}

export type ProductFlag = 
  | 'LIKELY_TO_SELL_OUT'
  | 'BEST_SELLER'
  | 'TOP_RATED'
  | 'NEW_ON_VIATOR'
  | 'FREE_CANCELLATION'
  | 'SKIP_THE_LINE'
  | 'PRIVATE_TOUR'
  | 'MOBILE_TICKET'
  | 'HOTEL_PICKUP';

export interface Pagination {
  count?: number;
  offset?: number;
  limit?: number;
  cursor?: string;
}