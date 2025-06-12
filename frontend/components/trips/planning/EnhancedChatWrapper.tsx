'use client';

import { useState, useEffect, useCallback } from 'react';
import { EnhancedTravelChat } from '@/components/chat/EnhancedTravelChat';
import { Trip } from '@/types/travel';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TripModelEnhanced as TripModel } from '@/lib/models/trip-enhanced';
import { toast } from 'sonner';
import { normalizeDate, parseDate, formatDate } from '@/lib/utils/date-helpers';

interface EnhancedChatWrapperProps {
  trip: Trip;
  onUpdate?: (trip: Trip) => void;
}

export function EnhancedChatWrapper({ trip, onUpdate }: EnhancedChatWrapperProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  // Debug logging for trip itinerary
  console.log('EnhancedChatWrapper - trip itinerary:', {
    tripId: trip.id,
    tripName: trip.name,
    startDate: trip.startDate,
    endDate: trip.endDate,
    itineraryLength: trip.itinerary?.length || 0,
    itinerary: trip.itinerary?.map(day => ({
      date: day.date,
      dateType: typeof day.date,
      dateValue: day.date?.toDate ? day.date.toDate() : day.date,
      hasToDate: !!day.date?.toDate,
      activitiesCount: day.activities?.length || 0
    }))
  });
  
  // Generate date options from actual trip itinerary days
  const dateOptionsMap = new Map();
  if (trip.itinerary && trip.itinerary.length > 0) {
    trip.itinerary.forEach((day, index) => {
      const dateStr = normalizeDate(day.date);
      if (!dateStr) {
        console.log(`Day ${index} - Invalid date, skipping`);
        return;
      }
      
      const dateObj = parseDate(day.date);
      
      // Use Map to prevent duplicates
      if (!dateOptionsMap.has(dateStr)) {
        dateOptionsMap.set(dateStr, {
          value: dateStr,
          label: formatDate(dateObj, 'EEEE, MMMM d, yyyy')
        });
      }
    });
  } else {
    console.log('No itinerary days found in trip');
  }
  
  // Convert Map to array and sort by date
  const dateOptions = Array.from(dateOptionsMap.values()).sort((a, b) => 
    a.value.localeCompare(b.value)
  );
  
  console.log('Final dateOptions after deduplication and sorting:', dateOptions);
  
  // Auto-select today if it's within the trip dates, otherwise first day
  useEffect(() => {
    if (dateOptions.length === 0) return;
    
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayOption = dateOptions.find(opt => opt.value === today);
    
    console.log('Date selection logic:', {
      today,
      todayOption,
      dateOptionsLength: dateOptions.length,
      firstOption: dateOptions[0],
      allDates: dateOptions.map(d => d.value)
    });
    
    if (todayOption) {
      console.log('Setting selected date to today:', today);
      setSelectedDate(today);
    } else if (dateOptions.length > 0) {
      // If today doesn't exist in trip days, select the first available day
      console.log('Today not in trip days, setting to first option:', dateOptions[0].value);
      setSelectedDate(dateOptions[0].value);
    }
  }, [dateOptions]);
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>AI Travel Assistant</CardTitle>
        <CardDescription>
          Get personalized recommendations and plan your trip with AI
        </CardDescription>
        
        {/* Date selector */}
        {dateOptions.length > 0 && (
          <div className="mt-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a day to plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All days</SelectItem>
                {dateOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        <EnhancedTravelChat 
          tripId={trip.id}
          currentDate={selectedDate === 'all' ? '' : selectedDate}
          className="h-full border-0 rounded-none"
          key={selectedDate} // Force re-render when date changes
        />
      </CardContent>
    </Card>
  );
}