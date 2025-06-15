import { TripMembersModel } from '@/lib/models/trip-members'
import { Trip, MemberRole } from '@/types/travel'
import { TripV2 } from '@/types/travel-v2'

export class TripPermissions {
  /**
   * Check if a user can view a trip
   */
  static async canView(trip: Trip | TripV2, userId: string): Promise<boolean> {
    // Owner can always view
    if (trip.userId === userId) return true
    
    // For group/family/business trips, check membership
    if (trip.travelMode && ['group', 'family', 'business'].includes(trip.travelMode)) {
      return await TripMembersModel.isMember(trip.id, userId)
    }
    
    // For solo/couple trips, only owner can view
    return false
  }

  /**
   * Check if a user can edit a trip
   */
  static async canEdit(trip: Trip | TripV2, userId: string): Promise<boolean> {
    // Owner can always edit
    if (trip.userId === userId) return true
    
    // For group/family/business trips, check permissions
    if (trip.travelMode && ['group', 'family', 'business'].includes(trip.travelMode)) {
      return await TripMembersModel.hasPermission(trip.id, userId, 'canEdit')
    }
    
    return false
  }

  /**
   * Check if a user can delete a trip
   */
  static async canDelete(trip: Trip | TripV2, userId: string): Promise<boolean> {
    // Only owner can delete
    if (trip.userId === userId) return true
    
    // For group trips, check if user has delete permission
    if (trip.travelMode && ['group', 'family', 'business'].includes(trip.travelMode)) {
      return await TripMembersModel.hasPermission(trip.id, userId, 'canDelete')
    }
    
    return false
  }

  /**
   * Check if a user can invite others to a trip
   */
  static async canInvite(trip: Trip | TripV2, userId: string): Promise<boolean> {
    // Solo and couple trips cannot have invitations
    if (!trip.travelMode || ['solo', 'couple'].includes(trip.travelMode)) {
      return false
    }
    
    // Owner can always invite
    if (trip.userId === userId) return true
    
    // Check member permissions
    return await TripMembersModel.hasPermission(trip.id, userId, 'canInvite')
  }

  /**
   * Check if a user can manage members of a trip
   */
  static async canManageMembers(trip: Trip | TripV2, userId: string): Promise<boolean> {
    // Solo and couple trips don't have member management
    if (!trip.travelMode || ['solo', 'couple'].includes(trip.travelMode)) {
      return false
    }
    
    // Owner can always manage members
    if (trip.userId === userId) return true
    
    // Check member permissions
    return await TripMembersModel.hasPermission(trip.id, userId, 'canManageMembers')
  }

  /**
   * Check if a user can view/manage budget
   */
  static async canViewBudget(trip: Trip | TripV2, userId: string): Promise<boolean> {
    // Owner can always view budget
    if (trip.userId === userId) return true
    
    // For group trips, check budget visibility settings
    if (trip.travelMode && ['group', 'family', 'business'].includes(trip.travelMode)) {
      const role = await TripMembersModel.getUserRole(trip.id, userId)
      if (!role) return false
      
      // Check group settings for budget visibility
      const budgetVisibility = trip.groupSettings?.budgetVisibility || 'all'
      
      switch (budgetVisibility) {
        case 'all':
          return true
        case 'organizers':
          return ['owner', 'organizer'].includes(role)
        case 'owner':
          return role === 'owner'
        default:
          return false
      }
    }
    
    return false
  }

  /**
   * Get all permissions for a user on a trip
   */
  static async getUserPermissions(trip: Trip | TripV2, userId: string) {
    const isOwner = trip.userId === userId
    
    // For solo/couple trips, only owner has permissions
    if (!trip.travelMode || ['solo', 'couple'].includes(trip.travelMode)) {
      return {
        canView: isOwner,
        canEdit: isOwner,
        canDelete: isOwner,
        canInvite: false,
        canManageMembers: false,
        canViewBudget: isOwner,
        canManageBudget: isOwner,
        role: isOwner ? 'owner' as MemberRole : null
      }
    }
    
    // For group/family/business trips
    const role = await TripMembersModel.getUserRole(trip.id, userId)
    
    if (!role && !isOwner) {
      return {
        canView: false,
        canEdit: false,
        canDelete: false,
        canInvite: false,
        canManageMembers: false,
        canViewBudget: false,
        canManageBudget: false,
        role: null
      }
    }
    
    return {
      canView: await this.canView(trip, userId),
      canEdit: await this.canEdit(trip, userId),
      canDelete: await this.canDelete(trip, userId),
      canInvite: await this.canInvite(trip, userId),
      canManageMembers: await this.canManageMembers(trip, userId),
      canViewBudget: await this.canViewBudget(trip, userId),
      canManageBudget: await TripMembersModel.hasPermission(trip.id, userId, 'canManageBudget'),
      role: role || (isOwner ? 'owner' as MemberRole : null)
    }
  }
}