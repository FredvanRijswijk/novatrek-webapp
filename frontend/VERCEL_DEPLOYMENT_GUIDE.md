# NovaTrek Vercel Deployment Guide

This guide provides step-by-step instructions to deploy NovaTrek to Vercel for external user testing.

## Pre-Deployment Checklist

### Required Accounts
- [ ] Vercel account (free tier works)
- [ ] Firebase project (with Blaze plan for functions)
- [ ] Stripe account (with Connect enabled)
- [ ] Google Cloud account (for Maps & Vertex AI)
- [ ] OpenAI account (for AI features)
- [ ] Resend account (for emails)

### Required API Keys
- [ ] Firebase configuration
- [ ] Firebase Admin SDK service account
- [ ] Google Maps API key
- [ ] Stripe keys (publishable & secret)
- [ ] Stripe webhook secret
- [ ] OpenAI API key
- [ ] Resend API key

## Step 1: Prepare Your Codebase

### 1.1 Update Environment Variables
Copy `.env.local.example` to `.env.local` and fill in all values:

```bash
# Firebase Configuration (from Firebase Console > Project Settings)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Update the app URL to your Vercel domain
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
```

### 1.2 Generate Firebase Admin SDK Base64
```bash
# Download service account key from Firebase Console
# Then convert to base64:
base64 -i path/to/serviceAccountKey.json | tr -d '\n' > firebase-admin-base64.txt
```

### 1.3 Test Build Locally
```bash
npm run build
npm run start
# Visit http://localhost:3000 to verify
```

## Step 2: Deploy to Vercel

### Option A: Using Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
cd frontend
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - Project name? novatrek (or your choice)
# - Directory? ./
# - Build settings? Accept defaults
```

4. Configure environment variables:
```bash
# Add each environment variable
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
# Paste value when prompted
# Select all environments (Production, Preview, Development)

# Repeat for all variables...
```

### Option B: Using GitHub Integration

1. Push code to GitHub repository
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Configure project:
   - Framework Preset: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Install Command: `npm install`

## Step 3: Configure Environment Variables in Vercel

Go to your project settings in Vercel Dashboard > Settings > Environment Variables

Add all variables from `.env.local.example`:

### Critical Variables
```
# Must update for production:
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe after configuring webhook)
```

### All Required Variables
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
FIREBASE_ADMIN_PRIVATE_KEY_BASE64
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
NEXT_PUBLIC_APP_URL
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
NEXT_PUBLIC_STRIPE_PRICE_BASIC_MONTHLY
NEXT_PUBLIC_STRIPE_PRICE_BASIC_YEARLY
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY
OPENAI_API_KEY
RESEND_API_KEY
GOOGLE_VERTEX_PROJECT
NEXT_PUBLIC_ENABLE_STRIPE_V2_NEW
```

## Step 4: Configure External Services

### 4.1 Firebase Setup

1. **Enable Authentication Providers**:
   - Go to Firebase Console > Authentication > Sign-in method
   - Enable Email/Password
   - Enable Google (configure OAuth consent screen)

2. **Add Authorized Domains**:
   - Authentication > Settings > Authorized domains
   - Add: `your-app-name.vercel.app`
   - Add: `*.vercel.app` (for preview deployments)

3. **Deploy Firestore Rules**:
```bash
cd frontend
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

4. **Enable Required APIs**:
   - Go to Google Cloud Console
   - Enable: Vertex AI API (if using)
   - Enable: Places API (new)

### 4.2 Stripe Configuration

1. **Create Products** (if not already done):
   - Go to Stripe Dashboard > Products
   - Create "Basic" and "Pro" subscription products
   - Copy price IDs to environment variables

2. **Configure Webhook**:
   - Go to Stripe Dashboard > Developers > Webhooks
   - Add endpoint: `https://your-app-name.vercel.app/api/webhooks/stripe`
   - Select events:
     - `customer.subscription.*`
     - `invoice.*`
     - `payment_intent.*`
     - `account.*`
     - `capability.updated`
     - `payout.*`
     - `transfer.*`
   - Copy signing secret to `STRIPE_WEBHOOK_SECRET`

3. **Enable Stripe Connect**:
   - Go to Connect settings
   - Complete platform profile
   - Set up branding

### 4.3 Google Maps Configuration

1. **Restrict API Key**:
   - Go to Google Cloud Console > APIs & Services > Credentials
   - Edit your Maps API key
   - Add HTTP referrer restriction: `*.vercel.app/*`
   - Add your custom domain if you have one

### 4.4 Resend Configuration

1. **Verify Domain** (optional but recommended):
   - Add your domain to Resend
   - Configure DNS records
   - Use verified domain for better deliverability

## Step 5: Post-Deployment Configuration

### 5.1 Redeploy with Environment Variables
After adding all environment variables:
```bash
vercel --prod
```

Or trigger redeployment from Vercel Dashboard.

### 5.2 Test Critical Functions

1. **Authentication**:
   - Sign up with email
   - Login/logout
   - Password reset

2. **Payments**:
   - Subscribe to a plan
   - Cancel subscription
   - View billing portal

3. **Core Features**:
   - Create a trip
   - Use AI chat
   - Save to travel inbox

### 5.3 Set Up Monitoring

1. **Enable Vercel Analytics**:
   - Go to project settings
   - Enable Web Analytics
   - Enable Speed Insights

2. **Check Function Logs**:
   - Vercel Dashboard > Functions tab
   - Monitor for errors

## Step 6: Domain Configuration (Optional)

### Custom Domain Setup
1. Go to Vercel Dashboard > Settings > Domains
2. Add your domain
3. Configure DNS as instructed
4. Update `NEXT_PUBLIC_APP_URL` environment variable
5. Redeploy

## Troubleshooting Common Issues

### "Firebase Admin SDK initialization failed"
- Verify `FIREBASE_ADMIN_PRIVATE_KEY_BASE64` is correctly encoded
- Check it includes the full JSON content

### "Stripe webhook error"
- Ensure webhook secret matches exactly
- Verify endpoint URL is correct
- Check Stripe webhook logs

### "Google Maps not loading"
- Verify API key restrictions
- Ensure billing is enabled on Google Cloud
- Check browser console for specific errors

### "Email not sending"
- Verify Resend API key
- Check Resend dashboard for logs
- Ensure from address is verified

### Build Failures
- Check build logs in Vercel
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

## Testing Guide for External Users

### Share Testing Instructions
Provide testers with:

1. **App URL**: `https://your-app-name.vercel.app`

2. **Test Accounts** (optional):
   - Create test accounts with different subscription levels
   - Provide test credit cards (Stripe test mode)

3. **Key Features to Test**:
   - Sign up and profile creation
   - Trip planning workflow
   - AI chat interactions
   - Travel inbox functionality
   - Subscription upgrade
   - Expert marketplace browsing

4. **Feedback Collection**:
   - Set up a feedback form
   - Create a Discord/Slack channel
   - Use GitHub issues for bug reports

## Production Readiness

Before launching to real users:

1. **Switch to Production Mode**:
   - Use production Stripe keys
   - Disable test mode
   - Update webhook secrets

2. **Legal Requirements**:
   - Add Terms of Service
   - Add Privacy Policy
   - GDPR compliance setup

3. **Performance Optimization**:
   - Enable Vercel Edge Functions
   - Set up CDN for images
   - Optimize bundle size

4. **Security Hardening**:
   - Review all API endpoints
   - Audit Firestore rules
   - Enable rate limiting

## Support Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Firebase Hosting**: https://firebase.google.com/docs/hosting
- **Stripe Testing**: https://stripe.com/docs/testing

## Quick Deploy Script

Save this as `deploy.sh`:

```bash
#!/bin/bash
echo "Deploying NovaTrek to Vercel..."

# Build check
npm run build || { echo "Build failed"; exit 1; }

# Deploy
vercel --prod

echo "Deployment complete!"
echo "Don't forget to:"
echo "1. Update Stripe webhook URL"
echo "2. Add domain to Firebase Auth"
echo "3. Test critical paths"
```

Make executable: `chmod +x deploy.sh`

Run: `./deploy.sh`

---

With this guide, you should be able to deploy NovaTrek to Vercel within 30-60 minutes. The platform will be ready for external testing with all core features functional.