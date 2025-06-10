/**
 * Environment configuration helper
 * Handles different deployment environments: development, preview, production
 */

export type Environment = 'development' | 'preview' | 'production';

export function getEnvironment(): Environment {
  // Check Vercel environment
  if (process.env.VERCEL_ENV === 'preview') {
    return 'preview';
  }
  
  // Check NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    // Additional check for preview URLs
    if (process.env.NEXT_PUBLIC_APP_URL?.includes('preview')) {
      return 'preview';
    }
    return 'production';
  }
  
  return 'development';
}

export const config = {
  environment: getEnvironment(),
  
  // App URLs
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 
    (getEnvironment() === 'production' ? 'https://novatrek.app' : 'http://localhost:3000'),
  
  // API endpoints
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 
    (getEnvironment() === 'production' ? 'https://novatrek.app/api' : 'http://localhost:3000/api'),
  
  // Firebase project
  useProductionFirebase: process.env.USE_PROD_FIREBASE === 'true' || 
    ['preview', 'production'].includes(getEnvironment()),
  
  // Feature flags
  debug: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
  experimentalFeatures: process.env.NEXT_PUBLIC_ENABLE_EXPERIMENTAL_FEATURES === 'true',
  
  // Stripe
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  
  // Google Maps
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  
  // Analytics (only in production)
  enableAnalytics: getEnvironment() === 'production',
};

// Log configuration in non-production environments
if (config.environment !== 'production') {
  console.log('🔧 Environment Configuration:', {
    environment: config.environment,
    appUrl: config.appUrl,
    useProductionFirebase: config.useProductionFirebase,
    debug: config.debug,
  });
}