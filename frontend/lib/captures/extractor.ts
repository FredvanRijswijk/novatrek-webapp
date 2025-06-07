import { TravelCapture } from '@/lib/models/capture';
import { generateText } from 'ai';
import { getVertexModel } from '@/lib/ai/vertex-provider';
import { openai } from '@ai-sdk/openai';

interface ExtractedContent {
  location?: {
    name: string;
    address?: string;
    city?: string;
    country?: string;
    coordinates?: { lat: number; lng: number };
  };
  activity?: {
    type: 'restaurant' | 'hotel' | 'attraction' | 'transport' | 'shopping' | 'other';
    name: string;
    description?: string;
  };
  price?: {
    level?: number; // 1-4 scale
    currency?: string;
    estimatedCost?: { min: number; max: number };
  };
  timing?: {
    openingHours?: string[];
    bestTimeToVisit?: string;
    duration?: string;
  };
  contact?: {
    website?: string;
    phone?: string;
    email?: string;
  };
  ratings?: {
    score?: number;
    source?: string;
  };
  tags?: string[];
  summary?: string;
}

const EXTRACTION_PROMPT = `
You are a travel content analyzer. Extract structured information from the following content.

Content to analyze:
{content}

Additional context:
- Source URL: {sourceUrl}
- Page Title: {title}
- User Notes: {notes}

Extract and return ONLY a JSON object with the following structure (omit fields if not found):
{
  "location": {
    "name": "specific place name",
    "address": "full address if available",
    "city": "city name",
    "country": "country name"
  },
  "activity": {
    "type": "restaurant|hotel|attraction|transport|shopping|other",
    "name": "business/activity name",
    "description": "brief description"
  },
  "price": {
    "level": 1-4 (1=budget, 4=luxury),
    "currency": "USD/EUR/etc",
    "estimatedCost": { "min": number, "max": number }
  },
  "timing": {
    "openingHours": ["Mon-Fri: 9am-5pm"],
    "bestTimeToVisit": "description",
    "duration": "how long to spend"
  },
  "contact": {
    "website": "url",
    "phone": "number",
    "email": "email"
  },
  "ratings": {
    "score": 4.5,
    "source": "Google/TripAdvisor/etc"
  },
  "tags": ["japanese", "ramen", "casual dining"],
  "summary": "one sentence summary of what this is"
}

IMPORTANT: Return ONLY valid JSON. No markdown, no explanation.
`;

export async function extractContentWithAI(capture: {
  content: string;
  sourceUrl?: string;
  title?: string;
  notes?: string;
}): Promise<ExtractedContent | null> {
  const prompt = EXTRACTION_PROMPT
    .replace('{content}', capture.content || '')
    .replace('{sourceUrl}', capture.sourceUrl || 'none')
    .replace('{title}', capture.title || 'none')
    .replace('{notes}', capture.notes || 'none');

  let result;
  let text: string;

  try {
    // Try Vertex AI first
    console.log('Attempting extraction with Vertex AI...');
    const vertexModel = getVertexModel('chat');
    result = await generateText({
      model: vertexModel,
      prompt,
      maxTokens: 800,
      temperature: 0.3,
    });
    text = result.text;
    console.log('Vertex AI extraction successful');
  } catch (vertexError: any) {
    // If Vertex fails, fallback to OpenAI
    console.log('Vertex AI failed:', vertexError.message, '- falling back to OpenAI');
    try {
      const openaiModel = openai('gpt-4o-mini');
      result = await generateText({
        model: openaiModel,
        prompt,
        maxTokens: 800,
        temperature: 0.3,
      });
      text = result.text;
      console.log('OpenAI extraction successful');
    } catch (openaiError) {
      console.error('Both AI providers failed:', openaiError);
      return null;
    }
  }

    // Parse JSON response
    try {
      // Clean up response - remove markdown if present
      const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const extracted = JSON.parse(jsonStr) as ExtractedContent;
      
      console.log('Extracted data:', extracted);
      return extracted;
    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
      return null;
    }
}

// Helper to extract from specific platforms
export function extractFromPlatform(url: string, content: string): Partial<ExtractedContent> {
  const domain = new URL(url).hostname;
  
  // Platform-specific extraction rules
  if (domain.includes('tripadvisor.com')) {
    // Extract TripAdvisor specific patterns
    const ratingMatch = content.match(/(\d+\.?\d*)\s*of\s*5/);
    return {
      ratings: ratingMatch ? { score: parseFloat(ratingMatch[1]), source: 'TripAdvisor' } : undefined
    };
  }
  
  if (domain.includes('google.com/maps')) {
    // Extract Google Maps patterns
    const ratingMatch = content.match(/(\d+\.?\d*)\s*stars?/i);
    const priceMatch = content.match(/\$+/);
    return {
      ratings: ratingMatch ? { score: parseFloat(ratingMatch[1]), source: 'Google' } : undefined,
      price: priceMatch ? { level: priceMatch[0].length } : undefined
    };
  }
  
  if (domain.includes('airbnb.com')) {
    // Extract Airbnb patterns
    const priceMatch = content.match(/[\$€£]\s*(\d+)\s*(?:per\s*)?night/i);
    return {
      activity: { type: 'hotel', name: 'Airbnb Listing', description: '' },
      price: priceMatch ? { 
        currency: priceMatch[0][0] === '$' ? 'USD' : priceMatch[0][0] === '€' ? 'EUR' : 'GBP',
        estimatedCost: { min: parseInt(priceMatch[1]), max: parseInt(priceMatch[1]) }
      } : undefined
    };
  }
  
  return {};
}

// Smart extraction that combines AI and rule-based
export async function smartExtract(capture: any): Promise<TravelCapture['extractedData']> {
  // First, try platform-specific extraction for quick wins
  let extractedData: any = {};
  
  if (capture.sourceUrl) {
    const platformData = extractFromPlatform(capture.sourceUrl, capture.content);
    extractedData = { ...extractedData, ...platformData };
  }
  
  // Then use AI for comprehensive extraction
  const aiData = await extractContentWithAI(capture);
  if (aiData) {
    // Merge AI data with platform data (platform data takes precedence for accuracy)
    // Build object without undefined values
    const mergedData: any = {};
    
    if (aiData.location) mergedData.location = aiData.location;
    if (extractedData.activity || aiData.activity) {
      mergedData.activity = extractedData.activity || aiData.activity;
    }
    
    // Only add price if there's actual data
    const priceData = { ...aiData.price, ...extractedData.price };
    if (Object.keys(priceData).length > 0) {
      mergedData.price = priceData;
    }
    
    if (aiData.timing?.bestTimeToVisit) {
      mergedData.suggestedDates = [aiData.timing.bestTimeToVisit];
    }
    if (aiData.timing?.openingHours) {
      mergedData.openingHours = aiData.timing.openingHours;
    }
    if (aiData.contact?.website) {
      mergedData.website = aiData.contact.website;
    }
    if (aiData.contact?.phone) {
      mergedData.phoneNumber = aiData.contact.phone;
    }
    
    const rating = extractedData.ratings?.score || aiData.ratings?.score;
    if (rating) mergedData.rating = rating;
    
    if (aiData.summary) mergedData.aiSummary = aiData.summary;
    if (aiData.tags && aiData.tags.length > 0) mergedData.aiTags = aiData.tags;
    
    extractedData = mergedData;
  }
  
  return extractedData;
}