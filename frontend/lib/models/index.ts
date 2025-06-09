// Export enhanced models with original names for seamless upgrade
export { TripModelEnhanced as TripModel } from './trip-enhanced'
export { UserModel } from './user'
export { ChatModelEnhanced as ChatModel } from './chat-enhanced'
export { MarketplaceModelEnhanced as MarketplaceModel } from './marketplace-enhanced'
export { PackingModel } from './packing'

// Keep original exports available if needed
export { TripModel as TripModelLegacy } from './trip'
export { ChatModel as ChatModelLegacy } from './chat'
export { MarketplaceModel as MarketplaceModelLegacy } from './marketplace'

// Re-export types for convenience
export type * from '@/types/travel'
export type * from './marketplace'