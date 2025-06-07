# API Key Security Best Practices

## Architecture

API keys in NovaTrek are designed with security in mind:

### 1. **Separate Storage**
- API keys are stored in a separate `apiKeys` collection
- They are NEVER included in user objects
- Only accessible by the key owner

### 2. **Firestore Security Rules**
```javascript
match /apiKeys/{keyId} {
  // Only the owner can read their own keys
  allow read, update, delete: if request.auth != null && 
    request.auth.uid == resource.data.userId;
}
```

### 3. **Key Features**
- Only one active key per user
- Old keys are deactivated when new ones are generated
- Usage tracking (last used, count)
- Keys are masked in the UI (only last 4 chars visible)

## Security Guarantees

1. **User Profile Sharing is Safe**
   - When users view other profiles, they see data from the `users` collection
   - API keys are in the `apiKeys` collection and never exposed
   - No cross-references between collections

2. **API Endpoint Security**
   - Keys are validated on each request
   - Invalid keys are rejected
   - Usage is tracked for audit purposes

3. **Client-Side Security**
   - Keys are masked by default in the UI
   - Full key only visible when explicitly revealed
   - Clipboard access for secure copying

## Best Practices for Users

1. **Treat API Keys Like Passwords**
   - Never share your API key
   - Don't commit keys to version control
   - Use environment variables in shortcuts

2. **Rotate Keys Regularly**
   - Generate new keys periodically
   - Old keys are automatically deactivated
   - Update your shortcuts with new keys

3. **Monitor Usage**
   - Check last used timestamps
   - Review usage counts
   - Report suspicious activity

## Implementation Details

### Database Schema
```typescript
interface ApiKey {
  id: string
  key: string           // The actual key
  userId: string        // Owner's ID
  name: string          // Friendly name
  active: boolean       // Is it active?
  createdAt: Timestamp  // When created
  lastUsed?: Timestamp  // Last API call
  usageCount?: number   // Total uses
}
```

### Key Generation
- Format: `nvk_{timestamp}_{random}`
- Cryptographically random suffix
- Timestamp for uniqueness
- Prefix for easy identification

### Validation Flow
1. Client sends key in `x-api-key` header
2. API validates against Firestore
3. Checks if key is active
4. Updates usage stats
5. Processes request with user context

## Future Enhancements

1. **Key Scoping**
   - Read-only vs write permissions
   - Specific endpoint access
   - Rate limiting per key

2. **Advanced Security**
   - IP whitelisting
   - Time-based expiration
   - Anomaly detection

3. **Audit Logging**
   - Detailed usage logs
   - Failed attempt tracking
   - Security alerts