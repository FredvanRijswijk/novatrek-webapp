'use client'

import { useState, useEffect } from 'react'
import { useFirebase } from '@/lib/firebase/context'
import { updateProfile } from 'firebase/auth'
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Camera, MapPin, Calendar, Plane, Trophy, Loader2, Upload, Palette } from 'lucide-react'
import { toast } from 'sonner'
import { uploadProfilePhoto, validateImageFile, resizeImage } from '@/lib/firebase/storage'
import { ThemeToggle } from '@/components/theme-toggle'
import { useTheme } from 'next-themes'
import { useSubscription } from '@/hooks/use-subscription'
import { SUBSCRIPTION_PLANS } from '@/lib/stripe/plans'

interface UserProfile {
  displayName: string
  photoURL: string
  bio?: string
  location?: string
  languages?: string[]
  stats?: {
    tripsCreated: number
    countriesVisited: string[]
    memberSince: Date
  }
  privacy?: {
    profileVisibility: 'public' | 'private'
    showStats: boolean
  }
}

export default function ProfilePage() {
  const { user } = useFirebase()
  const { theme } = useTheme()
  const { currentPlan, subscription } = useSubscription()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [profile, setProfile] = useState<UserProfile>({
    displayName: '',
    photoURL: '',
    bio: '',
    location: '',
    languages: [],
  })
  const [statsLoading, setStatsLoading] = useState(true)
  const [tripStats, setTripStats] = useState({
    totalTrips: 0,
    countriesVisited: 0,
    upcomingTrips: 0,
  })

  useEffect(() => {
    if (user) {
      loadProfile()
      loadTripStats()
    }
  }, [user])

  const loadProfile = async () => {
    if (!user) return

    try {
      // Load from Firestore user document
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      const userData = userDoc.data()

      setProfile({
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        bio: userData?.bio || '',
        location: userData?.location || '',
        languages: userData?.languages || [],
        stats: userData?.stats,
        privacy: userData?.privacy || {
          profileVisibility: 'private',
          showStats: true
        }
      })
    } catch (error) {
      console.error('Error loading profile:', error)
      // Fallback to auth profile
      setProfile({
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        bio: '',
        location: '',
        languages: [],
      })
    } finally {
      setLoading(false)
    }
  }

  const loadTripStats = async () => {
    if (!user) return

    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore')
      const tripsRef = collection(db, 'trips')
      const q = query(tripsRef, where('userId', '==', user.uid))
      const snapshot = await getDocs(q)
      
      const trips = snapshot.docs.map(doc => doc.data())
      const countries = new Set<string>()
      let upcoming = 0
      const now = new Date()

      trips.forEach(trip => {
        // Count countries
        if (trip.destination?.country) {
          countries.add(trip.destination.country)
        }
        if (trip.destinations) {
          trip.destinations.forEach((dest: any) => {
            if (dest.destination?.country) {
              countries.add(dest.destination.country)
            }
          })
        }

        // Count upcoming trips
        const startDate = trip.startDate?.toDate ? trip.startDate.toDate() : new Date(trip.startDate)
        if (startDate > now) {
          upcoming++
        }
      })

      setTripStats({
        totalTrips: trips.length,
        countriesVisited: countries.size,
        upcomingTrips: upcoming,
      })
    } catch (error) {
      console.error('Error loading trip stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: profile.displayName,
        photoURL: profile.photoURL,
      })

      // Update Firestore user document (use setDoc with merge to handle non-existent docs)
      await setDoc(doc(db, 'users', user.uid), {
        displayName: profile.displayName,
        photoURL: profile.photoURL,
        bio: profile.bio,
        location: profile.location,
        languages: profile.languages,
        updatedAt: new Date(),
      }, { merge: true })

      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      toast.error(validation.error)
      return
    }

    setUploadingPhoto(true)
    const toastId = toast.loading('Uploading photo...')
    
    try {
      // Resize image if needed
      const resizedFile = await resizeImage(file)
      
      // Upload to Firebase Storage
      const photoURL = await uploadProfilePhoto(user.uid, resizedFile)
      
      // Update profile
      setProfile(prev => ({ ...prev, photoURL }))
      
      // Update Firebase Auth profile
      await updateProfile(user, { photoURL })
      
      // Update Firestore (use setDoc with merge to handle non-existent docs)
      await setDoc(doc(db, 'users', user.uid), {
        photoURL,
        updatedAt: new Date()
      }, { merge: true })
      
      toast.success('Photo uploaded successfully', { id: toastId })
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast.error('Failed to upload photo', { id: toastId })
    } finally {
      setUploadingPhoto(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Profile</h2>
        <p className="text-muted-foreground">
          Manage your public profile information
        </p>
      </div>

      {/* Profile Photo Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
          <CardDescription>
            Your photo appears on your public profile and trip plans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.photoURL} alt={profile.displayName} />
              <AvatarFallback className="text-2xl">
                {profile.displayName?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <Label htmlFor="photo-upload" className={uploadingPhoto ? "cursor-not-allowed" : "cursor-pointer"}>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" asChild disabled={uploadingPhoto}>
                    <span>
                      {uploadingPhoto ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Camera className="h-4 w-4 mr-2" />
                          Change Photo
                        </>
                      )}
                    </span>
                  </Button>
                </div>
              </Label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
              />
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG, GIF or WebP. Max size 5MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Update your personal details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={profile.displayName}
              onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
              placeholder="Enter your name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Tell us about yourself and your travel interests..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                placeholder="City, Country"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="languages">Languages</Label>
            <Input
              id="languages"
              value={profile.languages?.join(', ')}
              onChange={(e) => setProfile({ 
                ...profile, 
                languages: e.target.value.split(',').map(l => l.trim()).filter(Boolean)
              })}
              placeholder="English, Spanish, French..."
            />
            <p className="text-xs text-muted-foreground">
              Separate languages with commas
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize the appearance of the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="theme">Theme</Label>
              <p className="text-sm text-muted-foreground">
                Select your preferred color theme
              </p>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      {/* Travel Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Travel Statistics</CardTitle>
          <CardDescription>
            Your travel activity on NovaTrek
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Plane className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="text-2xl font-bold">{tripStats.totalTrips}</div>
                <div className="text-sm text-muted-foreground">Total Trips</div>
              </div>

              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="text-2xl font-bold">{tripStats.countriesVisited}</div>
                <div className="text-sm text-muted-foreground">Countries</div>
              </div>

              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="text-2xl font-bold">{tripStats.upcomingTrips}</div>
                <div className="text-sm text-muted-foreground">Upcoming</div>
              </div>
            </div>
          )}

          <Separator className="my-4" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Trophy className="h-4 w-4" />
              <span>Member since {user?.metadata.creationTime ? new Date(user.metadata.creationTime).getFullYear() : 'N/A'}</span>
            </div>
            <Badge variant={currentPlan === 'pro' ? 'default' : 'secondary'}>
              {SUBSCRIPTION_PLANS[currentPlan as keyof typeof SUBSCRIPTION_PLANS]?.name || 'Free'} Plan
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={loadProfile} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  )
}