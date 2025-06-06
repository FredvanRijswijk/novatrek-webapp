export interface TripShare {
  id: string
  tripId: string
  ownerId: string
  shareToken: string
  permissions: SharePermissions
  expiresAt: Date | null
  createdAt: Date
  lastAccessedAt?: Date
  accessCount: number
  recipientEmail?: string
  message?: string
}

export type SharePermissions = {
  view: boolean
  comment: boolean
  copy: boolean
  collaborate: boolean
}

export type ShareVisibility = 'public' | 'unlisted' | 'private'

export interface ShareSettings {
  visibility: ShareVisibility
  allowComments: boolean
  allowCopying: boolean
  requireAuth: boolean
  expirationDays?: number
  password?: string
}

export interface ShareAnalytics {
  shareId: string
  views: number
  uniqueViewers: number
  copies: number
  comments: number
  averageTimeSpent: number
  referrers: string[]
}