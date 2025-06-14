'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Clock, 
  MapPin, 
  DollarSign, 
  Star, 
  Camera,
  Coffee,
  Sun,
  Wine,
  Moon,
  Footprints,
  Car,
  Train,
  Plane,
  ChevronDown,
  ChevronUp,
  Navigation
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActivityV2 } from '@/types/travel-v2';
import { formatPrice } from '@/lib/utils/currency';

interface TimelineViewProps {
  activities: ActivityV2[];
  currentActivityIndex: number;
  onActivityClick: (index: number) => void;
  className?: string;
}

// Time icons based on hour
const getTimeIcon = (time: string) => {
  const hour = parseInt(time.split(':')[0]);
  if (hour < 12) return { icon: Coffee, label: 'Morning', color: 'text-orange-500' };
  if (hour < 17) return { icon: Sun, label: 'Afternoon', color: 'text-yellow-500' };
  if (hour < 21) return { icon: Wine, label: 'Evening', color: 'text-purple-500' };
  return { icon: Moon, label: 'Night', color: 'text-indigo-500' };
};

// Transport icons
const transportIcons = {
  walking: Footprints,
  driving: Car,
  transit: Train,
  flight: Plane,
};

interface TimeBlock {
  startTime: string;
  endTime: string;
  activities: ActivityV2[];
}

export function TimelineView({ activities, currentActivityIndex, onActivityClick, className }: TimelineViewProps) {
  const [expandedActivity, setExpandedActivity] = useState<number | null>(null);
  const [showCompactView, setShowCompactView] = useState(false);
  const activeRef = useRef<HTMLDivElement>(null);

  // Group activities by time blocks
  const timeBlocks = activities.reduce<TimeBlock[]>((blocks, activity) => {
    const lastBlock = blocks[blocks.length - 1];
    
    // Check if activity fits in the last block (within 30 minutes)
    if (lastBlock && activity.startTime) {
      const lastEndTime = new Date(`2000-01-01 ${lastBlock.endTime}`);
      const activityStartTime = new Date(`2000-01-01 ${activity.startTime}`);
      const timeDiff = (activityStartTime.getTime() - lastEndTime.getTime()) / (1000 * 60);
      
      if (timeDiff <= 30) {
        lastBlock.activities.push(activity);
        lastBlock.endTime = activity.endTime || activity.startTime;
        return blocks;
      }
    }
    
    // Create new time block
    blocks.push({
      startTime: activity.startTime || '00:00',
      endTime: activity.endTime || activity.startTime || '00:00',
      activities: [activity]
    });
    
    return blocks;
  }, []);

  // Calculate travel time between activities
  const getTravelTime = (from: ActivityV2, to: ActivityV2): string | null => {
    // Mock calculation - in real app, use Google Maps API
    if (!from.location?.coordinates || !to.location?.coordinates) return null;
    
    const distance = Math.sqrt(
      Math.pow(from.location.coordinates.lat - to.location.coordinates.lat, 2) +
      Math.pow(from.location.coordinates.lng - to.location.coordinates.lng, 2)
    );
    
    const minutes = Math.round(distance * 100); // Mock calculation
    return `${minutes} min`;
  };

  // Scroll to active activity
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentActivityIndex]);

  return (
    <Card className={cn("shadow-xl", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Day Timeline
          </CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowCompactView(!showCompactView)}
          >
            {showCompactView ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className={cn(
          "transition-all duration-300",
          showCompactView ? "h-32" : "h-96"
        )}>
          <div className="p-4 pt-0">
            {timeBlocks.map((block, blockIndex) => {
              const TimeIcon = getTimeIcon(block.startTime);
              
              return (
                <div key={blockIndex} className="relative">
                  {/* Time block header */}
                  <div className="flex items-center gap-3 mb-3">
                    <TimeIcon.icon className={cn("w-5 h-5", TimeIcon.color)} />
                    <div>
                      <p className="font-semibold text-sm">{TimeIcon.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {block.startTime} - {block.endTime}
                      </p>
                    </div>
                  </div>

                  {/* Activities in this time block */}
                  <div className="ml-8 space-y-2">
                    {block.activities.map((activity, activityIndex) => {
                      const globalIndex = activities.findIndex(a => a.id === activity.id);
                      const isActive = globalIndex === currentActivityIndex;
                      const isExpanded = expandedActivity === globalIndex;
                      
                      return (
                        <motion.div
                          key={activity.id}
                          ref={isActive ? activeRef : null}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: blockIndex * 0.1 + activityIndex * 0.05 }}
                        >
                          <div
                            className={cn(
                              "relative rounded-lg border p-3 cursor-pointer transition-all",
                              isActive && "border-primary bg-primary/5 shadow-md",
                              !isActive && "hover:bg-accent/50"
                            )}
                            onClick={() => onActivityClick(globalIndex)}
                          >
                            {/* Timeline connector */}
                            {activityIndex > 0 && (
                              <div className="absolute -top-2 left-6 w-0.5 h-2 bg-border" />
                            )}
                            
                            {/* Activity content */}
                            <div className="flex items-start gap-3">
                              {/* Activity number */}
                              <div className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                                isActive ? "bg-primary text-primary-foreground" : "bg-muted"
                              )}>
                                {globalIndex + 1}
                              </div>
                              
                              {/* Activity details */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm line-clamp-1">{activity.name}</h4>
                                
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {activity.duration || '1h'}
                                  </span>
                                  
                                  {activity.estimatedCost && (
                                    <span className="flex items-center gap-1">
                                      <DollarSign className="w-3 h-3" />
                                      {formatPrice(activity.estimatedCost)}
                                    </span>
                                  )}
                                  
                                  {activity.rating && (
                                    <span className="flex items-center gap-1">
                                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                      {activity.rating}
                                    </span>
                                  )}
                                </div>

                                {/* Expanded details */}
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="mt-2 space-y-2">
                                        {activity.description && (
                                          <p className="text-xs text-muted-foreground">
                                            {activity.description}
                                          </p>
                                        )}
                                        
                                        {activity.location?.address && (
                                          <div className="flex items-start gap-2 text-xs">
                                            <MapPin className="w-3 h-3 mt-0.5 text-muted-foreground" />
                                            <span>{activity.location.address}</span>
                                          </div>
                                        )}
                                        
                                        <div className="flex gap-2">
                                          <Button size="sm" variant="outline" className="h-7 text-xs">
                                            <Navigation className="w-3 h-3 mr-1" />
                                            Directions
                                          </Button>
                                          <Button size="sm" variant="outline" className="h-7 text-xs">
                                            <Camera className="w-3 h-3 mr-1" />
                                            Photos
                                          </Button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                {/* Tags */}
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {activity.type}
                                  </Badge>
                                  
                                  {activity.bookingRequired && (
                                    <Badge variant="destructive" className="text-xs">
                                      Booking Required
                                    </Badge>
                                  )}
                                  
                                  {activity.photos && activity.photos.length > 0 && (
                                    <Badge variant="outline" className="text-xs gap-1">
                                      <Camera className="w-3 h-3" />
                                      {activity.photos.length}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Expand/collapse button */}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedActivity(isExpanded ? null : globalIndex);
                                }}
                              >
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </Button>
                            </div>
                          </div>

                          {/* Travel time to next activity */}
                          {globalIndex < activities.length - 1 && (
                            <div className="ml-6 my-2 flex items-center gap-2 text-xs text-muted-foreground">
                              <div className="w-0.5 h-4 bg-border" />
                              <Car className="w-3 h-3" />
                              <span>{getTravelTime(activity, activities[globalIndex + 1]) || '10 min'}</span>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Separator between time blocks */}
                  {blockIndex < timeBlocks.length - 1 && (
                    <div className="my-4 ml-8 border-t border-dashed" />
                  )}
                </div>
              );
            })}

            {/* Day summary */}
            <div className="mt-6 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Activities</p>
                  <p className="font-semibold">{activities.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Est. Total Cost</p>
                  <p className="font-semibold">
                    {formatPrice(
                      activities.reduce((sum, a) => sum + (a.estimatedCost || 0), 0)
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}