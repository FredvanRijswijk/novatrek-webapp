# Rate Limiting and Waitlist Implementation

## Overview

This document describes the rate limiting and waitlist system implementation for NovaTrek.

## Rate Limiting

### Setup

1. **Install Upstash packages:**
```bash
npm install @upstash/redis @upstash/ratelimit
```

2. **Configure environment variables:**
```env
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

3. **Get Upstash credentials:**
   - Sign up at https://console.upstash.com
   - Create a new Redis database
   - Copy the REST URL and token from the database details

### Rate Limits Implemented

- **Chat API**: 10 requests per minute per user
- **General API**: 100 requests per minute per IP
- **Signup**: 5 signups per hour per IP

### Usage in API Routes

The chat API (`/api/chat/route.ts`) now includes rate limiting:
```typescript
// Check rate limit
const identifier = getIdentifier(req, userId);
const { success, limit, reset, remaining } = await chatRateLimit.limit(identifier);

if (!success) {
  return rateLimitResponse(limit, reset);
}
```

## Waitlist System

### Features

1. **Public Waitlist Page** (`/waitlist`)
   - Email signup with optional name
   - Interest selection
   - Referral source tracking
   - UTM parameter tracking
   - Position display after signup

2. **Waitlist Model** (`/lib/models/waitlist-model.ts`)
   - Status tracking: pending → approved → invited → joined
   - Position management
   - Email duplicate prevention
   - Metadata storage (IP, user agent, UTM params)

3. **Admin Management** (`/dashboard/admin/waitlist`)
   - View all waitlist entries
   - Filter by status
   - Approve users
   - Send invitations (individual or bulk)
   - Export to CSV
   - View statistics

4. **Access Control** (`/components/auth/WaitlistGate.tsx`)
   - Checks user's waitlist status on sign-in
   - Blocks access for non-invited users
   - Auto-adds new signups to waitlist
   - Admin bypass option

### Waitlist Flow

1. **New User Signs Up**:
   - Goes to `/waitlist` page
   - Fills out form with email and interests
   - Gets position number
   - Status: `pending`

2. **Admin Approves**:
   - Admin reviews application
   - Clicks "Approve" button
   - Status: `approved`

3. **Admin Sends Invite**:
   - Admin clicks "Send Invite"
   - Email sent to user (TODO: implement email)
   - Status: `invited`

4. **User Joins**:
   - User signs in with invited email
   - Automatically marked as joined
   - Status: `joined`
   - Full access granted

### Admin API Endpoints

- `GET /api/admin/waitlist` - List entries with optional status filter
- `GET /api/admin/waitlist/stats` - Get waitlist statistics
- `POST /api/admin/waitlist/[id]/approve` - Approve a user
- `POST /api/admin/waitlist/[id]/invite` - Send invitation
- `POST /api/admin/waitlist/bulk-invite` - Bulk invite approved users
- `GET /api/admin/waitlist/export` - Export to CSV

### Using the Waitlist Gate

Wrap protected pages with the `WaitlistGate` component:

```tsx
import { WaitlistGate } from '@/components/auth/WaitlistGate';

export default function ProtectedPage() {
  return (
    <WaitlistGate adminBypass={true}>
      {/* Your protected content */}
    </WaitlistGate>
  );
}
```

### Firestore Rules

The waitlist collection has been added to `firestore.rules`:
- Users can only read their own entry
- Anyone can create entries (rate limited by API)
- Only admins can update entries
- No deletion allowed

### Special Access

Users with emails ending in `@novatrek.com` automatically bypass the waitlist.

## TODO

1. **Email Integration**:
   - Implement waitlist welcome email
   - Implement invitation email
   - Add email templates

2. **Firebase Deployment**:
   - Run `firebase login --reauth`
   - Deploy rules: `firebase deploy --only firestore:rules`

3. **Admin API Endpoints**:
   - Implement remaining admin endpoints:
     - `/api/admin/waitlist/[id]/approve`
     - `/api/admin/waitlist/[id]/invite`
     - `/api/admin/waitlist/bulk-invite`
     - `/api/admin/waitlist/export`

4. **Integration**:
   - Add WaitlistGate to main app pages
   - Update signup flow to redirect to waitlist
   - Add waitlist link to navigation

## Testing

1. **Test Rate Limiting**:
   - Make rapid requests to chat API
   - Verify 429 responses after limit
   - Check rate limit headers

2. **Test Waitlist Flow**:
   - Sign up at `/waitlist`
   - Check admin panel shows entry
   - Approve and invite user
   - Sign in with invited email
   - Verify access granted

3. **Test Admin Features**:
   - Filter by status
   - Bulk invite
   - Export to CSV