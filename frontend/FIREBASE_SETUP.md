# Firebase Console Setup Guide

## 🔐 Authentication Setup

### 1. Enable Authentication Methods

1. Go to **Firebase Console** → **Authentication** → **Sign-in method**
2. Enable the following providers:

#### Email/Password
- Click **Email/Password**
- Enable **Email/Password**
- Save

#### Google
- Click **Google**
- Enable **Google**
- Add your project's support email
- Save

### 2. Authorized Domains
- Go to **Authentication** → **Settings** → **Authorized domains**
- Add your domains:
  - `localhost` (for development)
  - Your production domain

## 🗄️ Firestore Setup

### 1. Create Firestore Database
1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select your preferred location
5. Click **Done**

### 2. Security Rules
1. Go to **Firestore Database** → **Rules**
2. Replace the default rules with the content from `firestore.rules`
3. Click **Publish**

#### Basic Security Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Test documents - users can only access their own
    match /test_documents/{documentId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### 3. Indexes (if needed)
- Firestore will suggest creating indexes when you run complex queries
- Go to **Firestore Database** → **Indexes** to manage them

## 🧪 Testing the Setup

### 1. Start your development server:
```bash
npm run dev
```

### 2. Open http://localhost:3000

### 3. Test Authentication:
- Click **"Sign In with Google"**
- Complete the Google OAuth flow
- You should see your user profile displayed

### 4. Test Firestore:
- After signing in, click **"Create Test Document"**
- You should see the document appear in the list
- Check Firebase Console → Firestore Database to see the document

## 🚀 Production Deployment

### 1. Add Production Domain
- Go to **Authentication** → **Settings** → **Authorized domains**
- Add your production domain (e.g., `yourdomain.com`)

### 2. Update Security Rules
- Review and tighten security rules for production
- Remove test collections if not needed

### 3. Environment Variables
- Set `NEXT_PUBLIC_FIREBASE_ENV=prod` in production
- Configure production Firebase credentials

## 🔍 Troubleshooting

### Common Issues:

1. **"Firebase: Error (auth/unauthorized-domain)"**
   - Add your domain to authorized domains in Firebase Console

2. **"Missing or insufficient permissions"**
   - Check Firestore security rules
   - Ensure user is authenticated

3. **"Firebase App not initialized"**
   - Check environment variables
   - Ensure Firebase config is correct

4. **CORS errors**
   - Check authorized domains
   - Verify API keys are correct

### Debug Tools:
- Chrome DevTools Console
- Firebase Console → Authentication (to see user sign-ins)
- Firebase Console → Firestore Database (to see document operations)

## 📚 Next Steps

1. **Add Email/Password Authentication**
2. **Implement Password Reset**
3. **Add User Profile Management**
4. **Create Custom Security Rules**
5. **Set up Cloud Functions** (if needed)
6. **Configure Firebase Analytics** (optional)

## 🔗 Useful Links

- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)