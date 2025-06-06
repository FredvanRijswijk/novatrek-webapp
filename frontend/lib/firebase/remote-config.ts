import { getRemoteConfig, fetchAndActivate, getValue, isSupported } from 'firebase/remote-config'
import { app } from './config'

// Initialize Remote Config with minimal fetch interval for development
const remoteConfig = typeof window !== 'undefined' && isSupported() ? getRemoteConfig(app) : null

if (remoteConfig) {
  // Set minimal fetch interval for development (production should be higher)
  remoteConfig.settings.minimumFetchIntervalMillis = 3600000 // 1 hour for production
  
  // Set default values
  remoteConfig.defaultConfig = {
    // Feature flags
    feature_trip_sharing: false,
    feature_group_travel: false,
    feature_ai_itinerary_optimization: true,
    feature_photo_uploads: true,
    
    // Configuration values
    max_trip_photos: 50,
    max_destinations_per_trip: 10,
    sharing_link_expiry_days: 30,
    
    // Rollout percentages
    rollout_trip_sharing_percentage: 0,
    rollout_group_travel_percentage: 0,
  }
}

// Feature flag interface
export interface FeatureFlags {
  tripSharing: boolean
  groupTravel: boolean
  aiItineraryOptimization: boolean
  photoUploads: boolean
}

// Configuration interface
export interface RemoteConfiguration {
  maxTripPhotos: number
  maxDestinationsPerTrip: number
  sharingLinkExpiryDays: number
}

// Fetch and activate remote config
export async function initializeRemoteConfig(): Promise<void> {
  if (!remoteConfig) return
  
  try {
    await fetchAndActivate(remoteConfig)
    console.log('Remote config fetched and activated')
  } catch (error) {
    console.error('Failed to fetch remote config:', error)
    // Use default values on error
  }
}

// Get feature flags
export function getFeatureFlags(): FeatureFlags {
  if (!remoteConfig) {
    // Return defaults for SSR
    return {
      tripSharing: false,
      groupTravel: false,
      aiItineraryOptimization: true,
      photoUploads: true,
    }
  }
  
  return {
    tripSharing: getValue(remoteConfig, 'feature_trip_sharing').asBoolean(),
    groupTravel: getValue(remoteConfig, 'feature_group_travel').asBoolean(),
    aiItineraryOptimization: getValue(remoteConfig, 'feature_ai_itinerary_optimization').asBoolean(),
    photoUploads: getValue(remoteConfig, 'feature_photo_uploads').asBoolean(),
  }
}

// Get configuration values
export function getRemoteConfiguration(): RemoteConfiguration {
  if (!remoteConfig) {
    // Return defaults for SSR
    return {
      maxTripPhotos: 50,
      maxDestinationsPerTrip: 10,
      sharingLinkExpiryDays: 30,
    }
  }
  
  return {
    maxTripPhotos: getValue(remoteConfig, 'max_trip_photos').asNumber(),
    maxDestinationsPerTrip: getValue(remoteConfig, 'max_destinations_per_trip').asNumber(),
    sharingLinkExpiryDays: getValue(remoteConfig, 'sharing_link_expiry_days').asNumber(),
  }
}

// Check if a specific feature is enabled
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags()
  return flags[feature]
}

// Get rollout percentage for gradual feature releases
export function getRolloutPercentage(feature: string): number {
  if (!remoteConfig) return 0
  
  const key = `rollout_${feature}_percentage`
  return getValue(remoteConfig, key).asNumber()
}

// Check if user should see feature based on rollout percentage
export function shouldShowFeature(feature: string, userId: string): boolean {
  const percentage = getRolloutPercentage(feature)
  if (percentage === 0) return false
  if (percentage === 100) return true
  
  // Use consistent hashing based on userId to ensure same user always sees same features
  const hash = userId.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0)
  }, 0)
  
  return (Math.abs(hash) % 100) < percentage
}