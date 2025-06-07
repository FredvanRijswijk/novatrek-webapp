import { Timestamp } from 'firebase/firestore';

export interface TravelCapture {
  id: string;
  userId: string;
  
  // Core content
  content: string;
  contentType: 'text' | 'link' | 'image' | 'video' | 'audio';
  source: 'browser-extension' | 'email' | 'whatsapp' | 'instagram' | 'youtube' | 'manual';
  sourceUrl?: string;
  
  // Metadata
  title?: string;
  notes?: string;
  sharedBy?: string; // "Mom", "Sarah from work"
  capturedAt: Timestamp;
  originalDate?: Timestamp; // When the content was created
  
  // Extracted Information (populated by AI)
  extractedData?: {
    location?: {
      name: string;
      address?: string;
      coordinates?: { lat: number; lng: number };
      country?: string;
      city?: string;
      placeId?: string; // Google Places ID
    };
    activity?: {
      type: 'restaurant' | 'hotel' | 'attraction' | 'transport' | 'shopping' | 'other';
      name: string;
      description?: string;
    };
    price?: {
      amount: number;
      currency: string;
      priceLevel?: number; // 1-4 scale
    };
    suggestedDates?: string[];
    openingHours?: string[];
    website?: string;
    phoneNumber?: string;
    rating?: number;
    reviews?: number;
  };
  
  // Organization
  assignedTo?: string; // tripId or null for "someday"
  tags: string[];
  category?: 'food' | 'accommodation' | 'activity' | 'transport' | 'tip' | 'other';
  priority?: 'must-do' | 'nice-to-have' | 'maybe';
  isProcessed: boolean; // Has AI extraction been done
  isSorted: boolean; // Has user sorted this into a trip
  
  // AI Enhancement
  aiSummary?: string;
  aiTags?: string[];
  relatedCaptures?: string[]; // IDs of similar saves
  
  // Additional metadata
  attachments?: {
    type: 'image' | 'pdf' | 'document';
    url: string;
    thumbnail?: string;
  }[];
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Simplified version for creating new captures
export interface CreateCaptureInput {
  content: string;
  contentType?: TravelCapture['contentType'];
  source: TravelCapture['source'];
  sourceUrl?: string;
  title?: string;
  notes?: string;
  tags?: string[];
  assignedTo?: string;
  attachments?: File[];
}