import { 
  createDocument, 
  updateDocument, 
  getDocument, 
  getCollection, 
  deleteDocument,
  where,
  orderBy
} from '@/lib/firebase'
import { TripMember, MemberRole } from '@/types/travel'
import { cleanFirestoreData, convertTimestampsToDates } from '@/lib/utils/firebase-helpers'

export class TripMembersModel {
  static readonly COLLECTION = 'tripMembers'

  // Create a new trip member
  static async addMember(
    tripId: string, 
    memberData: Omit<TripMember, 'joinedAt' | 'permissions'>
  ): Promise<string> {
    // Set permissions based on role
    const permissions = this.getPermissionsForRole(memberData.role)
    
    const cleanedData = cleanFirestoreData({
      ...memberData,
      tripId,
      permissions,
      joinedAt: new Date()
    })
    
    // Use composite ID for easy lookup: tripId_userId
    const memberId = memberData.userId ? `${tripId}_${memberData.userId}` : `${tripId}_invite_${Date.now()}`
    const docRef = await createDocument(this.COLLECTION, cleanedData, memberId)
    return docRef.id
  }

  // Get all members for a trip
  static async getTripMembers(tripId: string): Promise<TripMember[]> {
    const members = await getCollection<TripMember>(
      this.COLLECTION,
      where('tripId', '==', tripId),
      orderBy('joinedAt', 'asc')
    )
    return members.map(member => convertTimestampsToDates(member))
  }

  // Get a specific member
  static async getMemberById(memberId: string): Promise<TripMember | null> {
    const member = await getDocument<TripMember>(this.COLLECTION, memberId)
    return member ? convertTimestampsToDates(member) : null
  }

  // Update member role
  static async updateMemberRole(memberId: string, newRole: MemberRole): Promise<void> {
    const permissions = this.getPermissionsForRole(newRole)
    await updateDocument(this.COLLECTION, memberId, {
      role: newRole,
      permissions
    })
  }

  // Remove member from trip
  static async removeMember(memberId: string): Promise<void> {
    await updateDocument(this.COLLECTION, memberId, {
      status: 'removed'
    })
  }

  // Check if user is a member of a trip
  static async isMember(tripId: string, userId: string): Promise<boolean> {
    const members = await getCollection<TripMember>(
      this.COLLECTION,
      where('tripId', '==', tripId),
      where('userId', '==', userId),
      where('status', '==', 'active')
    )
    return members.length > 0
  }

  // Get user's role in a trip
  static async getUserRole(tripId: string, userId: string): Promise<MemberRole | null> {
    const members = await getCollection<TripMember>(
      this.COLLECTION,
      where('tripId', '==', tripId),
      where('userId', '==', userId),
      where('status', '==', 'active')
    )
    return members.length > 0 ? members[0].role : null
  }

  // Helper: Get permissions for a role
  static getPermissionsForRole(role: MemberRole) {
    switch (role) {
      case 'owner':
        return {
          canEdit: true,
          canInvite: true,
          canDelete: true,
          canManageMembers: true,
          canManageBudget: true
        }
      case 'organizer':
        return {
          canEdit: true,
          canInvite: true,
          canDelete: false,
          canManageMembers: true,
          canManageBudget: true
        }
      case 'member':
        return {
          canEdit: true,
          canInvite: false,
          canDelete: false,
          canManageMembers: false,
          canManageBudget: false
        }
      case 'viewer':
        return {
          canEdit: false,
          canInvite: false,
          canDelete: false,
          canManageMembers: false,
          canManageBudget: false
        }
    }
  }

  // Check if user has specific permission
  static async hasPermission(
    tripId: string, 
    userId: string, 
    permission: keyof TripMember['permissions']
  ): Promise<boolean> {
    const members = await getCollection<TripMember>(
      this.COLLECTION,
      where('tripId', '==', tripId),
      where('userId', '==', userId),
      where('status', '==', 'active')
    )
    
    if (members.length === 0) return false
    return members[0].permissions[permission]
  }

  // Invite a new member
  static async inviteMember(
    tripId: string,
    invitedBy: string,
    email: string,
    role: MemberRole = 'member'
  ): Promise<string> {
    // This would typically send an invitation email
    // For now, we'll create a pending member entry
    const memberData: Omit<TripMember, 'joinedAt' | 'permissions'> = {
      userId: '', // Will be filled when user accepts
      email,
      displayName: email,
      role,
      invitedBy,
      status: 'invited'
    }
    
    return this.addMember(tripId, memberData)
  }

  // Accept invitation
  static async acceptInvitation(
    invitationId: string,
    userId: string,
    displayName: string,
    photoURL?: string
  ): Promise<void> {
    await updateDocument(this.COLLECTION, invitationId, {
      userId,
      displayName,
      photoURL,
      status: 'active',
      joinedAt: new Date()
    })
  }
}