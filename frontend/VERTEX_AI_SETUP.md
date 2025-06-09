# Vertex AI Setup Guide

This guide helps you set up Vertex AI with Firebase Genkit for NovaTrek.

**Note**: The app will automatically fall back to OpenAI if Vertex AI is not configured, so you can start using it immediately while setting up Vertex AI.

## Current Issue with Packing Suggestions

The AI packing suggestions feature is currently experiencing initialization issues with the Firebase AI SDK. The system will:
1. Try Firebase AI SDK with Vertex backend
2. Fall back to direct Vertex AI integration
3. Use weather-based suggestions if all AI providers fail

## Prerequisites

1. **Firebase Project with Vertex AI enabled** (which you already have)
2. **Google Cloud Project** linked to your Firebase project
3. **Vertex AI API enabled** in Google Cloud Console

## Quick Setup (Minimal Configuration)

To use Vertex AI immediately, add this to your `.env.local`:

```bash
# Add your Google Cloud project ID (usually same as Firebase project ID)
GOOGLE_VERTEX_PROJECT=your-firebase-project-id

# Optional: If you have OpenAI as backup
OPENAI_API_KEY=your-openai-api-key
```

Then run:
```bash
gcloud auth application-default login
```

That's it! The chat will now use Vertex AI Gemini.

### For Packing Suggestions Specifically

The packing suggestions feature requires Vertex AI to be properly configured. If you're seeing "Failed to generate packing suggestions", check:

1. **Vertex AI API is enabled**: 
   ```bash
   gcloud services enable aiplatform.googleapis.com --project=YOUR_PROJECT_ID
   ```

2. **You're authenticated**:
   ```bash
   gcloud auth list  # Should show your account
   gcloud config get-value project  # Should show your project
   ```

3. **Environment variables are set**:
   ```bash
   # In .env.local
   GOOGLE_VERTEX_PROJECT=your-project-id
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   ```

## Full Setup Steps

### 1. Enable Vertex AI API

```bash
# Using gcloud CLI
gcloud services enable aiplatform.googleapis.com
```

Or enable it in the [Google Cloud Console](https://console.cloud.google.com/apis/library/aiplatform.googleapis.com).

### 2. Authentication Setup

#### For Local Development

1. **Install Google Cloud SDK**:
   ```bash
   # macOS
   brew install google-cloud-sdk
   
   # Or download from https://cloud.google.com/sdk/install
   ```

2. **Authenticate with your Google account**:
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

3. **Set your project**:
   ```bash
   gcloud config set project YOUR_FIREBASE_PROJECT_ID
   ```

#### For Production (Vercel)

1. **Create a Service Account**:
   ```bash
   gcloud iam service-accounts create novatrek-vertex-ai \
     --display-name="NovaTrek Vertex AI Service Account"
   ```

2. **Grant necessary permissions**:
   ```bash
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:novatrek-vertex-ai@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/aiplatform.user"
   ```

3. **Create and download key**:
   ```bash
   gcloud iam service-accounts keys create vertex-ai-key.json \
     --iam-account=novatrek-vertex-ai@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

4. **Add to Vercel Environment Variables**:
   - Go to your Vercel project settings
   - Add the contents of `vertex-ai-key.json` as `GOOGLE_APPLICATION_CREDENTIALS_JSON`
   - Add this to your `next.config.ts`:

   ```typescript
   // next.config.ts
   import type { NextConfig } from 'next'

   const nextConfig: NextConfig = {
     // ... other config
     env: {
       // Parse service account from environment variable
       GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
         ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
         : undefined,
     },
   }

   export default nextConfig
   ```

### 3. Configure Regions

Update the location in `/lib/ai/vertex-config.ts` based on your preference:

- `us-central1` - United States
- `europe-west3` - Frankfurt, Germany
- `europe-west4` - Netherlands
- `asia-northeast1` - Tokyo, Japan

### 4. Test the Integration

```bash
# Run the development server
npm run dev
```

Visit your chat interface and test with a message like:
- "Help me plan a trip to Tokyo"
- "What are the best restaurants in Paris?"

## Available AI Features

### 1. Travel Chat Assistant
- Context-aware trip planning
- Destination recommendations
- Activity suggestions
- Budget optimization

### 2. Group Travel Mediator
- Anonymous preference analysis
- Fair compromise suggestions
- Budget range calculations
- Consensus building

### 3. Itinerary Optimizer
- Route optimization
- Time management
- Activity grouping
- Schedule balancing

## Usage Examples

### Basic Chat
```typescript
import { useVertexAI } from '@/hooks/use-vertex-ai'

function MyComponent() {
  const { messages, sendMessage, isLoading } = useVertexAI({
    tripContext: {
      destination: { city: 'Tokyo', country: 'Japan' },
      duration: 7,
      budget: '2000-3000',
    }
  })
  
  // Use the chat interface
}
```

### Group Compromise Analysis
```typescript
import { useGroupCompromise } from '@/hooks/use-vertex-ai'

function GroupPlanning() {
  const { analyzeGroup, loading, result } = useGroupCompromise()
  
  const handleAnalysis = async () => {
    const analysis = await analyzeGroup({
      groupPreferences: [
        { memberId: 'anon1', budget: { min: 1000, max: 1500 }, ... },
        { memberId: 'anon2', budget: { min: 2000, max: 3000 }, ... },
      ],
      destination: 'Bali',
      duration: 10,
    })
  }
}
```

## Troubleshooting

### Authentication Issues
1. Ensure you're logged in: `gcloud auth list`
2. Check project: `gcloud config get-value project`
3. Verify API is enabled: `gcloud services list --enabled | grep aiplatform`

### Rate Limits
- Gemini 1.5 Flash: 60 requests per minute
- Gemini 1.5 Pro: 5 requests per minute
- Implement retry logic for production

### Cost Optimization
- Use Gemini 1.5 Flash for most queries (faster, cheaper)
- Use Gemini 1.5 Pro only for complex analysis
- Monitor usage in Google Cloud Console

## Testing Packing Suggestions

To test if the packing suggestions are working:

1. Go to a trip planning page: `http://localhost:3000/dashboard/trips/[trip-id]/plan`
2. Click on the "Packing" tab
3. Click the "AI Suggestions" button
4. Check the browser console (F12) for any errors
5. Check the terminal running `npm run dev` for server-side errors

### Expected Behavior

- **If Vertex AI is configured**: You'll get personalized packing suggestions based on your trip details
- **If only weather data is available**: You'll get basic weather-appropriate suggestions
- **Loading state**: Shows "Generating AI Suggestions" with a spinner

### Common Errors and Solutions

1. **"Firebase AI with Vertex backend is not available"**
   - The Firebase AI SDK couldn't initialize
   - Solution: Use direct Vertex AI setup (see above)

2. **"Failed to generate packing suggestions"**
   - Usually means Vertex AI API is not enabled or authenticated
   - Solution: Run `gcloud auth application-default login`

3. **Empty suggestions**
   - The AI couldn't generate relevant items
   - Check if your trip has activities and destinations set

## Security Best Practices

1. **Never commit service account keys**
2. **Use different service accounts for dev/prod**
3. **Regularly rotate keys**
4. **Implement rate limiting in production**
5. **Validate all user inputs before sending to AI**