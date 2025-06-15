'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { TravelMode } from '@/types/travel'
import { 
  User, 
  Users, 
  Heart, 
  UsersRound, 
  Briefcase,
  Check
} from 'lucide-react'

interface TravelModeStepProps {
  formData: {
    travelMode: TravelMode | null
  }
  onUpdate: (data: Partial<{ travelMode: TravelMode | null }>) => void
  errors?: Record<string, string>
}

const travelModes = [
  {
    id: 'solo' as TravelMode,
    title: 'Solo Travel',
    description: 'Exploring on your own terms',
    icon: User,
    features: [
      'Personal itinerary optimization',
      'Solo traveler safety features',
      'Connect with other travelers',
      'Self-discovery focused'
    ],
    color: 'bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40'
  },
  {
    id: 'couple' as TravelMode,
    title: 'Couple/Partner',
    description: 'Romantic getaways and shared adventures',
    icon: Heart,
    features: [
      'Shared budget tracking',
      'Romance-focused suggestions',
      'Joint preference profiles',
      'Special occasion planning'
    ],
    color: 'bg-pink-500/10 border-pink-500/20 hover:border-pink-500/40'
  },
  {
    id: 'family' as TravelMode,
    title: 'Family Travel',
    description: 'Fun for all ages',
    icon: UsersRound,
    features: [
      'Kid-friendly activities',
      'Family accommodation search',
      'Age-appropriate planning',
      'Educational experiences'
    ],
    color: 'bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40'
  },
  {
    id: 'group' as TravelMode,
    title: 'Group Travel',
    description: 'Adventures with friends',
    icon: Users,
    features: [
      'Multi-user collaboration',
      'Activity voting system',
      'Split payment tracking',
      'Group chat & updates'
    ],
    color: 'bg-green-500/10 border-green-500/20 hover:border-green-500/40'
  },
  {
    id: 'business' as TravelMode,
    title: 'Business Travel',
    description: 'Efficient work trips',
    icon: Briefcase,
    features: [
      'Expense report generation',
      'Meeting schedule integration',
      'Business hotels priority',
      'Policy compliance'
    ],
    color: 'bg-gray-500/10 border-gray-500/20 hover:border-gray-500/40'
  }
]

export function TravelModeStep({ formData, onUpdate, errors }: TravelModeStepProps) {
  const selectedMode = formData.travelMode

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">How are you traveling?</h3>
        <p className="text-sm text-muted-foreground">
          Choose your travel mode to unlock tailored features and recommendations
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {travelModes.map((mode) => {
          const Icon = mode.icon
          const isSelected = selectedMode === mode.id

          return (
            <Card
              key={mode.id}
              className={cn(
                "relative cursor-pointer transition-all duration-200",
                mode.color,
                isSelected && "ring-2 ring-primary",
                "hover:shadow-md"
              )}
              onClick={() => onUpdate({ travelMode: mode.id })}
            >
              {isSelected && (
                <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center">
                  <Check className="h-3 w-3" />
                </Badge>
              )}
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <Icon className="h-8 w-8 mb-2" />
                </div>
                <CardTitle className="text-base">{mode.title}</CardTitle>
                <CardDescription className="text-xs">
                  {mode.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <ul className="space-y-1">
                  {mode.features.map((feature, index) => (
                    <li key={index} className="text-xs text-muted-foreground flex items-start">
                      <span className="mr-1.5 mt-0.5">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {errors?.travelMode && (
        <p className="text-sm text-destructive">{errors.travelMode}</p>
      )}

      <div className="bg-muted/50 rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Tip:</strong> Your travel mode helps us customize your experience. 
          You can always change this later or invite others to collaborate.
        </p>
      </div>
    </div>
  )
}