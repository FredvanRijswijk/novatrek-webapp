'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useFirebase } from '@/lib/firebase/context'
import { TripMembersModel } from '@/lib/models/trip-members'
import { TripModelEnhanced as TripModel } from '@/lib/models/trip-enhanced'
import { Trip, TripMember } from '@/types/travel'
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  MapPin, 
  Calendar, 
  Users,
  Crown,
  Shield,
  User,
  Eye
} from 'lucide-react'

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

export default function InvitationPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useFirebase()
  const [invitation, setInvitation] = useState<TripMember | null>(null)
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const invitationId = params.id as string

  useEffect(() => {
    if (authLoading) return

    const loadInvitation = async () => {
      try {
        // Get the invitation
        const memberData = await TripMembersModel.getMemberById(invitationId)
        if (!memberData) {
          setError('Invitation not found')
          setLoading(false)
          return
        }

        setInvitation(memberData)

        // Check if already accepted
        if (memberData.status === 'active' && memberData.userId) {
          setSuccess(true)
          setLoading(false)
          return
        }

        // Load trip details
        const tripId = invitationId.split('_')[0] // Extract trip ID from composite ID
        const tripData = await TripModel.getById(tripId)
        if (!tripData) {
          setError('Trip not found')
          setLoading(false)
          return
        }

        setTrip(tripData)
        setLoading(false)
      } catch (error) {
        console.error('Error loading invitation:', error)
        setError('Failed to load invitation')
        setLoading(false)
      }
    }

    loadInvitation()
  }, [invitationId, authLoading])

  const handleAccept = async () => {
    if (!user || !invitation || !trip) return

    setAccepting(true)
    try {
      await TripMembersModel.acceptInvitation(
        invitationId,
        user.uid,
        user.displayName || user.email || 'Unknown',
        user.photoURL
      )

      setSuccess(true)
      
      // Redirect to trip after 2 seconds
      setTimeout(() => {
        router.push(`/dashboard/trips/${trip.id}/plan`)
      }, 2000)
    } catch (error) {
      console.error('Error accepting invitation:', error)
      setError('Failed to accept invitation')
    } finally {
      setAccepting(false)
    }
  }

  const handleDecline = () => {
    router.push('/dashboard')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to accept this invitation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => router.push('/login')}
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              className="w-full mt-4" 
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Invitation Accepted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You've successfully joined the trip! Redirecting...
            </p>
            <Button 
              className="w-full" 
              onClick={() => router.push(`/dashboard/trips/${trip?.id}/plan`)}
            >
              Go to Trip
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invitation || !trip) {
    return null
  }

  const RoleIcon = roleIcons[invitation.role]

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Trip Invitation</CardTitle>
          <CardDescription>
            You've been invited to join a trip
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Trip Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{trip.title}</h3>
            {trip.description && (
              <p className="text-muted-foreground">{trip.description}</p>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {trip.destinationName || 'Multiple destinations'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {trip.travelers?.length || 1} travelers
                </span>
              </div>
            </div>
          </div>

          {/* Role Information */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-background rounded-full">
                <RoleIcon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium">Your Role: {roleLabels[invitation.role]}</h4>
                <p className="text-sm text-muted-foreground">
                  {invitation.role === 'organizer' && 'You can edit the trip and invite others'}
                  {invitation.role === 'member' && 'You can view and edit trip details'}
                  {invitation.role === 'viewer' && 'You have view-only access to the trip'}
                </p>
              </div>
            </div>
          </div>

          {/* Email Check */}
          {user.email !== invitation.email && (
            <Alert>
              <AlertDescription>
                This invitation was sent to <strong>{invitation.email}</strong>. 
                You're signed in as <strong>{user.email}</strong>.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              className="flex-1"
              onClick={handleAccept}
              disabled={accepting}
            >
              {accepting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Accepting...
                </>
              ) : (
                'Accept Invitation'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleDecline}
              disabled={accepting}
            >
              Decline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}