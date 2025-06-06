#!/usr/bin/env node

import { 
  updateRemoteConfigParameter, 
  createRolloutParameter 
} from '../lib/firebase/remote-config-server'

async function setupRemoteConfig() {
  console.log('Setting up Firebase Remote Config parameters...')
  
  try {
    // Feature flags
    await updateRemoteConfigParameter(
      'feature_trip_sharing',
      false,
      'Enable trip sharing functionality'
    )
    
    await updateRemoteConfigParameter(
      'feature_group_travel',
      false,
      'Enable group travel planning features'
    )
    
    await updateRemoteConfigParameter(
      'feature_ai_itinerary_optimization',
      true,
      'Enable AI-powered itinerary optimization'
    )
    
    await updateRemoteConfigParameter(
      'feature_photo_uploads',
      true,
      'Enable photo upload functionality'
    )
    
    // Configuration values
    await updateRemoteConfigParameter(
      'max_trip_photos',
      50,
      'Maximum number of photos per trip'
    )
    
    await updateRemoteConfigParameter(
      'max_destinations_per_trip',
      10,
      'Maximum destinations allowed per trip'
    )
    
    await updateRemoteConfigParameter(
      'sharing_link_expiry_days',
      30,
      'Default expiration days for share links'
    )
    
    // Create rollout parameters for gradual feature releases
    await createRolloutParameter('trip_sharing', 0, true)
    await createRolloutParameter('group_travel', 0, true)
    
    console.log('✅ Remote Config setup complete!')
  } catch (error) {
    console.error('❌ Error setting up Remote Config:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  setupRemoteConfig()
}

export { setupRemoteConfig }