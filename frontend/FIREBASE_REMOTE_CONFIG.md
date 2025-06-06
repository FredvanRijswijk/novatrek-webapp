# Firebase Remote Config Setup

This guide explains how to set up and use Firebase Remote Config for feature flags and gradual rollouts in NovaTrek.

## Overview

Firebase Remote Config allows you to:
- Control feature visibility without deploying new code
- Gradually roll out features to specific user segments
- A/B test different implementations
- Instantly disable problematic features

## Setup

### 1. Enable Remote Config in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to "Remote Config" in the left sidebar
4. Click "Get Started" if it's your first time

### 2. Set Up Parameters

Run the setup script to create initial parameters:

```bash
npx tsx scripts/setup-remote-config.ts
```

Or manually create these parameters in Firebase Console:

#### Feature Flags
- `feature_trip_sharing` (boolean) - Enable trip sharing functionality
- `feature_group_travel` (boolean) - Enable group travel planning
- `feature_ai_itinerary_optimization` (boolean) - Enable AI itinerary optimization
- `feature_photo_uploads` (boolean) - Enable photo uploads

#### Configuration Values
- `max_trip_photos` (number) - Maximum photos per trip (default: 50)
- `max_destinations_per_trip` (number) - Maximum destinations (default: 10)
- `sharing_link_expiry_days` (number) - Share link expiration (default: 30)

#### Rollout Percentages
- `rollout_trip_sharing_percentage` (number) - Percentage of users who see trip sharing
- `rollout_group_travel_percentage` (number) - Percentage of users who see group travel

### 3. Create Conditions (Optional)

In Firebase Console, create conditions for targeted rollouts:

1. **Beta Testers**
   - Name: `beta_testers`
   - Condition: `app.userProperty.isBetaTester == "true"`
   
2. **Premium Users**
   - Name: `premium_users`
   - Condition: `app.userProperty.subscriptionTier == "premium"`

3. **Geographic Targeting**
   - Name: `us_users`
   - Condition: `device.country in ['US']`

## Usage

### Client-Side Feature Flags

```tsx
import { useFeatureFlag } from '@/hooks/use-feature-flag'

function MyComponent() {
  const tripSharingEnabled = useFeatureFlag('tripSharing')
  
  if (!tripSharingEnabled) {
    return null
  }
  
  return <ShareButton />
}
```

### Using FeatureFlag Component

```tsx
import { FeatureFlag } from '@/components/feature-flag/FeatureFlag'

function MyPage() {
  return (
    <div>
      <h1>Trip Planning</h1>
      
      <FeatureFlag feature="tripSharing">
        <ShareTripButton />
      </FeatureFlag>
      
      <FeatureFlag 
        feature="groupTravel" 
        fallback={<p>Group travel coming soon!</p>}
      >
        <GroupTravelSection />
      </FeatureFlag>
    </div>
  )
}
```

### Server-Side Evaluation

```ts
import { getServerFeatureFlags } from '@/lib/firebase/remote-config-server'

export async function GET(request: Request) {
  const flags = await getServerFeatureFlags()
  
  if (!flags.tripSharing) {
    return new Response('Feature not available', { status: 404 })
  }
  
  // Feature is enabled
  return new Response('OK')
}
```

### A/B Testing

```tsx
import { useABTest } from '@/hooks/use-feature-flag'

function ShareButton() {
  const { variant, loading } = useABTest('share_button_style', ['blue', 'green', 'gradient'])
  
  if (loading) return <Skeleton />
  
  const styles = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    gradient: 'bg-gradient-to-r from-blue-500 to-purple-500'
  }
  
  return (
    <Button className={styles[variant || 'blue']}>
      Share Trip
    </Button>
  )
}
```

## Gradual Rollout Strategy

### Phase 1: Internal Testing (0%)
- Set `feature_trip_sharing` to `false` globally
- Enable for specific conditions (beta_testers)

### Phase 2: Limited Beta (10%)
- Set `rollout_trip_sharing_percentage` to `10`
- Monitor usage and feedback

### Phase 3: Expanded Rollout (50%)
- Increase percentage to `50`
- A/B test different implementations

### Phase 4: General Availability (100%)
- Set `feature_trip_sharing` to `true`
- Remove percentage-based rollout

## Best Practices

1. **Naming Convention**
   - Feature flags: `feature_<name>`
   - Config values: `<feature>_<setting>`
   - Rollout percentages: `rollout_<feature>_percentage`

2. **Default Values**
   - Always provide sensible defaults in code
   - Remote Config should enhance, not break functionality

3. **Caching**
   - Client-side: 1 hour minimum fetch interval
   - Server-side: Consider caching for performance

4. **Monitoring**
   - Track feature usage with analytics
   - Monitor error rates when enabling features
   - Set up alerts for critical features

5. **Testing**
   - Test with Remote Config disabled
   - Test with different parameter values
   - Test rollout percentage logic

## Troubleshooting

### Feature not showing up
1. Check if Remote Config is initialized
2. Verify parameter names match exactly
3. Check user meets rollout criteria
4. Clear cache and refresh

### Server-side not working
1. Ensure Firebase Admin SDK is initialized
2. Check service account permissions
3. Verify environment variables are set

### Performance issues
1. Increase fetch interval
2. Implement server-side caching
3. Use static imports for critical features