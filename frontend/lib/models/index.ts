// Export enhanced models with original names for seamless upgrade
export { TripModelEnhanced as TripModel } from './trip-enhanced'
export { UserModel } from './user'
export { ChatModelEnhanced as ChatModel } from './chat-enhanced'
export { MarketplaceModelEnhanced as MarketplaceModel } from './marketplace-enhanced'
export { PackingModelEnhanced as PackingModel } from './packing-enhanced'
export { CaptureModelEnhanced as CaptureModel } from './capture-enhanced'
export { TravelSegmentModel } from './travel-segment'

// Keep original exports available if needed
export { TripModel as TripModelLegacy } from './trip'
export { ChatModel as ChatModelLegacy } from './chat'
export { MarketplaceModel as MarketplaceModelLegacy } from './marketplace'
export { PackingModel as PackingModelLegacy } from './packing'

// Re-export types for convenience
export type * from '@/types/travel'
export type * from './marketplace'
export type * from './capture'
export type * from './capture-enhanced'