'use client';

import { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, MapPin, MoreVertical, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Trip, ItineraryDay, Activity } from '@/types/travel';
import { format, eachDayOfInterval, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { ActivitySearchModal } from './ActivitySearchModal';
import { TripModel } from '@/lib/models/trip';

interface ItineraryBuilderProps {
  trip: Trip;
  onUpdate: (trip: Trip) => void;
}

export function ItineraryBuilder({ trip, onUpdate }: ItineraryBuilderProps) {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate all days in the trip
  const tripDays = eachDayOfInterval({
    start: new Date(trip.startDate),
    end: new Date(trip.endDate),
  });

  // Initialize itinerary days if not present
  useEffect(() => {
    if (!trip.itinerary || trip.itinerary.length === 0) {
      const initialItinerary: ItineraryDay[] = tripDays.map((date, index) => ({
        id: `day_${index + 1}`,
        dayNumber: index + 1,
        date: date,
        activities: [],
        notes: '',
      }));

      onUpdate({
        ...trip,
        itinerary: initialItinerary,
      });
    }

    // Select first day by default
    if (!selectedDay && tripDays.length > 0) {
      setSelectedDay(tripDays[0]);
    }
  }, [trip, tripDays, selectedDay, onUpdate]);

  const getItineraryDay = (date: Date): ItineraryDay | undefined => {
    return trip.itinerary?.find(day => 
      isSameDay(new Date(day.date), date)
    );
  };

  const getActivityTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      sightseeing: 'bg-blue-100 text-blue-800',
      dining: 'bg-orange-100 text-orange-800',
      activity: 'bg-green-100 text-green-800',
      transport: 'bg-purple-100 text-purple-800',
      accommodation: 'bg-pink-100 text-pink-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || colors.other;
  };

  const handleAddActivity = () => {
    setIsAddingActivity(true);
  };

  const handleSelectActivity = async (activity: Activity) => {
    if (!selectedDay || !selectedDayData) return;

    try {
      setError(null);
      
      // Add the activity to the selected day
      const updatedItinerary = trip.itinerary?.map(day => {
        if (day.id === selectedDayData.id) {
          return {
            ...day,
            activities: [...(day.activities || []), {
              ...activity,
              id: `${activity.id}_${Date.now()}` // Ensure unique ID for multiple instances
            }],
          };
        }
        return day;
      });

      const updatedTrip = {
        ...trip,
        itinerary: updatedItinerary,
      };

      // Update local state
      onUpdate(updatedTrip);

      // Save to database
      if (trip.id) {
        await TripModel.update(trip.id, { itinerary: updatedItinerary });
      }

      setIsAddingActivity(false);
    } catch (err) {
      console.error('Error adding activity:', err);
      setError('Failed to add activity. Please try again.');
    }
  };

  const handleRemoveActivity = (dayId: string, activityId: string) => {
    const updatedItinerary = trip.itinerary?.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          activities: day.activities.filter(a => a.id !== activityId),
        };
      }
      return day;
    });

    onUpdate({
      ...trip,
      itinerary: updatedItinerary,
    });
  };

  const selectedDayData = selectedDay ? getItineraryDay(selectedDay) : null;

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Day Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trip Days</CardTitle>
          <CardDescription>Select a day to plan</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="p-4 space-y-2">
              {tripDays.map((date, index) => {
                const dayData = getItineraryDay(date);
                const isSelected = selectedDay && isSameDay(date, selectedDay);
                const activityCount = dayData?.activities?.length || 0;

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDay(date)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg transition-colors',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Day {index + 1}</p>
                        <p className={cn(
                          'text-sm',
                          isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                        )}>
                          {format(date, 'EEE, MMM d')}
                        </p>
                      </div>
                      {activityCount > 0 && (
                        <Badge 
                          variant={isSelected ? 'secondary' : 'outline'}
                          className="ml-2"
                        >
                          {activityCount}
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Day Planner */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>
                {selectedDay && `Day ${selectedDayData?.dayNumber} - ${format(selectedDay, 'EEEE, MMMM d')}`}
              </CardTitle>
              <CardDescription>
                Plan your activities for this day
              </CardDescription>
            </div>
            <Button onClick={handleAddActivity} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Activity
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          {selectedDayData?.activities && selectedDayData.activities.length > 0 ? (
            <div className="space-y-3">
              {selectedDayData.activities.map((activity, index) => (
                <Card key={activity.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{activity.name}</h4>
                          <Badge 
                            variant="secondary" 
                            className={cn('text-xs', getActivityTypeColor(activity.type))}
                          >
                            {activity.type}
                          </Badge>
                        </div>
                        
                        {activity.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {activity.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {activity.startTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {activity.startTime}
                              {activity.endTime && ` - ${activity.endTime}`}
                            </span>
                          )}
                          {activity.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {activity.location.address || activity.location.name}
                            </span>
                          )}
                        </div>

                        {activity.cost && (
                          <div className="mt-2">
                            <span className="text-sm font-medium">
                              {activity.cost.currency} {activity.cost.amount}
                            </span>
                            {activity.cost.perPerson && (
                              <span className="text-sm text-muted-foreground"> per person</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 cursor-move"
                        >
                          <GripVertical className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit Activity</DropdownMenuItem>
                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleRemoveActivity(selectedDayData.id, activity.id)}
                            >
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No activities planned for this day</p>
              <Button onClick={handleAddActivity} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Activity
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>

    {/* Activity Search Modal */}
    {isAddingActivity && selectedDay && (
      <ActivitySearchModal
        isOpen={isAddingActivity}
        onClose={() => setIsAddingActivity(false)}
        onSelect={handleSelectActivity}
        destination={
          trip.destinations && trip.destinations.length > 0
            ? trip.destinations.map(d => d.destination?.name).filter(Boolean).join(', ')
            : trip.destination?.name || 'Unknown location'
        }
        date={selectedDay}
      />
    )}
    </>
  );
}