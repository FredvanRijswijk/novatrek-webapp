'use client';

import { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, MapPin, MoreVertical, GripVertical, Edit2, Trash2, Copy, CalendarPlus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trip, DayItinerary, Activity } from '@/types/travel';
import { format, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { ActivitySearchModal } from './ActivitySearchModal';
import { TripModel } from '@/lib/models/trip';

interface ItineraryBuilderProps {
  trip: Trip;
  onUpdate: (trip: Trip) => void;
}

interface DayInfo {
  date: Date;
  dayNumber: number;
  type: 'travel' | 'destination';
  fromDestination?: string;
  toDestination?: string;
  destinationId?: string;
  destinationName?: string;
}

interface EditActivityDialogProps {
  activity: Activity;
  isOpen: boolean;
  onClose: () => void;
  onSave: (activity: Activity) => void;
}

function EditActivityDialog({ activity, isOpen, onClose, onSave }: EditActivityDialogProps) {
  const [editedActivity, setEditedActivity] = useState(activity);

  const handleSave = () => {
    onSave(editedActivity);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Activity</DialogTitle>
          <DialogDescription>
            Make changes to your activity details
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={editedActivity.name}
              onChange={(e) => setEditedActivity({ ...editedActivity, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={editedActivity.description || ''}
              onChange={(e) => setEditedActivity({ ...editedActivity, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={typeof editedActivity.startTime === 'string' ? editedActivity.startTime : ''}
                onChange={(e) => setEditedActivity({ ...editedActivity, startTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={typeof editedActivity.endTime === 'string' ? editedActivity.endTime : ''}
                onChange={(e) => setEditedActivity({ ...editedActivity, endTime: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select 
              value={editedActivity.type} 
              onValueChange={(value) => setEditedActivity({ ...editedActivity, type: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sightseeing">Sightseeing</SelectItem>
                <SelectItem value="dining">Dining</SelectItem>
                <SelectItem value="activity">Activity</SelectItem>
                <SelectItem value="transport">Transport</SelectItem>
                <SelectItem value="accommodation">Accommodation</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {editedActivity.cost && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  value={editedActivity.cost.amount}
                  onChange={(e) => setEditedActivity({ 
                    ...editedActivity, 
                    cost: { 
                      ...editedActivity.cost!, 
                      amount: parseFloat(e.target.value) || 0 
                    } 
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={editedActivity.cost.currency}
                  onChange={(e) => setEditedActivity({ 
                    ...editedActivity, 
                    cost: { 
                      ...editedActivity.cost!, 
                      currency: e.target.value 
                    } 
                  })}
                />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ItineraryBuilder({ trip, onUpdate }: ItineraryBuilderProps) {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddDayDialog, setShowAddDayDialog] = useState(false);
  const [newDayDate, setNewDayDate] = useState<string>('');

  // Generate all days in the trip with travel days
  const generateTripDaysWithTravel = (): DayInfo[] => {
    const days: DayInfo[] = [];
    let dayNumber = 1;
    
    if (trip.destinations && trip.destinations.length > 0) {
      // Multi-destination trip with travel days
      trip.destinations.forEach((dest, index) => {
        // Skip if no destination or invalid dates
        if (!dest.destination || !dest.arrivalDate || !dest.departureDate) return;
        
        const arrivalDate = new Date(dest.arrivalDate);
        const departureDate = new Date(dest.departureDate);
        
        // Check if dates are valid
        if (isNaN(arrivalDate.getTime()) || isNaN(departureDate.getTime())) return;
        
        // Add travel day if not the first destination
        if (index > 0) {
          const prevDest = trip.destinations![index - 1];
          if (prevDest?.destination) {
            days.push({
              date: arrivalDate,
              dayNumber: dayNumber++,
              type: 'travel',
              fromDestination: prevDest.destination.name,
              toDestination: dest.destination.name,
            });
          }
        }
        
        // Add destination days
        try {
          const destDays = eachDayOfInterval({
            start: index === 0 ? arrivalDate : new Date(arrivalDate.getTime() + 24 * 60 * 60 * 1000),
            end: departureDate,
          });
          
          destDays.forEach(date => {
            days.push({
              date,
              dayNumber: dayNumber++,
              type: 'destination',
              destinationId: dest.destination.id,
              destinationName: dest.destination.name,
            });
          });
        } catch (e) {
          console.error('Error creating day interval:', e);
        }
      });
    } else if (trip.destination && trip.startDate && trip.endDate) {
      // Single destination trip
      try {
        const startDate = new Date(trip.startDate);
        const endDate = new Date(trip.endDate);
        
        // Check if dates are valid
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          const tripDays = eachDayOfInterval({
            start: startDate,
            end: endDate,
          });
          
          tripDays.forEach((date, index) => {
            days.push({
              date,
              dayNumber: index + 1,
              type: 'destination',
              destinationId: trip.destination!.id,
              destinationName: trip.destination!.name,
            });
          });
        }
      } catch (e) {
        console.error('Error creating trip days:', e);
      }
    }
    
    return days;
  };
  
  const tripDays = generateTripDaysWithTravel();

  // Initialize itinerary days if not present
  useEffect(() => {
    if (!trip.itinerary || trip.itinerary.length === 0) {
      const initialItinerary: DayItinerary[] = tripDays.map((dayInfo) => ({
        id: `day_${dayInfo.dayNumber}`,
        tripId: trip.id || '',
        dayNumber: dayInfo.dayNumber,
        date: dayInfo.date,
        destinationId: dayInfo.destinationId,
        activities: [],
        notes: dayInfo.type === 'travel' 
          ? `Travel from ${dayInfo.fromDestination} to ${dayInfo.toDestination}`
          : '',
      }));

      onUpdate({
        ...trip,
        itinerary: initialItinerary,
      });
    }

    // Select first day by default
    if (!selectedDay && tripDays.length > 0 && tripDays[0].date) {
      setSelectedDay(tripDays[0].date);
    }
  }, [trip, tripDays, selectedDay, onUpdate]);

  const getItineraryDay = (date: Date): DayItinerary | undefined => {
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

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
  };

  const handleSaveActivity = async (updatedActivity: Activity) => {
    if (!selectedDayData) return;

    try {
      const updatedItinerary = trip.itinerary?.map(day => {
        if (day.id === selectedDayData.id) {
          return {
            ...day,
            activities: day.activities.map(a => 
              a.id === updatedActivity.id ? updatedActivity : a
            ),
          };
        }
        return day;
      });

      const updatedTrip = {
        ...trip,
        itinerary: updatedItinerary,
      };

      onUpdate(updatedTrip);

      if (trip.id) {
        await TripModel.update(trip.id, { itinerary: updatedItinerary });
      }

      setEditingActivity(null);
    } catch (err) {
      console.error('Error updating activity:', err);
      setError('Failed to update activity. Please try again.');
    }
  };

  const handleRemoveActivity = async (dayId: string, activityId: string) => {
    try {
      const updatedItinerary = trip.itinerary?.map(day => {
        if (day.id === dayId) {
          return {
            ...day,
            activities: day.activities.filter(a => a.id !== activityId),
          };
        }
        return day;
      });

      const updatedTrip = {
        ...trip,
        itinerary: updatedItinerary,
      };

      onUpdate(updatedTrip);

      if (trip.id) {
        await TripModel.update(trip.id, { itinerary: updatedItinerary });
      }
    } catch (err) {
      console.error('Error removing activity:', err);
      setError('Failed to remove activity. Please try again.');
    }
  };

  const handleDuplicateActivity = async (dayId: string, activity: Activity) => {
    try {
      const updatedItinerary = trip.itinerary?.map(day => {
        if (day.id === dayId) {
          const duplicatedActivity = {
            ...activity,
            id: `${activity.id}_copy_${Date.now()}`,
            name: `${activity.name} (Copy)`
          };
          return {
            ...day,
            activities: [...day.activities, duplicatedActivity],
          };
        }
        return day;
      });

      const updatedTrip = {
        ...trip,
        itinerary: updatedItinerary,
      };

      onUpdate(updatedTrip);

      if (trip.id) {
        await TripModel.update(trip.id, { itinerary: updatedItinerary });
      }
    } catch (err) {
      console.error('Error duplicating activity:', err);
      setError('Failed to duplicate activity. Please try again.');
    }
  };


  const handleAddDay = async () => {
    if (!newDayDate) return;

    try {
      const date = parseISO(newDayDate);
      const newDayNumber = Math.max(...(trip.itinerary?.map(d => d.dayNumber) || [0])) + 1;
      
      const newDay: DayItinerary = {
        id: `day_${newDayNumber}_${Date.now()}`,
        tripId: trip.id || '',
        dayNumber: newDayNumber,
        date: date,
        activities: [],
        notes: '',
      };

      const updatedItinerary = [...(trip.itinerary || []), newDay].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const updatedTrip = {
        ...trip,
        itinerary: updatedItinerary,
        endDate: new Date(Math.max(
          new Date(trip.endDate).getTime(),
          date.getTime()
        ))
      };

      onUpdate(updatedTrip);

      if (trip.id) {
        await TripModel.update(trip.id, { 
          itinerary: updatedItinerary,
          endDate: updatedTrip.endDate
        });
      }

      setShowAddDayDialog(false);
      setNewDayDate('');
      setSelectedDay(date);
    } catch (err) {
      console.error('Error adding day:', err);
      setError('Failed to add day. Please try again.');
    }
  };

  const handleUpdateDayNotes = async (dayId: string, notes: string) => {
    try {
      const updatedItinerary = trip.itinerary?.map(day => {
        if (day.id === dayId) {
          return { ...day, notes };
        }
        return day;
      });

      const updatedTrip = {
        ...trip,
        itinerary: updatedItinerary,
      };

      onUpdate(updatedTrip);

      if (trip.id) {
        await TripModel.update(trip.id, { itinerary: updatedItinerary });
      }
    } catch (err) {
      console.error('Error updating day notes:', err);
      setError('Failed to update notes. Please try again.');
    }
  };

  const selectedDayData = selectedDay ? getItineraryDay(selectedDay) : null;

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Day Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Trip Days</CardTitle>
              <CardDescription>Select a day to plan</CardDescription>
            </div>
            <Button 
              size="icon" 
              variant="ghost"
              onClick={() => setShowAddDayDialog(true)}
              title="Add extra day"
            >
              <CalendarPlus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="p-4 space-y-2">
              {tripDays.map((dayInfo, index) => {
                const dayData = getItineraryDay(dayInfo.date);
                const isSelected = selectedDay && isSameDay(dayInfo.date, selectedDay);
                const activityCount = dayData?.activities?.length || 0;
                const isTravel = dayInfo.type === 'travel';

                return (
                  <button
                    key={index}
                    onClick={() => dayInfo.date && setSelectedDay(dayInfo.date)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg transition-colors',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted',
                      isTravel && 'border-l-4 border-orange-500'
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          Day {dayInfo.dayNumber}
                          {isTravel && ' - Travel'}
                        </p>
                        <p className={cn(
                          'text-sm',
                          isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                        )}>
                          {dayInfo.date && !isNaN(dayInfo.date.getTime()) 
                            ? format(dayInfo.date, 'EEE, MMM d')
                            : 'Invalid date'
                          }
                        </p>
                        {isTravel ? (
                          <p className={cn(
                            'text-xs mt-1',
                            isSelected ? 'text-primary-foreground/60' : 'text-muted-foreground'
                          )}>
                            {dayInfo.fromDestination} → {dayInfo.toDestination}
                          </p>
                        ) : (
                          <p className={cn(
                            'text-xs mt-1',
                            isSelected ? 'text-primary-foreground/60' : 'text-muted-foreground'
                          )}>
                            {dayInfo.destinationName}
                          </p>
                        )}
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
                {selectedDay && !isNaN(selectedDay.getTime()) 
                  ? `Day ${selectedDayData?.dayNumber} - ${format(selectedDay, 'EEEE, MMMM d')}`
                  : selectedDay 
                  ? `Day ${selectedDayData?.dayNumber}`
                  : 'Select a day'
                }
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

          {/* Day Notes */}
          {selectedDayData && (
            <div className="mb-6">
              <Label htmlFor="day-notes" className="text-sm font-medium mb-2">Day Notes</Label>
              <Textarea
                id="day-notes"
                placeholder="Add notes for this day..."
                value={selectedDayData.notes || ''}
                onChange={(e) => handleUpdateDayNotes(selectedDayData.id, e.target.value)}
                className="resize-none"
                rows={2}
              />
            </div>
          )}
          
          {selectedDayData?.activities && selectedDayData.activities.length > 0 ? (
            <div className="space-y-3">
              {selectedDayData.activities.map((activity) => (
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
                              {typeof activity.startTime === 'string' ? activity.startTime : format(activity.startTime, 'HH:mm')}
                              {activity.endTime && ` - ${typeof activity.endTime === 'string' ? activity.endTime : format(activity.endTime, 'HH:mm')}`}
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
                            <DropdownMenuItem onClick={() => handleEditActivity(activity)}>
                              <Edit2 className="mr-2 h-4 w-4" />
                              Edit Activity
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateActivity(selectedDayData.id, activity)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleRemoveActivity(selectedDayData.id, activity.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
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
        location={
          trip.destinations && trip.destinations.length > 0 && trip.destinations[0].destination?.coordinates
            ? trip.destinations[0].destination.coordinates
            : trip.destination?.coordinates
        }
      />
    )}

    {/* Edit Activity Dialog */}
    {editingActivity && (
      <EditActivityDialog
        activity={editingActivity}
        isOpen={!!editingActivity}
        onClose={() => setEditingActivity(null)}
        onSave={handleSaveActivity}
      />
    )}

    {/* Add Day Dialog */}
    <Dialog open={showAddDayDialog} onOpenChange={setShowAddDayDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Extra Day</DialogTitle>
          <DialogDescription>
            Add an additional day to your trip itinerary
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-day-date">Date</Label>
            <Input
              id="new-day-date"
              type="date"
              value={newDayDate}
              onChange={(e) => setNewDayDate(e.target.value)}
              min={format(new Date(trip.startDate), 'yyyy-MM-dd')}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowAddDayDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddDay} disabled={!newDayDate}>
            Add Day
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}