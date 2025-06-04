'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Sparkles, 
  Clock, 
  MapPin, 
  DollarSign, 
  Users,
  Lightbulb,
  RefreshCw,
  Check
} from 'lucide-react';

interface AIKickstartStepProps {
  formData: any;
  updateFormData: (updates: any) => void;
}

interface AISuggestion {
  id: string;
  type: 'activity' | 'restaurant' | 'accommodation' | 'experience';
  title: string;
  description: string;
  location: string;
  estimatedCost: number;
  duration: string;
  category: string;
  reasoning: string;
  confidence: number;
}

export function AIKickstartStep({ formData, updateFormData }: AIKickstartStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Generate AI suggestions based on form data
  const generateAISuggestions = async () => {
    setIsGenerating(true);
    
    try {
      // Mock AI suggestions - In production, this would call OpenAI API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      const mockSuggestions: AISuggestion[] = [
        {
          id: '1',
          type: 'activity',
          title: 'Visit the Eiffel Tower',
          description: 'Iconic symbol of Paris with breathtaking city views',
          location: 'Champ de Mars, Paris',
          estimatedCost: 25,
          duration: '2-3 hours',
          category: 'cultural',
          reasoning: 'Perfect for first-time visitors and photography enthusiasts',
          confidence: 0.95
        },
        {
          id: '2',
          type: 'restaurant',
          title: 'Le Comptoir du Relais',
          description: 'Authentic Parisian bistro experience',
          location: 'Saint-Germain-des-Prés',
          estimatedCost: 45,
          duration: '1-2 hours',
          category: 'food',
          reasoning: 'Matches your interest in food culture and mid-range budget',
          confidence: 0.88
        },
        {
          id: '3',
          type: 'activity',
          title: 'Seine River Cruise',
          description: 'Romantic boat ride with city landmarks',
          location: 'Seine River',
          estimatedCost: 15,
          duration: '1 hour',
          category: 'cultural',
          reasoning: 'Relaxing way to see multiple landmarks in one activity',
          confidence: 0.92
        },
        {
          id: '4',
          type: 'accommodation',
          title: 'Hotel des Grands Boulevards',
          description: 'Boutique hotel in the heart of Paris',
          location: '2nd Arrondissement',
          estimatedCost: 180,
          duration: 'per night',
          category: 'accommodation',
          reasoning: 'Fits your mid-range budget and central location preference',
          confidence: 0.85
        },
        {
          id: '5',
          type: 'activity',
          title: 'Louvre Museum Tour',
          description: 'World-class art collection and historical artifacts',
          location: 'Palais du Louvre',
          estimatedCost: 20,
          duration: '3-4 hours',
          category: 'cultural',
          reasoning: 'Essential cultural experience for art and history lovers',
          confidence: 0.90
        }
      ];
      
      setSuggestions(mockSuggestions);
      updateFormData({ aiSuggestions: mockSuggestions });
      setHasGenerated(true);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSuggestionSelection = (suggestionId: string) => {
    const currentSelected = formData.selectedSuggestions || [];
    const isSelected = currentSelected.includes(suggestionId);
    
    if (isSelected) {
      updateFormData({
        selectedSuggestions: currentSelected.filter((id: string) => id !== suggestionId)
      });
    } else {
      updateFormData({
        selectedSuggestions: [...currentSelected, suggestionId]
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'activity': return MapPin;
      case 'restaurant': return Users;
      case 'accommodation': return Clock;
      case 'experience': return Lightbulb;
      default: return MapPin;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'activity': return 'bg-blue-100 text-blue-800';
      case 'restaurant': return 'bg-orange-100 text-orange-800';
      case 'accommodation': return 'bg-green-100 text-green-800';
      case 'experience': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* AI Generation Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-blue-500" />
          <Label className="text-lg font-semibold">AI-Powered Trip Suggestions</Label>
        </div>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Let our AI assistant create personalized recommendations based on your preferences. 
          These suggestions will kickstart your itinerary planning.
        </p>
      </div>

      {/* Trip Summary */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Your Trip Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span>{formData.destination?.name}, {formData.destination?.country}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>
                {formData.startDate && formData.endDate && 
                  `${Math.ceil((formData.endDate.getTime() - formData.startDate.getTime()) / (1000 * 60 * 60 * 24))} days`
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span>{formData.travelers?.length} traveler(s)</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <span>{formData.budgetRange?.currency} {formData.budgetRange?.max?.toLocaleString()}</span>
            </div>
          </div>
          {formData.activityTypes?.length > 0 && (
            <div className="mt-4">
              <span className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Interests:</span>
              <div className="flex flex-wrap gap-2">
                {formData.activityTypes.map((type: string) => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Button or Suggestions */}
      {!hasGenerated ? (
        <div className="text-center">
          <Button
            onClick={generateAISuggestions}
            disabled={isGenerating}
            size="lg"
            className="px-8"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Generating Suggestions...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Generate AI Suggestions
              </>
            )}
          </Button>
        </div>
      ) : (
        <>
          {/* AI Suggestions */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-semibold">Personalized Recommendations</Label>
              <Button variant="outline" size="sm" onClick={generateAISuggestions}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestions.map((suggestion) => {
                const Icon = getTypeIcon(suggestion.type);
                const isSelected = formData.selectedSuggestions?.includes(suggestion.id);
                
                return (
                  <Card
                    key={suggestion.id}
                    className={`cursor-pointer transition-all duration-200 relative ${
                      isSelected 
                        ? 'border-blue-500 shadow-md bg-blue-50 dark:bg-blue-900/20' 
                        : 'hover:border-gray-400'
                    }`}
                    onClick={() => toggleSuggestionSelection(suggestion.id)}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                    
                    <CardHeader className="pb-2">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getTypeColor(suggestion.type)}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base">{suggestion.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {suggestion.type}
                            </Badge>
                            <span className="text-xs text-gray-500">{suggestion.location}</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <CardDescription className="mb-3">
                        {suggestion.description}
                      </CardDescription>
                      
                      <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                        <span>{formData.budgetRange?.currency} {suggestion.estimatedCost}</span>
                        <span>{suggestion.duration}</span>
                      </div>
                      
                      <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                        💡 {suggestion.reasoning}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {formData.selectedSuggestions?.length > 0 && (
              <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-200">
                      {formData.selectedSuggestions.length} suggestion(s) selected
                    </span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    These will be added to your itinerary when you create the trip.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Additional Requests */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Any specific requests or preferences?</Label>
        <Textarea
          placeholder="Tell us about any specific places you want to visit, dietary requirements, accessibility needs, or other preferences..."
          value={formData.customRequests || ''}
          onChange={(e) => updateFormData({ customRequests: e.target.value })}
          rows={4}
        />
      </div>
    </div>
  );
}