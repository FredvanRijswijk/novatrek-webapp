# Firebase Storage Setup Guide

## Current Issue
The Firebase Storage rules need to be deployed to allow users to upload and access trip photos. The error "User does not have permission to access 'trips/..." indicates that the Storage security rules haven't been configured.

## Quick Fix (Temporary)
To quickly resolve this issue during development:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (novatrek-app)
3. Navigate to **Storage** in the left sidebar
4. Click on the **Rules** tab
5. Replace the default rules with these temporary development rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Temporary: Allow read/write for all authenticated users
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

6. Click **Publish**

## Production Rules (Recommended)
For production, use the comprehensive rules in `storage.rules`:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    
    // Trip photos - users can only access their own trips
    match /trips/{tripId}/{allPaths=**} {
      allow read: if isAuthenticated() && 
        firestore.get(/databases/(default)/documents/trips/$(tripId)).data.userRef == /databases/(default)/documents/users/$(request.auth.uid);
      allow write: if isAuthenticated() && 
        firestore.get(/databases/(default)/documents/trips/$(tripId)).data.userRef == /databases/(default)/documents/users/$(request.auth.uid);
    }
    
    // User profile photos
    match /users/{userId}/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }
    
    // Default deny
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## Deployment via CLI
Once the Storage bucket is properly initialized:

```bash
# Deploy storage rules
firebase deploy --only storage:rules

# Or deploy everything
firebase deploy
```

## Storage Structure
The app uses the following storage structure:
- `/trips/{tripId}/photos/` - Trip photos
- `/users/{userId}/avatar/` - User profile pictures
- `/marketplace/experts/{expertId}/` - Expert profile images
- `/marketplace/products/{productId}/` - Product images
- `/temp/{userId}/` - Temporary uploads (auto-cleaned)

## Troubleshooting

### "storage/unauthorized" Error
This means the security rules are blocking access. Check:
1. User is authenticated
2. User owns the resource they're trying to access
3. Rules are properly deployed

### "Could not find rules" Error
This happens when:
1. Storage hasn't been initialized for the project
2. The storage bucket name in firebase.json doesn't match the project
3. The project needs to be re-initialized with `firebase init storage`

### Rate Limiting
If you see "Quota exceeded" errors:
1. Wait a few minutes before retrying
2. Use `firebase deploy --only storage:rules` instead of full deploy
3. Check Firebase Console for API usage limits