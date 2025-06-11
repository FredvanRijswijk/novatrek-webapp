'use client';

import { useState, useMemo } from 'react';
import { 
  Plus, 
  Clock, 
  Utensils, 
  MapPin, 
  Camera, 
  ShoppingBag, 
  Music, 
  Sparkles,
  TreePalm,
  Mountain,
  AlertCircle,
  Coffee,
  Sun,
  Moon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Activity, DayItinerary } from '@/types/travel';
import { format, parse, addMinutes, differenceInMinutes, isAfter, isBefore, set } from 'date-fns';

interface TimeSlot {
  startTime: Date;
  endTime: Date;
  isFree: boolean;
  duration: number; // in minutes
}

interface DayContext extends DayItinerary {
  // Enhanced context could include weather, location info, etc.
}

interface ActivityTimelineProps {
  dayContext: DayContext;
  onAddActivity: (timeSlot: TimeSlot) => void;
  onEditActivity: (activity: Activity) => void;
}

// Activity type configurations
const activityTypeConfig = {
  dining: {
    icon: Utensils,
    color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700',
    label: 'Dining'
  },
  sightseeing: {
    icon: Camera,
    color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700',
    label: 'Sightseeing'
  },
  shopping: {
    icon: ShoppingBag,
    color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700',
    label: 'Shopping'
  },
  nightlife: {
    icon: Music,
    color: 'bg-pink-100 dark:bg-pink-900/20 text-pink-800 dark:text-pink-200 border-pink-300 dark:border-pink-700',
    label: 'Nightlife'
  },
  relaxation: {
    icon: TreePalm,
    color: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700',
    label: 'Relaxation'
  },
  adventure: {
    icon: Mountain,
    color: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700',
    label: 'Adventure'
  },
  cultural: {
    icon: Sparkles,
    color: 'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700',
    label: 'Cultural'
  },
  other: {
    icon: MapPin,
    color: 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700',
    label: 'Other'
  }
};

// Meal time indicators
const mealTimes = [
  { name: 'Breakfast', icon: Coffee, start: 7, end: 9 },
  { name: 'Lunch', icon: Sun, start: 12, end: 14 },
  { name: 'Dinner', icon: Moon, start: 18, end: 20 }
];

export function ActivityTimeline({ dayContext, onAddActivity, onEditActivity }: ActivityTimelineProps) {
  const [hoveredSlot, setHoveredSlot] = useState<TimeSlot | null>(null);
  
  // Timeline configuration
  const startHour = 6;
  const endHour = 23;
  const hourHeight = 80; // pixels per hour
  const timelineHeight = (endHour - startHour) * hourHeight;

  // Parse activities and create time slots
  const { activities, freeSlots, conflicts } = useMemo(() => {
    const sortedActivities = [...(dayContext.activities || [])].sort((a, b) => {
      const aTime = parseTimeToDate(a.startTime);
      const bTime = parseTimeToDate(b.startTime);
      return aTime.getTime() - bTime.getTime();
    });

    // Find conflicts (overlapping activities)
    const conflictMap = new Map<string, boolean>();
    for (let i = 0; i < sortedActivities.length; i++) {
      for (let j = i + 1; j < sortedActivities.length; j++) {
        const a = sortedActivities[i];
        const b = sortedActivities[j];
        
        const aStart = parseTimeToDate(a.startTime);
        const aEnd = parseTimeToDate(a.endTime || addMinutes(aStart, a.duration || 120));
        const bStart = parseTimeToDate(b.startTime);
        const bEnd = parseTimeToDate(b.endTime || addMinutes(bStart, b.duration || 120));

        // Check for overlap
        if (!(isAfter(aStart, bEnd) || isBefore(aEnd, bStart))) {
          conflictMap.set(a.id, true);
          conflictMap.set(b.id, true);
        }
      }
    }

    // Calculate free time slots
    const freeSlots: TimeSlot[] = [];
    let lastEndTime = set(new Date(), { hours: startHour, minutes: 0, seconds: 0 });

    sortedActivities.forEach((activity) => {
      const activityStart = parseTimeToDate(activity.startTime);
      const activityEnd = parseTimeToDate(
        activity.endTime || addMinutes(activityStart, activity.duration || 120)
      );

      // Add free slot before this activity if there's a gap
      const gap = differenceInMinutes(activityStart, lastEndTime);
      if (gap >= 30) { // Only show free slots of 30 minutes or more
        freeSlots.push({
          startTime: lastEndTime,
          endTime: activityStart,
          isFree: true,
          duration: gap
        });
      }

      lastEndTime = activityEnd;
    });

    // Add final free slot if there's time left in the day
    const dayEnd = set(new Date(), { hours: endHour, minutes: 0, seconds: 0 });
    const finalGap = differenceInMinutes(dayEnd, lastEndTime);
    if (finalGap >= 30) {
      freeSlots.push({
        startTime: lastEndTime,
        endTime: dayEnd,
        isFree: true,
        duration: finalGap
      });
    }

    return { 
      activities: sortedActivities, 
      freeSlots, 
      conflicts: conflictMap 
    };
  }, [dayContext.activities]);

  // Helper function to parse time string to Date
  function parseTimeToDate(time?: string | Date): Date {
    if (!time) return set(new Date(), { hours: 9, minutes: 0, seconds: 0 });
    
    if (time instanceof Date) return time;
    
    // Parse time string (HH:mm format)
    const [hours, minutes] = time.split(':').map(Number);
    return set(new Date(), { hours, minutes, seconds: 0 });
  }

  // Calculate position and height for activities
  function getActivityStyle(activity: Activity) {
    const startTime = parseTimeToDate(activity.startTime);
    const endTime = parseTimeToDate(
      activity.endTime || addMinutes(startTime, activity.duration || 120)
    );
    
    const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
    const baseMinutes = startHour * 60;
    
    const top = ((startMinutes - baseMinutes) / 60) * hourHeight;
    const height = ((endMinutes - startMinutes) / 60) * hourHeight;
    
    return { top, height };
  }

  // Get activity type config
  function getActivityConfig(type: string) {
    return activityTypeConfig[type as keyof typeof activityTypeConfig] || activityTypeConfig.other;
  }

  // Format duration for display
  function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours}h ${mins}m`;
  }

  // Check if current time indicator should be shown
  const showCurrentTime = useMemo(() => {
    const now = new Date();
    return (
      dayContext.date && 
      format(now, 'yyyy-MM-dd') === format(new Date(dayContext.date), 'yyyy-MM-dd')
    );
  }, [dayContext.date]);

  const currentTimePosition = useMemo(() => {
    if (!showCurrentTime) return 0;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const baseMinutes = startHour * 60;
    return ((currentMinutes - baseMinutes) / 60) * hourHeight;
  }, [showCurrentTime, hourHeight, startHour]);

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="relative flex">
              {/* Time labels */}
              <div className="w-20 flex-shrink-0 pt-4">
                {Array.from({ length: endHour - startHour }, (_, i) => {
                  const hour = startHour + i;
                  return (
                    <div key={hour} className="h-20 flex items-start">
                      <span className="text-sm text-muted-foreground font-medium">
                        {format(set(new Date(), { hours: hour, minutes: 0 }), 'h a')}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Timeline */}
              <div className="flex-1 relative" style={{ height: timelineHeight }}>
                {/* Hour lines */}
                {Array.from({ length: endHour - startHour }, (_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 border-t border-muted"
                    style={{ top: i * hourHeight }}
                  />
                ))}

                {/* Meal time indicators */}
                {mealTimes.map((meal) => {
                  const top = (meal.start - startHour) * hourHeight;
                  const height = (meal.end - meal.start) * hourHeight;
                  const Icon = meal.icon;
                  
                  return (
                    <div
                      key={meal.name}
                      className="absolute left-0 right-0 bg-amber-50/50 dark:bg-amber-900/10 border-l-2 border-amber-400 dark:border-amber-600"
                      style={{ top, height }}
                    >
                      <div className="flex items-center gap-1 p-1">
                        <Icon className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                        <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                          {meal.name}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Free time slots */}
                {freeSlots.map((slot, index) => {
                  const { top, height } = getActivityStyle({
                    id: `free-${index}`,
                    name: 'Free Time',
                    type: 'other',
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    location: { name: '', address: '', coordinates: { lat: 0, lng: 0 } },
                    aiGenerated: false,
                    userAdded: false
                  });

                  return (
                    <Tooltip key={`free-${index}`}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "absolute left-0 right-4 cursor-pointer transition-all",
                            "bg-gray-50 dark:bg-gray-900/20 border-2 border-dashed border-gray-300 dark:border-gray-700",
                            "hover:bg-gray-100 dark:hover:bg-gray-900/40 hover:border-gray-400 dark:hover:border-gray-600",
                            "flex items-center justify-center group"
                          )}
                          style={{ top, height: Math.max(height - 4, 20) }}
                          onClick={() => onAddActivity(slot)}
                          onMouseEnter={() => setHoveredSlot(slot)}
                          onMouseLeave={() => setHoveredSlot(null)}
                        >
                          <div className="text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDuration(slot.duration)} free
                            </p>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {format(slot.startTime, 'h:mm a')} - {format(slot.endTime, 'h:mm a')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Click to add activity
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}

                {/* Activities */}
                {activities.map((activity) => {
                  const { top, height } = getActivityStyle(activity);
                  const config = getActivityConfig(activity.type);
                  const Icon = config.icon;
                  const hasConflict = conflicts.get(activity.id);

                  return (
                    <Tooltip key={activity.id}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "absolute left-0 right-4 cursor-pointer transition-all",
                            "border-2 rounded-lg p-3 group",
                            config.color,
                            hasConflict && "ring-2 ring-red-500 ring-offset-2",
                            "hover:shadow-lg hover:scale-[1.02]"
                          )}
                          style={{ 
                            top, 
                            height: Math.max(height - 4, 60),
                            minHeight: '60px'
                          }}
                          onClick={() => onEditActivity(activity)}
                        >
                          {hasConflict && (
                            <AlertCircle className="absolute -top-2 -right-2 h-5 w-5 text-red-500 bg-white dark:bg-gray-950 rounded-full" />
                          )}
                          
                          <div className="flex flex-col h-full">
                            <div className="flex items-start gap-2">
                              <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm line-clamp-2">
                                  {activity.name}
                                </h4>
                                {height > 80 && activity.location && (
                                  <p className="text-xs opacity-70 mt-1 line-clamp-1">
                                    <MapPin className="inline h-3 w-3 mr-1" />
                                    {activity.location.name || activity.location.address}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {height > 100 && (
                              <div className="mt-auto pt-2">
                                <Badge variant="secondary" className="text-xs">
                                  {activity.startTime && format(parseTimeToDate(activity.startTime), 'h:mm a')}
                                </Badge>
                              </div>
                            )}
                          </div>
                          
                          {/* Drag handle (visual only) */}
                          <div className="absolute inset-x-0 bottom-1 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-8 h-1 bg-current opacity-20 rounded-full" />
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <p className="font-medium">{activity.name}</p>
                          <p className="text-xs">
                            {activity.startTime && format(parseTimeToDate(activity.startTime), 'h:mm a')}
                            {activity.endTime && ` - ${format(parseTimeToDate(activity.endTime), 'h:mm a')}`}
                          </p>
                          {activity.duration && (
                            <p className="text-xs text-muted-foreground">
                              Duration: {formatDuration(activity.duration)}
                            </p>
                          )}
                          {hasConflict && (
                            <p className="text-xs text-red-500 font-medium">
                              ⚠️ Time conflict with another activity
                            </p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}

                {/* Current time indicator */}
                {showCurrentTime && currentTimePosition > 0 && currentTimePosition < timelineHeight && (
                  <div
                    className="absolute left-0 right-0 flex items-center pointer-events-none z-10"
                    style={{ top: currentTimePosition }}
                  >
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <div className="flex-1 h-0.5 bg-red-500" />
                    <span className="text-xs text-red-500 font-medium px-1">
                      {format(new Date(), 'h:mm a')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Summary footer */}
        <div className="border-t p-4 bg-muted/50">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">
                {activities.length} activities planned
              </span>
              {conflicts.size > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {conflicts.size} conflicts
                </Badge>
              )}
            </div>
            <span className="text-muted-foreground">
              {formatDuration(
                freeSlots.reduce((total, slot) => total + slot.duration, 0)
              )} free
            </span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}