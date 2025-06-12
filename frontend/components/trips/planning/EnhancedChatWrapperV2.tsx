'use client';

import { useState, useEffect } from 'react';
import { EnhancedTravelChat } from '@/components/chat/EnhancedTravelChat';
import { TripV2 } from '@/types/travel-v2';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { normalizeDate, parseDate, formatDate } from '@/lib/utils/date-helpers';
import { FullTripData } from '@/lib/services/trip-service-v2';

interface EnhancedChatWrapperV2Props {
  trip: TripV2;
  fullTripData?: FullTripData;
  onUpdate?: () => Promise<void>;
}

export function EnhancedChatWrapperV2({ trip, fullTripData, onUpdate }: EnhancedChatWrapperV2Props) {
  const [selectedDate, setSelectedDate] = useState<string>('all');
  
  // Debug logging for trip structure
  console.log('EnhancedChatWrapperV2 - trip data:', {
    tripId: trip.id,
    tripName: trip.name,
    startDate: trip.startDate,
    endDate: trip.endDate,
    daysCount: fullTripData?.days?.length || 0,
    days: fullTripData?.days?.map(day => ({
      id: day.id,
      date: day.date,
      dayNumber: day.dayNumber,
      activitiesCount: day.activities?.length || 0
    }))
  });
  
  // Generate date options from trip days
  const dateOptions = fullTripData?.days?.map(day => {
    const dateStr = normalizeDate(day.date);
    const dateObj = parseDate(day.date);
    
    return {
      value: dateStr,
      label: `Day ${day.dayNumber} - ${formatDate(dateObj, 'EEEE, MMM d')}`,
      dayNumber: day.dayNumber,
      activityCount: day.activities?.length || 0
    };
  }) || [];
  
  // Auto-select first day with no activities or first day if all have activities
  useEffect(() => {
    if (!selectedDate && dateOptions.length > 0) {
      const emptyDay = dateOptions.find(option => option.activityCount === 0);
      setSelectedDate(emptyDay?.value || dateOptions[0].value);
    }
  }, [dateOptions, selectedDate]);
  
  const handleDaySelect = (value: string) => {
    console.log('Selected date:', value);
    setSelectedDate(value);
  };
  
  const handleActivityAdded = async () => {
    console.log('Activity added, refreshing trip data...');
    if (onUpdate) {
      await onUpdate();
    }
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>AI Travel Assistant</CardTitle>
            <CardDescription>
              Get personalized recommendations and plan your trip
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedDate} onValueChange={handleDaySelect}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select a day to plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All days</SelectItem>
                {dateOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center justify-between w-full">
                      <span>{option.label}</span>
                      {option.activityCount > 0 && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({option.activityCount} activities)
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <EnhancedTravelChat 
          tripId={trip.id}
          currentDate={selectedDate === 'all' ? '' : selectedDate}
          onActivityAdded={handleActivityAdded}
          className="h-full"
        />
      </CardContent>
    </Card>
  );
}