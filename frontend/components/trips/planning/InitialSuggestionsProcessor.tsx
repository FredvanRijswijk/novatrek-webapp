'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Sparkles, 
  MapPin, 
  Clock, 
  DollarSign, 
  Plus,
  X,
  CheckCircle,
  Info,
  Calendar
} from 'lucide-react';
import { DayModelV2 } from '@/lib/models/v2/day-model-v2';
import { ActivityModelV2 } from '@/lib/models/v2/activity-model-v2';
import { format, addDays } from 'date-fns';
import { DayV2 } from '@/types/travel-v2';
import { toast } from 'sonner';

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

interface InitialSuggestionsProcessorProps {
  tripId: string;
  tripStartDate: Date;
  tripEndDate: Date;
  onSuggestionsProcessed?: () => void;
}

export function InitialSuggestionsProcessor({ 
  tripId, 
  tripStartDate, 
  tripEndDate,
  onSuggestionsProcessed 
}: InitialSuggestionsProcessorProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [customRequests, setCustomRequests] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [showProcessor, setShowProcessor] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [days, setDays] = useState<DayV2[]>([]);
  const [suggestionDayMap, setSuggestionDayMap] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check for stored suggestions
    const storageKey = `trip_${tripId}_initial_suggestions`;
    const storedData = localStorage.getItem(storageKey);
    
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setSuggestions(parsed.suggestions || []);
        setCustomRequests(parsed.customRequests || '');
        setShowProcessor(true);
        // Pre-select all suggestions
        setSelectedSuggestions(parsed.suggestions.map((s: AISuggestion) => s.id));
      } catch (error) {
        console.error('Error parsing stored suggestions:', error);
      }
    }
  }, [tripId]);

  // Load trip days when processor shows
  useEffect(() => {
    if (showProcessor && tripId) {
      const loadDays = async () => {
        const dayModel = new DayModelV2();
        const tripDays = await dayModel.getTripDays(tripId);
        setDays(tripDays);
        
        // Initialize day mapping - distribute suggestions across days
        const dayMap: Record<string, string> = {};
        suggestions.forEach((suggestion, index) => {
          const dayIndex = index % tripDays.length;
          if (tripDays[dayIndex]) {
            dayMap[suggestion.id] = tripDays[dayIndex].id;
          }
        });
        setSuggestionDayMap(dayMap);
      };
      loadDays();
    }
  }, [showProcessor, tripId, suggestions]);

  const toggleSuggestion = (suggestionId: string) => {
    setSelectedSuggestions(prev => 
      prev.includes(suggestionId) 
        ? prev.filter(id => id !== suggestionId)
        : [...prev, suggestionId]
    );
  };

  const processSuggestions = async () => {
    setIsProcessing(true);
    setProcessedCount(0);

    try {
      const activityModel = new ActivityModelV2();
      
      // Filter selected suggestions
      const suggestionsToProcess = suggestions.filter(s => 
        selectedSuggestions.includes(s.id)
      );

      // Group suggestions by day
      const suggestionsByDay = new Map<string, AISuggestion[]>();
      suggestionsToProcess.forEach(suggestion => {
        const dayId = suggestionDayMap[suggestion.id];
        if (dayId) {
          if (!suggestionsByDay.has(dayId)) {
            suggestionsByDay.set(dayId, []);
          }
          suggestionsByDay.get(dayId)!.push(suggestion);
        }
      });

      // Process each day's suggestions
      for (const [dayId, daySuggestions] of suggestionsByDay) {
        const day = days.find(d => d.id === dayId);
        if (!day) continue;

        for (const suggestion of daySuggestions) {
          // Convert suggestion to activity format
          const activityData = {
            name: suggestion.title,
            description: suggestion.description,
            type: suggestion.type as 'sightseeing' | 'dining' | 'activity' | 'transport' | 'accommodation' | 'other',
            category: suggestion.category,
            location: {
              address: suggestion.location,
              lat: 0, // Would need to geocode in production
              lng: 0, // Would need to geocode in production
            },
            duration: parseDuration(suggestion.duration),
            cost: {
              amount: suggestion.estimatedCost,
              currency: 'USD',
              perPerson: true
            },
            tags: [suggestion.category, suggestion.type, 'ai-suggested'],
            status: 'planned' as const,
            aiSuggested: true,
            confidence: suggestion.confidence,
            priority: 'nice-to-have' as const,
          };

          // Add activity to the day
          await activityModel.createActivity(tripId, dayId, activityData);
          
          setProcessedCount(prev => prev + 1);
        }
      }

      // Show success message
      toast.success(
        `Added ${suggestionsToProcess.length} activities to your itinerary!`,
        {
          description: 'Refreshing to show your new activities...',
          duration: 5000
        }
      );

      // Clear the stored suggestions
      localStorage.removeItem(`trip_${tripId}_initial_suggestions`);
      
      // Hide the processor and trigger refresh after a short delay
      setTimeout(() => {
        setShowProcessor(false);
        onSuggestionsProcessed?.();
        // Force page refresh to show new activities
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Error processing suggestions:', error);
      toast.error('Failed to add some activities. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const dismissSuggestions = () => {
    localStorage.removeItem(`trip_${tripId}_initial_suggestions`);
    setShowProcessor(false);
  };

  // Parse duration string to minutes
  const parseDuration = (durationStr: string): number => {
    const match = durationStr.match(/(\d+)(?:-(\d+))?\s*(hour|minute)/i);
    if (match) {
      const min = parseInt(match[1]);
      const max = match[2] ? parseInt(match[2]) : min;
      const avg = (min + max) / 2;
      const unit = match[3].toLowerCase();
      return unit.includes('hour') ? avg * 60 : avg;
    }
    return 60; // Default 1 hour
  };

  if (!showProcessor || suggestions.length === 0) {
    return null;
  }

  return (
    <Alert className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
      <Sparkles className="h-4 w-4" />
      <AlertTitle>Welcome to your trip planning!</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-4">
          <p>
            We found {suggestions.length} AI-generated suggestions from your trip setup. 
            Would you like to add them to your itinerary?
          </p>

          {/* Suggestions List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {suggestions.map((suggestion) => {
              const targetDay = days.find(d => d.id === suggestionDayMap[suggestion.id]);
              return (
                <div
                  key={suggestion.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    selectedSuggestions.includes(suggestion.id)
                      ? 'bg-white dark:bg-gray-800 border-blue-300'
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSuggestions.includes(suggestion.id)}
                    onChange={() => toggleSuggestion(suggestion.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{suggestion.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {suggestion.description}
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {suggestion.type}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {suggestion.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {suggestion.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${suggestion.estimatedCost}
                        </span>
                      </div>
                      {selectedSuggestions.includes(suggestion.id) && days.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <Select
                            value={suggestionDayMap[suggestion.id] || ''}
                            onValueChange={(value) => {
                              setSuggestionDayMap(prev => ({
                                ...prev,
                                [suggestion.id]: value
                              }));
                            }}
                          >
                            <SelectTrigger className="h-7 w-32 text-xs">
                              <SelectValue placeholder="Select day" />
                            </SelectTrigger>
                            <SelectContent>
                              {days.map((day) => (
                                <SelectItem key={day.id} value={day.id}>
                                  Day {day.dayNumber} - {format(new Date(day.date), 'MMM d')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {customRequests && (
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="text-sm">
                <strong>Your special requests:</strong> {customRequests}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={processSuggestions}
              disabled={isProcessing || selectedSuggestions.length === 0}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 animate-pulse" />
                  Adding {processedCount}/{selectedSuggestions.length}...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add {selectedSuggestions.length} Selected to Itinerary
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={dismissSuggestions}
              disabled={isProcessing}
            >
              <X className="h-4 w-4 mr-2" />
              Skip
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}