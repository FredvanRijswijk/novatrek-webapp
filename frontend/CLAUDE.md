# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NovaTrek is a comprehensive travel planning platform built with Next.js 15.3.3 and React 19. It combines modern web technologies with AI capabilities to help users plan trips efficiently.

## Core Technologies

- **Next.js 15.3.3** with App Router (Turbopack enabled)
- **React 19.0.0** with TypeScript 5
- **Firebase**: Authentication, Firestore database, Admin SDK
- **Stripe**: Subscription management and payments
- **Google Places API**: Location search and activity discovery
- **AI Integration**: OpenAI, Google Vertex AI, Firebase Genkit
- **UI**: Tailwind CSS, shadcn/ui (New York style), Radix UI

## Essential Commands

```bash
# Development with Turbopack (fast refresh)
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Linting
npm run lint

# Deploy Firestore rules
firebase deploy --only firestore:rules
# Or use the script
./deploy-firestore-rules.sh
```

## High-Level Architecture

### Directory Structure
- `app/` - Next.js App Router pages and API routes
- `components/` - Reusable React components organized by feature
- `lib/` - Core utilities and service integrations
  - `firebase/` - Firebase auth, Firestore, and admin functions
  - `google-places/` - Google Places API v2 integration
  - `ai/` - Vertex AI and Genkit configuration
  - `stripe/` - Payment processing
  - `models/` - Data models (User, Trip, Chat)
- `hooks/` - Custom React hooks
- `types/` - TypeScript type definitions

### Key Features & Implementation

1. **Multi-Destination Trip Planning**
   - Trip creation wizard with 4-step flow
   - Support for single or multi-destination trips
   - Day-by-day itinerary builder
   - Budget tracking and activity search

2. **User Travel Preferences System**
   - Stored separately from user profile for privacy
   - Comprehensive preferences: travel style, activities, budget, dietary
   - Anonymous sharing for group travel
   - Integration with AI for personalized recommendations

3. **AI-Powered Features**
   - Chat API with fallback: Vertex AI (Gemini) → OpenAI
   - Context-aware recommendations based on trip and user preferences
   - Group travel compromise engine
   - Itinerary optimization

4. **Authentication & Subscriptions**
   - Firebase Auth with Google OAuth and email/password
   - Stripe integration for subscription tiers
   - Protected routes with subscription checks

### Critical Implementation Details

1. **Environment Variables**
   - Copy `.env.local.example` to `.env.local`
   - Required: Firebase config, Google Maps API key, Stripe keys
   - Optional: Vertex AI credentials (falls back to OpenAI)

2. **Firestore Security Rules**
   - Users can only access their own data
   - Travel preferences stored in separate collection
   - Group travel features use anonymous preference sharing

3. **Google Places API**
   - Upgraded to Places API v2 (2023)
   - Server-side proxy at `/api/places/photo` for photo URLs
   - Client-side hooks for search functionality

4. **AI Context Flow**
   - User preferences → Trip context → AI prompt enhancement
   - Shareable preferences exclude sensitive data (exact budgets)
   - Group features use anonymous aggregation

### Recent Major Updates

1. **Travel Preferences System** - Complete user profile system for personalized recommendations
2. **Multi-Destination Support** - Trips can have multiple stops with individual dates
3. **Vertex AI Integration** - Dual AI provider support with automatic fallback
4. **Group Travel Architecture** - Documented plans for anonymous group planning features
5. **Firebase AI SDK Migration** - New simplified Vertex AI integration using Firebase's native AI SDK

### Known Configuration Requirements

1. **Firebase Setup**
   - Enable Authentication (Google + Email providers)
   - Deploy Firestore rules before using
   - Configure Firebase Admin SDK for server-side operations

2. **Google Cloud/Vertex AI**
   - For local dev: `gcloud auth application-default login`
   - For production: Service account JSON in environment variable
   - Falls back to OpenAI if not configured
   - **NEW Firebase AI SDK**: No additional auth needed - uses Firebase credentials
   - Enable Vertex AI API in Google Cloud Console

3. **Stripe Webhooks**
   - Development: Use Stripe CLI for webhook forwarding
   - Production: Configure webhook endpoint in Stripe dashboard

### Data Models

- **User**: Firebase auth user with profile preferences
- **Trip**: Multi-destination support, itinerary, budget tracking
- **TravelPreferences**: Comprehensive user preferences (separate collection)
- **Chat**: AI conversation history with trip context

### Testing Notes

No testing framework is currently configured. All new features should be manually tested, particularly:
- Multi-destination trip creation flow
- Travel preferences saving/loading
- AI chat with different contexts
- Subscription flows in Stripe test mode

### Firebase AI SDK Integration

The project now supports the new Firebase AI SDK for Vertex AI alongside the existing implementation:

1. **New Implementation** (`lib/ai/vertex-firebase.ts`)
   - Uses Firebase's native AI SDK with Vertex AI backend
   - Simplified authentication (uses Firebase credentials)
   - Structured output support for complex AI responses
   - Helper functions for chat, group compromise, and itinerary optimization

2. **Migration Status**
   - Chat API: Supports both old and new implementations via `providerId`
   - Group Compromise: Both implementations available with `useFirebaseSDK` flag
   - Itinerary Optimization: Both implementations available with `useFirebaseSDK` flag
   - Automatic fallback to OpenAI if Vertex AI fails

3. **Using the New SDK**
   - Chat: Pass `providerId: 'vertex-gemini-flash-firebase'` in the request
   - Group/Itinerary APIs: Pass `useFirebaseSDK: true` in the request body
   - No additional authentication setup required beyond Firebase

4. **Benefits**
   - Simpler authentication (no service accounts needed)
   - Native Firebase integration
   - Structured output for predictable AI responses
   - Automatic model selection and fallback handling