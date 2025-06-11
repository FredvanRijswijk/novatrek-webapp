/**
 * Feature flags for controlling feature rollout
 */

export const FEATURE_FLAGS = {
  // Stripe Connect v2 rollout
  STRIPE_CONNECT_V2: {
    // Enable v2 for new expert accounts
    NEW_ACCOUNTS: process.env.NEXT_PUBLIC_ENABLE_STRIPE_V2_NEW === 'true' || false,
    
    // Enable v2 migration for existing accounts
    MIGRATION: process.env.NEXT_PUBLIC_ENABLE_STRIPE_V2_MIGRATION === 'true' || false,
    
    // Force v2 for specific user IDs (for testing)
    FORCE_USER_IDS: process.env.NEXT_PUBLIC_STRIPE_V2_TEST_USERS?.split(',') || [],
  },
  
  // Other feature flags can be added here
  GROUP_TRAVEL: process.env.NEXT_PUBLIC_ENABLE_GROUP_TRAVEL === 'true' || false,
  AI_CHAT_ENHANCED: process.env.NEXT_PUBLIC_ENABLE_AI_CHAT_ENHANCED === 'true' || false,
  AI_CHAT_V2: process.env.NEXT_PUBLIC_ENABLE_AI_CHAT_V2 === 'true' || false,
}

/**
 * Check if Stripe Connect v2 should be used for a specific user
 */
export function shouldUseStripeV2(userId?: string, isNewAccount: boolean = false): boolean {
  // Check if user is in force list
  if (userId && FEATURE_FLAGS.STRIPE_CONNECT_V2.FORCE_USER_IDS.includes(userId)) {
    return true
  }
  
  // Check if v2 is enabled for new accounts
  if (isNewAccount && FEATURE_FLAGS.STRIPE_CONNECT_V2.NEW_ACCOUNTS) {
    return true
  }
  
  // Check if migration is enabled for existing accounts
  if (!isNewAccount && FEATURE_FLAGS.STRIPE_CONNECT_V2.MIGRATION) {
    return true
  }
  
  return false
}

/**
 * Get feature flag status for debugging
 */
export function getFeatureFlagStatus(): Record<string, any> {
  return {
    stripeConnectV2: {
      newAccounts: FEATURE_FLAGS.STRIPE_CONNECT_V2.NEW_ACCOUNTS,
      migration: FEATURE_FLAGS.STRIPE_CONNECT_V2.MIGRATION,
      testUsers: FEATURE_FLAGS.STRIPE_CONNECT_V2.FORCE_USER_IDS,
    },
    groupTravel: FEATURE_FLAGS.GROUP_TRAVEL,
    aiChatEnhanced: FEATURE_FLAGS.AI_CHAT_ENHANCED,
    aiChatV2: FEATURE_FLAGS.AI_CHAT_V2,
  }
}