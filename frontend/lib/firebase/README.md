# Firebase Setup

This directory contains the Firebase configuration and utilities for the application.

## Environment Setup

1. Copy `.env.local.example` to `.env.local`
2. Fill in your Firebase project credentials for both development and production environments

### Environment Variables

```bash
# Set environment (dev/prod)
NEXT_PUBLIC_FIREBASE_ENV=dev

# Development Firebase Config
NEXT_PUBLIC_FIREBASE_DEV_API_KEY=your_dev_api_key
NEXT_PUBLIC_FIREBASE_DEV_AUTH_DOMAIN=your-dev-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DEV_PROJECT_ID=your-dev-project
NEXT_PUBLIC_FIREBASE_DEV_STORAGE_BUCKET=your-dev-project.appspot.com
NEXT_PUBLIC_FIREBASE_DEV_MESSAGING_SENDER_ID=your_dev_sender_id
NEXT_PUBLIC_FIREBASE_DEV_APP_ID=your_dev_app_id
NEXT_PUBLIC_FIREBASE_DEV_MEASUREMENT_ID=G-XXXXXXXXXX

# Production Firebase Config
NEXT_PUBLIC_FIREBASE_PROD_API_KEY=your_prod_api_key
NEXT_PUBLIC_FIREBASE_PROD_AUTH_DOMAIN=your-prod-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROD_PROJECT_ID=your-prod-project
NEXT_PUBLIC_FIREBASE_PROD_STORAGE_BUCKET=your-prod-project.appspot.com
NEXT_PUBLIC_FIREBASE_PROD_MESSAGING_SENDER_ID=your_prod_sender_id
NEXT_PUBLIC_FIREBASE_PROD_APP_ID=your_prod_app_id
NEXT_PUBLIC_FIREBASE_PROD_MEASUREMENT_ID=G-YYYYYYYYYY
```

## Usage

### 1. Wrap your app with FirebaseProvider

```tsx
// app/layout.tsx
import { FirebaseProvider } from '@/lib/firebase'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <FirebaseProvider>
          {children}
        </FirebaseProvider>
      </body>
    </html>
  )
}
```

### 2. Use Firebase in components

```tsx
// components/AuthButton.tsx
import { useFirebase, signInWithGoogle, signOutUser } from '@/lib/firebase'

export default function AuthButton() {
  const { user, loading, isAuthenticated } = useFirebase()

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.displayName || user?.email}</p>
          <button onClick={signOutUser}>Sign Out</button>
        </div>
      ) : (
        <button onClick={signInWithGoogle}>Sign In with Google</button>
      )}
    </div>
  )
}
```

### 3. Firestore Operations

```tsx
import { 
  createDocument, 
  getDocument, 
  updateDocument, 
  subscribeToCollection 
} from '@/lib/firebase'

// Create a document
await createDocument('posts', {
  title: 'Hello World',
  content: 'This is my first post',
  author: user.uid
})

// Get a document
const post = await getDocument('posts', 'post-id')

// Update a document
await updateDocument('posts', 'post-id', {
  title: 'Updated Title'
})

// Subscribe to real-time updates
const unsubscribe = subscribeToCollection(
  'posts',
  (posts) => setPosts(posts),
  where('author', '==', user.uid),
  orderBy('createdAt', 'desc')
)
```

## Environment Switching

The configuration automatically switches between dev and prod based on:
1. `NEXT_PUBLIC_FIREBASE_ENV` environment variable
2. `NODE_ENV` (production uses prod config)

To force production config in development:
```bash
NEXT_PUBLIC_FIREBASE_ENV=prod
```

## Security Rules

Make sure to configure proper Firestore security rules for both environments:

```javascript
// Basic rules example
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own documents
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public read, authenticated write for posts
    match /posts/{postId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```