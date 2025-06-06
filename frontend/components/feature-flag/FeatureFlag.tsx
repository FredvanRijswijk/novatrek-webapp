'use client'

import { ReactNode } from 'react'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import type { FeatureFlags } from '@/lib/firebase/remote-config'

interface FeatureFlagProps {
  feature: keyof FeatureFlags
  children: ReactNode
  fallback?: ReactNode
}

export function FeatureFlag({ feature, children, fallback = null }: FeatureFlagProps) {
  const isEnabled = useFeatureFlag(feature)
  
  return isEnabled ? <>{children}</> : <>{fallback}</>
}

// HOC for feature-gated components
export function withFeatureFlag<P extends object>(
  Component: React.ComponentType<P>,
  feature: keyof FeatureFlags,
  FallbackComponent?: React.ComponentType<P>
) {
  return function FeatureFlaggedComponent(props: P) {
    const isEnabled = useFeatureFlag(feature)
    
    if (!isEnabled) {
      return FallbackComponent ? <FallbackComponent {...props} /> : null
    }
    
    return <Component {...props} />
  }
}