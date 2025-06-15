'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { Trip, TripMember, MemberRole } from '@/types/travel'
import { TripV2 } from '@/types/travel-v2'
import { TripMembersModel } from '@/lib/models/trip-members'
import { TripPermissions } from '@/lib/permissions/trip-permissions'
import { useFirebase } from '@/lib/firebase/context'
import { 
  UserPlus, 
  MoreVertical, 
  Crown, 
  Shield, 
  User, 
  Eye,
  Mail,
  Trash2,
  ChevronDown,
  Copy,
  Link
} from 'lucide-react'

interface TripMembersProps {
  trip: Trip | TripV2
  onUpdate?: () => void
}

const roleIcons = {
  owner: Crown,
  organizer: Shield,
  member: User,
  viewer: Eye,
}

const roleLabels = {
  owner: 'Owner',
  organizer: 'Organizer',
  member: 'Member',
  viewer: 'Viewer',
}

const roleDescriptions = {
  owner: 'Full control over the trip',
  organizer: 'Can edit and invite others',
  member: 'Can edit trip details',
  viewer: 'View-only access',
}

export function TripMembers({ trip, onUpdate }: TripMembersProps) {
  const { user } = useFirebase()
  const [members, setMembers] = useState<TripMember[]>([])
  const [loading, setLoading] = useState(true)
  const [permissions, setPermissions] = useState<any>(null)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<MemberRole>('member')
  const [inviting, setInviting] = useState(false)

  // Load members and permissions
  useEffect(() => {
    if (!trip || !user) return

    const loadData = async () => {
      try {
        // Get user permissions
        const userPerms = await TripPermissions.getUserPermissions(trip, user.uid)
        setPermissions(userPerms)

        // Load members if user can view them
        if (userPerms.canView) {
          const tripMembers = await TripMembersModel.getTripMembers(trip.id)
          
          // Add the owner if not in members list (for legacy trips)
          const ownerExists = tripMembers.some(m => m.userId === trip.userId)
          if (!ownerExists && trip.userId) {
            // Fetch owner details
            const ownerData: TripMember = {
              userId: trip.userId,
              email: user.uid === trip.userId ? user.email! : 'Owner',
              displayName: user.uid === trip.userId ? user.displayName || user.email! : 'Trip Owner',
              photoURL: user.uid === trip.userId ? user.photoURL : undefined,
              role: 'owner',
              joinedAt: trip.createdAt,
              invitedBy: trip.userId,
              status: 'active',
              permissions: TripMembersModel.getPermissionsForRole('owner')
            }
            setMembers([ownerData, ...tripMembers])
          } else {
            setMembers(tripMembers)
          }
        }
      } catch (error) {
        console.error('Error loading trip members:', error)
        toast.error('Failed to load trip members')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [trip, user, toast])

  const handleInviteMember = async () => {
    if (!inviteEmail || !user) return

    setInviting(true)
    try {
      const memberId = await TripMembersModel.inviteMember(
        trip.id,
        user.uid,
        inviteEmail,
        inviteRole
      )

      // Create invitation link
      const inviteLink = `${window.location.origin}/invitation/${memberId}`
      
      // Copy to clipboard
      await navigator.clipboard.writeText(inviteLink)
      
      toast.success(`Invitation created for ${inviteEmail}`, {
        description: 'Link copied to clipboard!',
        duration: 10000,
      })

      setInviteDialogOpen(false)
      setInviteEmail('')
      setInviteRole('member')

      // Reload members
      const updatedMembers = await TripMembersModel.getTripMembers(trip.id)
      setMembers(updatedMembers)
      onUpdate?.()
    } catch (error) {
      console.error('Error inviting member:', error)
      toast.error('Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  const handleUpdateRole = async (memberId: string, userId: string, newRole: MemberRole) => {
    // Don't allow changing owner role
    if (userId === trip.userId) {
      toast.error('Cannot change the role of the trip owner')
      return
    }

    try {
      await TripMembersModel.updateMemberRole(memberId, newRole)
      
      toast.success('Member role has been updated')

      // Update local state
      setMembers(prev => prev.map(m => 
        m.userId === userId 
          ? { ...m, role: newRole, permissions: TripMembersModel.getPermissionsForRole(newRole) }
          : m
      ))
      onUpdate?.()
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error('Failed to update member role')
    }
  }

  const handleRemoveMember = async (memberId: string, userId: string, displayName: string) => {
    // Don't allow removing owner
    if (userId === trip.userId) {
      toast.error('Cannot remove the trip owner')
      return
    }

    try {
      await TripMembersModel.removeMember(memberId)
      
      toast.success(`${displayName} has been removed from the trip`)

      // Update local state
      setMembers(prev => prev.filter(m => m.userId !== userId))
      onUpdate?.()
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Failed to remove member')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading members...</div>
        </CardContent>
      </Card>
    )
  }

  if (!permissions?.canView) {
    return null
  }

  // Don't show member management for solo/couple trips
  if (!trip.travelMode || ['solo', 'couple'].includes(trip.travelMode)) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Trip Members</CardTitle>
            <CardDescription>
              {members.length} {members.length === 1 ? 'member' : 'members'} • {trip.travelMode} trip
            </CardDescription>
          </div>
          {permissions.canInvite && (
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invite
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join this trip
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="friend@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as MemberRole)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="organizer">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Organizer</div>
                              <div className="text-xs text-muted-foreground">Can edit and invite others</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="member">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Member</div>
                              <div className="text-xs text-muted-foreground">Can edit trip details</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="viewer">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Viewer</div>
                              <div className="text-xs text-muted-foreground">View-only access</div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setInviteDialogOpen(false)}
                    disabled={inviting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleInviteMember}
                    disabled={!inviteEmail || inviting}
                    className="gap-2"
                  >
                    {inviting ? (
                      'Sending...'
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Send Invitation
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {members.map((member) => {
            const RoleIcon = roleIcons[member.role]
            const isOwner = member.userId === trip.userId
            const isCurrentUser = member.userId === user?.uid
            const memberId = `${trip.id}_${member.userId}` // Construct member ID

            return (
              <div key={member.userId} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.photoURL} />
                    <AvatarFallback>
                      {member.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-medium">
                        {member.displayName}
                        {isCurrentUser && ' (You)'}
                      </div>
                      {member.status === 'invited' && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Mail className="h-3 w-3" />
                          Invited
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{member.email}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <RoleIcon className="h-3 w-3" />
                    {roleLabels[member.role]}
                  </Badge>
                  
                  {permissions.canManageMembers && !isOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {member.status === 'invited' && (
                          <>
                            <DropdownMenuItem
                              onClick={async () => {
                                const inviteLink = `${window.location.origin}/invitation/${memberId}`
                                await navigator.clipboard.writeText(inviteLink)
                                toast.success('Invitation link copied to clipboard')
                              }}
                            >
                              <Link className="h-4 w-4 mr-2" />
                              Copy Invitation Link
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleUpdateRole(memberId, member.userId, 'organizer')}
                          disabled={member.role === 'organizer' || member.status === 'invited'}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Make Organizer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUpdateRole(memberId, member.userId, 'member')}
                          disabled={member.role === 'member' || member.status === 'invited'}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Make Member
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUpdateRole(memberId, member.userId, 'viewer')}
                          disabled={member.role === 'viewer' || member.status === 'invited'}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Make Viewer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleRemoveMember(memberId, member.userId, member.displayName)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove from trip
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}