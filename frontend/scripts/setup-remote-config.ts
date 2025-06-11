#!/usr/bin/env node

import { initializeApp, cert } from 'firebase-admin/app'
import { getRemoteConfig } from 'firebase-admin/remote-config'
import * as path from 'path'
import * as fs from 'fs'

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'novatrek-app-firebase-adminsdk-prod.json')

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Service account file not found at: ${serviceAccountPath}`)
  console.error('Please ensure novatrek-dev-firebase-adminsdk.json is in the frontend directory')
  process.exit(1)
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))

initializeApp({
  credential: cert(serviceAccount),
})

// Helper functions
async function updateRemoteConfigParameter(
  parameterKey: string,
  defaultValue: string | number | boolean,
  description?: string
) {
  try {
    const template = await getRemoteConfig().getTemplate()
    
    template.parameters[parameterKey] = {
      defaultValue: { value: String(defaultValue) },
      description: description,
      valueType: 'STRING' as const,
    }
    
    await getRemoteConfig().publishTemplate(template)
    console.log(`✅ Updated parameter: ${parameterKey}`)
  } catch (error) {
    console.error(`❌ Failed to update parameter ${parameterKey}:`, error)
    throw error
  }
}

async function createRolloutParameter(
  featureName: string,
  rolloutPercentage: number,
  betaTestersEnabled: boolean = true
) {
  try {
    // For now, just create the rollout percentage parameter
    // Conditions require Google Analytics to be set up
    await updateRemoteConfigParameter(
      `rollout_${featureName}_percentage`,
      rolloutPercentage,
      `Rollout percentage for ${featureName}`
    )
    
    console.log(`✅ Created rollout parameter for feature: ${featureName}`)
    console.log(`   Note: To use conditions, link Google Analytics to your Firebase project`)
  } catch (error) {
    console.error(`❌ Failed to create rollout parameter for ${featureName}:`, error)
    throw error
  }
}

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