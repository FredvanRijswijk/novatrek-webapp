'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  Home, 
  Heart, 
  Euro,
  DollarSign,
  Utensils,
  Camera,
  Mountain,
  Palette,
  ShoppingBag,
  Music,
  Waves,
  Coffee,
  Dumbbell
} from 'lucide-react';
import { ActivityType, User } from '@/types/travel';

interface TravelStyleStepProps {
  formData: any;
  updateFormData: (updates: any) => void;
  userProfile: User | null;
}

const TRAVEL_STYLES = [
  {
    id: 'budget',
    title: 'Budget Traveler',
    description: 'Save money with hostels, local food, and free activities',
    icon: Wallet,
    color: 'bg-green-100 border-green-300 text-green-800'
  },
  {
    id: 'mid-range',
    title: 'Comfort Seeker',
    description: 'Balance of comfort and value with nice hotels and experiences',
    icon: Heart,
    color: 'bg-blue-100 border-blue-300 text-blue-800'
  },
  {
    id: 'luxury',
    title: 'Luxury Traveler',
    description: 'Premium experiences with the finest hotels and services',
    icon: DollarSign,
    color: 'bg-purple-100 border-purple-300 text-purple-800'
  }
];

const ACCOMMODATION_TYPES = [
  { id: 'hotel', label: 'Hotels', icon: Home },
  { id: 'airbnb', label: 'Airbnb/Vacation Rentals', icon: Home },
  { id: 'hostel', label: 'Hostels', icon: Home },
  { id: 'resort', label: 'Resorts', icon: Home },
  { id: 'any', label: 'Any Type', icon: Home }
];

const ACTIVITY_TYPES: Array<{ id: ActivityType; label: string; icon: any; color: string }> = [
  { id: 'cultural', label: 'Cultural Sites', icon: Palette, color: 'bg-purple-100 text-purple-800' },
  { id: 'food', label: 'Food & Dining', icon: Utensils, color: 'bg-orange-100 text-orange-800' },
  { id: 'nature', label: 'Nature & Parks', icon: Mountain, color: 'bg-green-100 text-green-800' },
  { id: 'adventure', label: 'Adventure Sports', icon: Dumbbell, color: 'bg-red-100 text-red-800' },
  { id: 'photography', label: 'Photography', icon: Camera, color: 'bg-blue-100 text-blue-800' },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag, color: 'bg-pink-100 text-pink-800' },
  { id: 'nightlife', label: 'Nightlife', icon: Music, color: 'bg-indigo-100 text-indigo-800' },
  { id: 'relaxation', label: 'Relaxation', icon: Waves, color: 'bg-cyan-100 text-cyan-800' },
  { id: 'museums', label: 'Museums', icon: Palette, color: 'bg-gray-100 text-gray-800' },
  { id: 'sports', label: 'Sports Events', icon: Dumbbell, color: 'bg-yellow-100 text-yellow-800' }
];

export function TravelStyleStep({ formData, updateFormData, userProfile }: TravelStyleStepProps) {
  const toggleActivityType = (activityType: ActivityType) => {
    const currentTypes = formData.activityTypes || [];
    const isSelected = currentTypes.includes(activityType);
    
    if (isSelected) {
      updateFormData({ 
        activityTypes: currentTypes.filter((type: ActivityType) => type !== activityType) 
      });
    } else {
      updateFormData({ 
        activityTypes: [...currentTypes, activityType] 
      });
    }
  };

  const updateBudgetRange = (field: 'min' | 'max', value: number) => {
    updateFormData({
      budgetRange: {
        ...formData.budgetRange,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Travel Style Selection */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">What's your travel style?</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TRAVEL_STYLES.map((style) => {
            const Icon = style.icon;
            const isSelected = formData.travelStyle === style.id;
            
            return (
              <Card
                key={style.id}
                className={`cursor-pointer transition-all duration-200 ${
                  isSelected 
                    ? 'border-blue-500 shadow-md bg-blue-50 dark:bg-blue-900/20' 
                    : 'hover:border-gray-400'
                }`}
                onClick={() => updateFormData({ travelStyle: style.id })}
              >
                <CardContent className="p-6 text-center">
                  <div className={`inline-flex p-3 rounded-full mb-3 ${style.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold mb-2">{style.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {style.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Accommodation Preference */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Accommodation preference?</Label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {ACCOMMODATION_TYPES.map((accommodation) => {
            const Icon = accommodation.icon;
            const isSelected = formData.accommodationType === accommodation.id;
            
            return (
              <Button
                key={accommodation.id}
                variant={isSelected ? 'default' : 'outline'}
                className="h-auto py-4 px-3 flex-col"
                onClick={() => updateFormData({ accommodationType: accommodation.id })}
              >
                <Icon className="h-5 w-5 mb-2" />
                <span className="text-xs">{accommodation.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Activity Interests */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">What interests you? (Select all that apply)</Label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {ACTIVITY_TYPES.map((activity) => {
            const Icon = activity.icon;
            const isSelected = formData.activityTypes?.includes(activity.id);
            
            return (
              <Button
                key={activity.id}
                variant={isSelected ? 'default' : 'outline'}
                className="h-auto py-4 px-3 flex-col relative"
                onClick={() => toggleActivityType(activity.id)}
              >
                <Icon className="h-5 w-5 mb-2" />
                <span className="text-xs text-center">{activity.label}</span>
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                )}
              </Button>
            );
          })}
        </div>
        
        {formData.activityTypes?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">Selected:</span>
            {formData.activityTypes.map((type: ActivityType) => {
              const activity = ACTIVITY_TYPES.find(a => a.id === type);
              return activity ? (
                <Badge key={type} variant="secondary" className={activity.color}>
                  {activity.label}
                </Badge>
              ) : null;
            })}
          </div>
        )}
      </div>

      {/* Budget Range */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Budget range for this trip</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="minBudget">Minimum Budget</Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="minBudget"
                type="number"
                placeholder="1000"
                className="pl-10"
                value={formData.budgetRange?.min || ''}
                onChange={(e) => updateBudgetRange('min', Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="maxBudget">Maximum Budget</Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="maxBudget"
                type="number"
                placeholder="5000"
                className="pl-10"
                value={formData.budgetRange?.max || ''}
                onChange={(e) => updateBudgetRange('max', Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <select
              id="currency"
              className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800"
              value={formData.budgetRange?.currency || 'EUR'}
              onChange={(e) => updateFormData({
                budgetRange: { ...formData.budgetRange, currency: e.target.value }
              })}
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="JPY">JPY (¥)</option>
              <option value="CAD">CAD ($)</option>
              <option value="AUD">AUD ($)</option>
            </select>
          </div>
        </div>
        
        {formData.budgetRange?.min && formData.budgetRange?.max && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Budget range: {formData.budgetRange.currency} {formData.budgetRange.min.toLocaleString()} - {formData.budgetRange.currency} {formData.budgetRange.max.toLocaleString()}
          </div>
        )}
      </div>

      {/* User Profile Hints */}
      {userProfile?.preferences && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Coffee className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800 dark:text-green-200">
                  Using your saved preferences
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  We've pre-filled some options based on your profile. You can always change them here.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}