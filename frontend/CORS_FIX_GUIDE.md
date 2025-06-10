# CORS Fix Guide for www.novatrek.app

## Problem
The Firebase authentication is configured to allow requests from `https://novatrek.app` but we want to use `https://www.novatrek.app` as the primary domain.

## Solutions

### Option 1: Add www domain to Firebase (Required)
1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project (novatrek-app)
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Add `www.novatrek.app` to the list of authorized domains
5. Save the changes

### Option 2: Configure domain redirect in Vercel (Already implemented)
Redirect all traffic from `novatrek.app` to `www.novatrek.app`:

The `vercel.json` file has been updated with:
```json
{
  "redirects": [
    {
      "source": "/:path*",
      "has": [
        {
          "type": "host",
          "value": "novatrek.app"
        }
      ],
      "destination": "https://www.novatrek.app/:path*",
      "permanent": true
    }
  ]
}
```

### Option 3: Update environment variables
If you want to support both domains, update the auth domain in production:

```env
NEXT_PUBLIC_FIREBASE_PROD_AUTH_DOMAIN=novatrek-app.firebaseapp.com
```

This uses Firebase's default auth domain which supports CORS from any authorized domain.

## Verification
After implementing the fix:
1. Clear browser cache
2. Try logging in with Google from both domains
3. Check browser console for CORS errors

## Additional Notes
- The error also shows a 404 for `/forgot-password` route - this page needs to be created
- Firestore is also showing CORS errors which will be fixed by the same solution