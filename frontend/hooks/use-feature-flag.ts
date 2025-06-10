import { useState, useEffect } from 'react'
import { useFirebase } from '@/lib/firebase/context'
import { 
  initializeRemoteConfig, 
  isFeatureEnabled, 
  shouldShowFeature,
  getFeatureFlags,
  type FeatureFlags 
} from '@/lib/firebase/remote-config'

// Hook to check if a single feature is enabled
export function useFeatureFlag(feature: keyof FeatureFlags): boolean {
  const [enabled, setEnabled] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const { user } = useFirebase()

  useEffect(() => {
    async function init() {
      if (!initialized) {
        console.log('Initializing Remote Config...')
        await initializeRemoteConfig()
        setInitialized(true)
      }
      
      // Check basic feature flag
      const isEnabled = isFeatureEnabled(feature)
      console.log(`Feature ${feature} enabled:`, isEnabled)
      
      // For now, just use the feature flag without rollout percentage
      // To enable rollout, set rollout_trip_sharing_percentage in Firebase Console
      setEnabled(isEnabled)
      
      // Uncomment below to use rollout percentage:
      // if (isEnabled && user) {
      //   const shouldShow = shouldShowFeature(feature, user.uid)
      //   console.log(`Feature ${feature} should show for user:`, shouldShow)
      //   setEnabled(shouldShow)
      // } else {
      //   setEnabled(isEnabled)
      // }
    }

    init()
  }, [feature, user, initialized])

  return enabled
}

// Hook to get all feature flags
export function useFeatureFlags(): FeatureFlags & { loading: boolean } {
  const [flags, setFlags] = useState<FeatureFlags>({
    tripSharing: false,
    groupTravel: false,
    aiItineraryOptimization: true,
    photoUploads: true,
    investorsPage: false,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      await initializeRemoteConfig()
      const currentFlags = getFeatureFlags()
      setFlags(currentFlags)
      setLoading(false)
    }

    init()
  }, [])

  return { ...flags, loading }
}

// Hook for A/B testing with variants
export function useABTest<T extends string>(
  testName: string, 
  variants: T[]
): { variant: T | null; loading: boolean } {
  const [variant, setVariant] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useFirebase()

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    // Simple variant assignment based on user ID hash
    const hash = user.uid.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0)
    }, 0)
    
    const variantIndex = Math.abs(hash) % variants.length
    setVariant(variants[variantIndex])
    setLoading(false)
  }, [user, testName, variants])

  return { variant, loading }
}

// Hook to track feature usage
export function useFeatureTracking(feature: string) {
  const { user } = useFirebase()
  
  const trackUsage = (action: string, properties?: Record<string, any>) => {
    if (!user) return
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Feature Usage:', {
        feature,
        action,
        userId: user.uid,
        timestamp: new Date().toISOString(),
        ...properties
      })
    }
    
    // In production, this would send to analytics
    // Example: analytics.track('feature_used', { feature, action, ...properties })
  }
  
  return { trackUsage }
}