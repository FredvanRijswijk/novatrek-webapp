# Google Maps API Key Security Guide

## Current Setup

Your Google Maps API key is configured as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, which makes it visible in the browser. This is necessary for client-side Google Maps functionality but requires proper security measures.

## Security Best Practices

### 1. **API Key Restrictions (REQUIRED)**

Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and set these restrictions:

#### Application Restrictions:
- **HTTP referrers (websites)**
- Add your allowed domains:
  ```
  https://yourdomain.com/*
  https://www.yourdomain.com/*
  http://localhost:3000/*  (for development)
  ```

#### API Restrictions:
- **Restrict key** to only these APIs:
  - Maps JavaScript API
  - Places API
  - Geocoding API
  - (Only enable what you actually use)

### 2. **Separate Keys for Client vs Server**

For better security, use two different API keys:

1. **Client-side key** (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`):
   - Used in browser for Maps JavaScript API
   - Restricted by HTTP referrer
   - Limited to client-side APIs only

2. **Server-side key** (`GOOGLE_MAPS_API_KEY`):
   - Used in API routes for Places Text Search, etc.
   - Restricted by IP address (your server IPs)
   - Never exposed to client

### 3. **Update .env.local**

```env
# Client-side key (restricted by HTTP referrer)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-client-key-here

# Server-side key (restricted by IP address)
GOOGLE_MAPS_API_KEY=your-server-key-here
```

### 4. **Monitor Usage**

- Set up [billing alerts](https://console.cloud.google.com/billing)
- Monitor API usage in [Google Cloud Console](https://console.cloud.google.com/apis/dashboard)
- Set quotas to prevent abuse

## Implementation Checklist

- [ ] Create two separate API keys in Google Cloud Console
- [ ] Set HTTP referrer restrictions on client key
- [ ] Set IP restrictions on server key (optional but recommended)
- [ ] Restrict APIs to only what's needed
- [ ] Update .env.local with both keys
- [ ] Set up billing alerts
- [ ] Test that restrictions work (key should fail from unauthorized domains)

## Why This Matters

Even though the client key is public, with proper restrictions:
- It can only be used from your authorized domains
- It can only access the specific APIs you've enabled
- Usage is tied to your domain, preventing abuse
- You can revoke/rotate keys if needed without changing code

## Quick Fix (Temporary)

If you want to keep using one key for now, just ensure it has HTTP referrer restrictions set up properly in Google Cloud Console. This will prevent unauthorized usage even though the key is public.