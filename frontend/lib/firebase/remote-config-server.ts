import { getRemoteConfig } from 'firebase-admin/remote-config'
import { getApps, initializeApp, cert } from 'firebase-admin/app'

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  
  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson)
      initializeApp({
        credential: cert(serviceAccount),
      })
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error)
    }
  }
}

// Server-side feature flag evaluation
export interface ServerFeatureFlags {
  tripSharing: boolean
  groupTravel: boolean
  aiItineraryOptimization: boolean
  photoUploads: boolean
}

// Get the Remote Config template
export async function getServerRemoteConfig() {
  try {
    const template = await getRemoteConfig().getTemplate()
    return template.parameters
  } catch (error) {
    console.error('Failed to get remote config template:', error)
    return null
  }
}

// Evaluate feature flags on the server
export async function getServerFeatureFlags(): Promise<ServerFeatureFlags> {
  const parameters = await getServerRemoteConfig()
  
  if (!parameters) {
    // Return defaults if unable to fetch
    return {
      tripSharing: false,
      groupTravel: false,
      aiItineraryOptimization: true,
      photoUploads: true,
    }
  }
  
  return {
    tripSharing: parameters.feature_trip_sharing?.defaultValue?.value === 'true',
    groupTravel: parameters.feature_group_travel?.defaultValue?.value === 'true',
    aiItineraryOptimization: parameters.feature_ai_itinerary_optimization?.defaultValue?.value === 'true',
    photoUploads: parameters.feature_photo_uploads?.defaultValue?.value === 'true',
  }
}

// Server-side rollout evaluation with conditions
export async function evaluateFeatureForUser(
  feature: string, 
  userId: string,
  userProperties?: Record<string, any>
): Promise<boolean> {
  const parameters = await getServerRemoteConfig()
  if (!parameters) return false
  
  const featureParam = parameters[`feature_${feature}`]
  if (!featureParam) return false
  
  // Check if feature has conditional values
  if (featureParam.conditionalValues) {
    for (const condition of featureParam.conditionalValues) {
      // Evaluate conditions based on user properties
      // This is a simplified example - you'd implement full condition evaluation
      if (evaluateCondition(condition.condition, userId, userProperties)) {
        return condition.value?.value === 'true'
      }
    }
  }
  
  // Fall back to default value
  return featureParam.defaultValue?.value === 'true'
}

// Simple condition evaluator (extend as needed)
function evaluateCondition(
  conditionName: string, 
  userId: string,
  userProperties?: Record<string, any>
): boolean {
  // Example conditions:
  // - User segment (beta testers, premium users, etc.)
  // - Geographic region
  // - App version
  // - Custom user properties
  
  switch (conditionName) {
    case 'beta_testers':
      return userProperties?.isBetaTester === true
    case 'premium_users':
      return userProperties?.subscriptionTier === 'premium'
    case 'percentage_rollout':
      // Use consistent hashing for percentage rollouts
      const hash = userId.split('').reduce((acc, char) => {
        return ((acc << 5) - acc) + char.charCodeAt(0)
      }, 0)
      const percentage = userProperties?.rolloutPercentage || 0
      return (Math.abs(hash) % 100) < percentage
    default:
      return false
  }
}

// Create or update a parameter
export async function updateRemoteConfigParameter(
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
    console.log(`Updated parameter: ${parameterKey}`)
  } catch (error) {
    console.error('Failed to update parameter:', error)
    throw error
  }
}

// Create a conditional parameter with rollout
export async function createRolloutParameter(
  featureName: string,
  rolloutPercentage: number,
  betaTestersEnabled: boolean = true
) {
  try {
    const template = await getRemoteConfig().getTemplate()
    
    // Create conditions if they don't exist
    if (!template.conditions.find(c => c.name === 'beta_testers')) {
      template.conditions.push({
        name: 'beta_testers',
        expression: 'app.userProperty.isBetaTester == "true"',
        tagColor: 'BLUE' as const,
      })
    }
    
    // Create the feature parameter with conditions
    template.parameters[`feature_${featureName}`] = {
      defaultValue: { value: 'false' },
      description: `Feature flag for ${featureName}`,
      valueType: 'STRING' as const,
      conditionalValues: betaTestersEnabled ? {
        'beta_testers': { value: 'true' }
      } : undefined
    }
    
    // Create rollout percentage parameter
    template.parameters[`rollout_${featureName}_percentage`] = {
      defaultValue: { value: String(rolloutPercentage) },
      description: `Rollout percentage for ${featureName}`,
      valueType: 'NUMBER' as const,
    }
    
    await getRemoteConfig().publishTemplate(template)
    console.log(`Created rollout parameter for feature: ${featureName}`)
  } catch (error) {
    console.error('Failed to create rollout parameter:', error)
    throw error
  }
}