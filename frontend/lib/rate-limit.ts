import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Chat rate limiter - 10 requests per minute per user
export const chatRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'rl:chat',
});

// API rate limiter - 100 requests per minute per IP
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'rl:api',
});

// Signup rate limiter - 5 signups per hour per IP
export const signupRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  analytics: true,
  prefix: 'rl:signup',
});

// Helper to get identifier (user ID or IP)
export function getIdentifier(request: Request, userId?: string): string {
  if (userId) return userId;
  
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 
    request.headers.get('x-real-ip') || 
    'anonymous';
  
  return ip;
}

// Rate limit response helper
export function rateLimitResponse(limit: number, reset: number) {
  return new Response('Too Many Requests', {
    status: 429,
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': new Date(reset).toISOString(),
      'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
    },
  });
}