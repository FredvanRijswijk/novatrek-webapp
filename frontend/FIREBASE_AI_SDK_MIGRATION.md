# Firebase AI SDK Migration Guide

This document outlines the migration from the traditional Vertex AI SDK to the new Firebase AI SDK for simplified AI integration.

## Overview

The Firebase AI SDK provides a streamlined way to use Vertex AI (Gemini models) directly through Firebase, eliminating the need for separate Google Cloud credentials and complex authentication setup.

## Key Benefits

1. **Simplified Authentication**: Uses existing Firebase credentials - no service accounts needed
2. **Structured Output**: Native support for JSON schema-based responses
3. **Seamless Integration**: Works directly with Firebase Auth and other Firebase services
4. **Automatic Fallback**: Graceful degradation to OpenAI when Vertex AI is unavailable

## Implementation Details

### 1. Core Implementation
- **File**: `lib/ai/vertex-firebase.ts`
- **Features**:
  - Basic text generation
  - Streaming responses
  - Chat conversations with context
  - Structured output for complex queries

### 2. API Routes Updated

#### Chat API (`/api/chat`)
- Supports both old and new implementations
- Use `providerId: 'vertex-gemini-flash-firebase'` to use Firebase SDK
- Automatic fallback to OpenAI on failure

#### Group Compromise API (`/api/ai/group-compromise`)
- Pass `useFirebaseSDK: true` to use new implementation
- Returns structured JSON with recommendations and budget analysis

#### Itinerary Optimization API (`/api/ai/optimize-itinerary`)
- Pass `useFirebaseSDK: true` to use new implementation
- Returns structured JSON with optimized daily schedules

## Usage Examples

### Basic Chat Request
```typescript
// Using the new Firebase AI SDK
fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Plan a trip to Paris' }],
    providerId: 'vertex-gemini-flash-firebase'
  })
})
```

### Group Compromise with Structured Output
```typescript
fetch('/api/ai/group-compromise', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    groupPreferences: [...],
    destination: 'Paris',
    duration: 5,
    useFirebaseSDK: true  // Enable Firebase SDK
  })
})
```

## Configuration

### Required Setup
1. **Enable Vertex AI API** in Google Cloud Console
2. **Firebase Project**: Must have billing enabled
3. **Region**: Models available in `us-central1` (configurable)

### Environment Variables
No additional environment variables needed! The Firebase AI SDK uses your existing Firebase configuration.

## Testing

Run the test script to verify the implementation:
```bash
npx tsx scripts/test-firebase-ai.ts
```

## Migration Strategy

### Phase 1: Parallel Implementation (Current)
- Both old and new implementations available
- Feature flags control which implementation to use
- Monitor performance and reliability

### Phase 2: Gradual Migration
- Default to Firebase SDK for new features
- Migrate existing features based on performance data
- Maintain fallback to old implementation

### Phase 3: Full Migration
- Remove old Vertex AI implementation
- Simplify codebase
- Document best practices

## Troubleshooting

### Common Issues

1. **"Vertex AI API not enabled"**
   - Enable the API in Google Cloud Console
   - Ensure billing is enabled on the project

2. **"Model not found"**
   - Check model availability in your region
   - Verify model names in `vertex-firebase.ts`

3. **"Authentication failed"**
   - Ensure Firebase is properly initialized
   - Check Firebase Auth configuration

### Debug Mode
Enable debug logging by setting:
```typescript
console.log('Firebase AI Request:', { model, prompt, config })
```

## Best Practices

1. **Error Handling**: Always implement fallback logic
2. **Structured Output**: Use schemas for predictable responses
3. **Token Limits**: Monitor usage and implement streaming for long responses
4. **Caching**: Consider caching AI responses for common queries
5. **Rate Limiting**: Implement client-side rate limiting

## Future Enhancements

1. **Streaming Support**: Implement true streaming for chat responses
2. **Multi-Modal**: Add image analysis capabilities
3. **Fine-Tuning**: Explore model customization options
4. **Embeddings**: Add semantic search capabilities
5. **Monitoring**: Integrate with Firebase Performance Monitoring