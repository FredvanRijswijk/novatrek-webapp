'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  Heart, 
  Home,
  CheckCircle,
  Sparkles
} from 'lucide-react';

interface ReviewStepProps {
  formData: any;
  updateFormData: (updates: any) => void;
}

export function ReviewStep({ formData }: ReviewStepProps) {
  const getTravelStyleLabel = (style: string) => {
    switch (style) {
      case 'budget': return 'Budget Traveler';
      case 'mid-range': return 'Comfort Seeker';
      case 'luxury': return 'Luxury Traveler';
      default: return style;
    }
  };

  const getAccommodationLabel = (type: string) => {
    switch (type) {
      case 'hotel': return 'Hotels';
      case 'airbnb': return 'Airbnb/Vacation Rentals';
      case 'hostel': return 'Hostels';
      case 'resort': return 'Resorts';
      case 'any': return 'Any Type';
      default: return type;
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getTripDuration = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    return Math.ceil((formData.endDate.getTime() - formData.startDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const selectedSuggestions = formData.aiSuggestions?.filter((suggestion: any) =>
    formData.selectedSuggestions?.includes(suggestion.id)
  ) || [];

  return (
    <div className="space-y-6">
      {/* Trip Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Trip Overview
          </CardTitle>
          <CardDescription>Review your trip details before creating</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Destination */}
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              <img 
                src={formData.destination?.imageUrl} 
                alt={formData.destination?.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{formData.destination?.name}</h3>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <MapPin className="h-4 w-4" />
                <span>{formData.destination?.country}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{formData.destination?.description}</p>
            </div>
          </div>

          {/* Trip Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <div className="font-medium">Duration</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {getTripDuration()} days
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium">Travelers</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {formData.travelers?.length} person(s)
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="font-medium">Budget</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {formData.budgetRange?.currency} {formData.budgetRange?.max?.toLocaleString()}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-red-500" />
              <div>
                <div className="font-medium">Style</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {getTravelStyleLabel(formData.travelStyle)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Travel Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Travel Dates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="font-medium text-green-600">Departure</div>
              <div className="text-lg">{formatDate(formData.startDate)}</div>
            </div>
            <div>
              <div className="font-medium text-red-600">Return</div>
              <div className="text-lg">{formatDate(formData.endDate)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Travelers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Travelers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {formData.travelers?.map((traveler: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <div className="font-medium">{traveler.name || 'Unnamed Traveler'}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {traveler.relationship}
                    {traveler.age && ` • ${traveler.age} years old`}
                  </div>
                </div>
                {index === 0 && (
                  <Badge variant="secondary">Primary</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Travel Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Home className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Accommodation</span>
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                {getAccommodationLabel(formData.accommodationType)}
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-red-500" />
                <span className="font-medium">Travel Style</span>
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                {getTravelStyleLabel(formData.travelStyle)}
              </div>
            </div>
          </div>
          
          {formData.activityTypes?.length > 0 && (
            <div>
              <div className="font-medium mb-2">Interests</div>
              <div className="flex flex-wrap gap-2">
                {formData.activityTypes.map((type: string) => (
                  <Badge key={type} variant="outline" className="capitalize">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      {selectedSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-blue-500" />
              Selected AI Suggestions
            </CardTitle>
            <CardDescription>
              These recommendations will be added to your initial itinerary
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedSuggestions.map((suggestion: any) => (
                <div key={suggestion.id} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="font-medium">{suggestion.title}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {suggestion.description}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{suggestion.location}</span>
                      <span>{formData.budgetRange?.currency} {suggestion.estimatedCost}</span>
                      <span>{suggestion.duration}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Requests */}
      {formData.customRequests && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Special Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300">{formData.customRequests}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
        <CardContent className="p-6">
          <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
            Ready to create your trip!
          </h3>
          <p className="text-green-700 dark:text-green-300 text-sm">
            Once you create your trip, you'll be taken to the planning workspace where you can:
          </p>
          <ul className="mt-2 text-sm text-green-700 dark:text-green-300 space-y-1">
            <li>• Build detailed day-by-day itineraries</li>
            <li>• Search and add more activities</li>
            <li>• Track your budget and expenses</li>
            <li>• Chat with AI for personalized recommendations</li>
            <li>• Share your trip with travel companions</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}