/**
 * Viator API Configuration
 */

export const viatorConfig = {
  apiKey: process.env.VIATOR_API_KEY || '',
  apiUrl: process.env.VIATOR_API_URL || 'https://api.sandbox.viator.com/partner',
  affiliateId: process.env.NEXT_PUBLIC_VIATOR_AFFILIATE_ID || '',
  
  // API Configuration
  headers: {
    'Accept': 'application/json;version=2.0',
    'Accept-Language': 'en-US',
    'exp-api-key': process.env.VIATOR_API_KEY || '',
  },
  
  // Caching configuration
  cache: {
    // Cache durations in seconds
    products: 3600, // 1 hour
    availability: 300, // 5 minutes
    attractions: 86400, // 24 hours
    destinations: 86400, // 24 hours
  },
  
  // Rate limiting
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
  },
  
  // Affiliate URL template
  affiliateUrlTemplate: 'https://www.viator.com/tours/{destination}/{productCode}?aid={affiliateId}',
} as const;

// Validate configuration
export function validateViatorConfig(): boolean {
  if (!viatorConfig.apiKey) {
    console.warn('Viator API key not configured');
    return false;
  }
  
  if (!viatorConfig.affiliateId) {
    console.warn('Viator affiliate ID not configured');
    return false;
  }
  
  return true;
}

// Get affiliate URL for a product
export function getViatorAffiliateUrl(productCode: string, destination?: string): string {
  const url = viatorConfig.affiliateUrlTemplate
    .replace('{productCode}', productCode)
    .replace('{affiliateId}', viatorConfig.affiliateId)
    .replace('{destination}', destination || 'tours');
    
  return url;
}