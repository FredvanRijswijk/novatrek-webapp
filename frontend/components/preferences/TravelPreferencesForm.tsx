'use client'

import { useState, useEffect } from 'react'
import { useFirebase } from '@/lib/firebase/context'
import { getUserPreferences, saveUserPreferences } from '@/lib/firebase/preferences'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Save, 
  User, 
  MapPin, 
  Heart, 
  Utensils, 
  DollarSign, 
  Shield,
  Loader2,
  Check
} from 'lucide-react'
import {
  TravelPreferences,
  TravelStyle,
  AccommodationType,
  ActivityType,
  Interest,
  DietaryRestriction,
  DiningStyle,
  TransportType,
} from '@/types/preferences'

// Define all the options
const TRAVEL_STYLES: { value: TravelStyle; label: string; icon: string }[] = [
  { value: 'adventure', label: 'Adventure', icon: '🏔️' },
  { value: 'cultural', label: 'Cultural', icon: '🏛️' },
  { value: 'relaxation', label: 'Relaxation', icon: '🏖️' },
  { value: 'luxury', label: 'Luxury', icon: '✨' },
  { value: 'budget', label: 'Budget', icon: '💰' },
  { value: 'eco-friendly', label: 'Eco-friendly', icon: '🌿' },
  { value: 'family-friendly', label: 'Family-friendly', icon: '👨‍👩‍👧‍👦' },
  { value: 'romantic', label: 'Romantic', icon: '💕' },
  { value: 'business', label: 'Business', icon: '💼' },
  { value: 'backpacking', label: 'Backpacking', icon: '🎒' },
  { value: 'photography', label: 'Photography', icon: '📸' },
  { value: 'foodie', label: 'Foodie', icon: '🍜' },
]

const ACCOMMODATION_TYPES: { value: AccommodationType; label: string }[] = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'airbnb', label: 'Airbnb/Vacation Rental' },
  { value: 'resort', label: 'Resort' },
  { value: 'boutique', label: 'Boutique Hotel' },
  { value: 'camping', label: 'Camping' },
  { value: 'homestay', label: 'Homestay' },
  { value: 'villa', label: 'Villa' },
]

const ACTIVITY_TYPES: { value: ActivityType; label: string; icon: string }[] = [
  { value: 'sightseeing', label: 'Sightseeing', icon: '👁️' },
  { value: 'museums', label: 'Museums', icon: '🖼️' },
  { value: 'outdoor', label: 'Outdoor Activities', icon: '🥾' },
  { value: 'adventure-sports', label: 'Adventure Sports', icon: '🪂' },
  { value: 'water-sports', label: 'Water Sports', icon: '🏄' },
  { value: 'nightlife', label: 'Nightlife', icon: '🌃' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'wellness', label: 'Wellness/Spa', icon: '🧘' },
  { value: 'festivals', label: 'Festivals', icon: '🎪' },
  { value: 'wildlife', label: 'Wildlife', icon: '🦁' },
  { value: 'historical', label: 'Historical Sites', icon: '🏰' },
  { value: 'arts', label: 'Arts & Theater', icon: '🎭' },
]

const INTERESTS: { value: Interest; label: string }[] = [
  { value: 'history', label: 'History' },
  { value: 'art', label: 'Art' },
  { value: 'architecture', label: 'Architecture' },
  { value: 'nature', label: 'Nature' },
  { value: 'food', label: 'Food & Cuisine' },
  { value: 'music', label: 'Music' },
  { value: 'sports', label: 'Sports' },
  { value: 'technology', label: 'Technology' },
  { value: 'spirituality', label: 'Spirituality' },
  { value: 'photography', label: 'Photography' },
  { value: 'local-culture', label: 'Local Culture' },
  { value: 'crafts', label: 'Arts & Crafts' },
]

const DIETARY_RESTRICTIONS: { value: DietaryRestriction; label: string }[] = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten-free', label: 'Gluten-free' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' },
  { value: 'dairy-free', label: 'Dairy-free' },
  { value: 'nut-allergy', label: 'Nut Allergy' },
  { value: 'seafood-allergy', label: 'Seafood Allergy' },
  { value: 'low-sodium', label: 'Low Sodium' },
  { value: 'diabetic', label: 'Diabetic' },
]

export default function TravelPreferencesForm({ onComplete }: { onComplete?: () => void }) {
  const { user } = useFirebase()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [preferences, setPreferences] = useState<Partial<TravelPreferences>>({
    travelStyle: [],
    pacePreference: 'moderate',
    accommodationTypes: ['hotel'],
    accommodationAmenities: [],
    roomPreferences: ['private-bathroom'],
    activityTypes: [],
    interests: [],
    fitnessLevel: 'moderate',
    dietaryRestrictions: [],
    cuisinePreferences: [],
    diningStyle: ['local-cuisine', 'casual'],
    budgetRange: {
      min: 0,
      max: 5000,
      currency: 'USD',
      isPrivate: true,
    },
    spendingPriorities: ['experiences', 'food'],
    transportPreferences: ['walking', 'public-transport'],
    mobilityNeeds: [],
    languages: ['en'],
    travelCompanions: 'solo',
    shareWithGroups: true,
    anonymousGroupSharing: true,
  })

  // Load existing preferences
  useEffect(() => {
    if (user) {
      loadPreferences()
    }
  }, [user])

  const loadPreferences = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const existingPrefs = await getUserPreferences(user.uid)
      if (existingPrefs) {
        setPreferences(existingPrefs)
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) {
      console.error('No user authenticated')
      return
    }
    
    setSaving(true)
    setSaved(false)
    
    try {
      console.log('Saving preferences for user:', user.uid)
      console.log('Preferences data:', preferences)
      
      await saveUserPreferences(user.uid, preferences)
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      if (onComplete) onComplete()
    } catch (error) {
      console.error('Error saving preferences:', error)
      // Show error to user
      alert(`Failed to save preferences: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const toggleArrayPreference = (key: keyof TravelPreferences, value: any) => {
    const currentArray = (preferences[key] as any[]) || []
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value]
    
    setPreferences({ ...preferences, [key]: newArray })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Travel Preferences
          </CardTitle>
          <CardDescription>
            Customize your travel profile for personalized recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="style" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="style">Style</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="accommodation">Stay</TabsTrigger>
              <TabsTrigger value="food">Food</TabsTrigger>
              <TabsTrigger value="budget">Budget</TabsTrigger>
            </TabsList>

            <TabsContent value="style" className="space-y-6">
              <div>
                <Label className="text-base font-semibold mb-3 block">Travel Style</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {TRAVEL_STYLES.map(style => (
                    <div
                      key={style.value}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        preferences.travelStyle?.includes(style.value)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-muted-foreground'
                      }`}
                      onClick={() => toggleArrayPreference('travelStyle', style.value)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{style.icon}</span>
                        <span className="font-medium">{style.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold mb-3 block">Travel Pace</Label>
                <RadioGroup
                  value={preferences.pacePreference}
                  onValueChange={(value: any) => setPreferences({ ...preferences, pacePreference: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="relaxed" id="relaxed" />
                    <Label htmlFor="relaxed">Relaxed - Plenty of downtime</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="moderate" id="moderate" />
                    <Label htmlFor="moderate">Moderate - Balance of activities and rest</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="packed" id="packed" />
                    <Label htmlFor="packed">Packed - See and do as much as possible</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base font-semibold mb-3 block">Interests</Label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(interest => (
                    <Badge
                      key={interest.value}
                      variant={preferences.interests?.includes(interest.value) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleArrayPreference('interests', interest.value)}
                    >
                      {interest.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activities" className="space-y-6">
              <div>
                <Label className="text-base font-semibold mb-3 block">Activity Types</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {ACTIVITY_TYPES.map(activity => (
                    <div
                      key={activity.value}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        preferences.activityTypes?.includes(activity.value)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-muted-foreground'
                      }`}
                      onClick={() => toggleArrayPreference('activityTypes', activity.value)}
                    >
                      <div className="flex items-center gap-2">
                        <span>{activity.icon}</span>
                        <span className="text-sm">{activity.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold mb-3 block">Fitness Level</Label>
                <RadioGroup
                  value={preferences.fitnessLevel}
                  onValueChange={(value: any) => setPreferences({ ...preferences, fitnessLevel: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="low" />
                    <Label htmlFor="low">Low - Minimal walking, prefer transport</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="moderate" id="moderate-fitness" />
                    <Label htmlFor="moderate-fitness">Moderate - Can walk for a few hours</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="high" />
                    <Label htmlFor="high">High - Enjoy long walks and hikes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="very-high" id="very-high" />
                    <Label htmlFor="very-high">Very High - Love challenging activities</Label>
                  </div>
                </RadioGroup>
              </div>
            </TabsContent>

            <TabsContent value="accommodation" className="space-y-6">
              <div>
                <Label className="text-base font-semibold mb-3 block">Accommodation Types</Label>
                <div className="grid grid-cols-2 gap-3">
                  {ACCOMMODATION_TYPES.map(type => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={type.value}
                        checked={preferences.accommodationTypes?.includes(type.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            toggleArrayPreference('accommodationTypes', type.value)
                          } else {
                            toggleArrayPreference('accommodationTypes', type.value)
                          }
                        }}
                      />
                      <Label htmlFor={type.value} className="cursor-pointer">
                        {type.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="food" className="space-y-6">
              <div>
                <Label className="text-base font-semibold mb-3 block">Dietary Restrictions</Label>
                <div className="grid grid-cols-2 gap-3">
                  {DIETARY_RESTRICTIONS.map(diet => (
                    <div key={diet.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={diet.value}
                        checked={preferences.dietaryRestrictions?.includes(diet.value)}
                        onCheckedChange={() => toggleArrayPreference('dietaryRestrictions', diet.value)}
                      />
                      <Label htmlFor={diet.value} className="cursor-pointer">
                        {diet.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="budget" className="space-y-6">
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Budget Range (per person, per trip)
                </Label>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm w-20">Min: €{preferences.budgetRange?.min || 0}</span>
                    <Slider
                      value={[preferences.budgetRange?.min || 0]}
                      onValueChange={([value]) => 
                        setPreferences({
                          ...preferences,
                          budgetRange: { ...preferences.budgetRange!, min: value }
                        })
                      }
                      max={10000}
                      step={100}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm w-20">Max: €{preferences.budgetRange?.max || 5000}</span>
                    <Slider
                      value={[preferences.budgetRange?.max || 5000]}
                      onValueChange={([value]) => 
                        setPreferences({
                          ...preferences,
                          budgetRange: { ...preferences.budgetRange!, max: value }
                        })
                      }
                      max={10000}
                      step={100}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <Label className="text-base font-semibold">Privacy Settings</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="private-budget">Keep budget private</Label>
                      <p className="text-sm text-muted-foreground">
                        Your exact budget won't be shared with group members
                      </p>
                    </div>
                    <Switch
                      id="private-budget"
                      checked={preferences.budgetRange?.isPrivate}
                      onCheckedChange={(checked) => 
                        setPreferences({
                          ...preferences,
                          budgetRange: { ...preferences.budgetRange!, isPrivate: checked }
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="share-groups">Share preferences with groups</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow basic preferences to be shared in group travel planning
                      </p>
                    </div>
                    <Switch
                      id="share-groups"
                      checked={preferences.shareWithGroups}
                      onCheckedChange={(checked) => 
                        setPreferences({ ...preferences, shareWithGroups: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="anonymous-sharing">Anonymous group sharing</Label>
                      <p className="text-sm text-muted-foreground">
                        Share preferences without revealing your identity
                      </p>
                    </div>
                    <Switch
                      id="anonymous-sharing"
                      checked={preferences.anonymousGroupSharing}
                      onCheckedChange={(checked) => 
                        setPreferences({ ...preferences, anonymousGroupSharing: checked })
                      }
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-6">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}