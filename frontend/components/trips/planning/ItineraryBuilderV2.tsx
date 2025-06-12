'use client';

import { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, MapPin, MoreVertical, GripVertical, Edit2, Trash2, Copy, CalendarPlus, Star } from 'lucide-react';
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
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { ActivitySearchModal } from './ActivitySearchModal';
import { WeatherDisplay } from '../WeatherDisplay';
import { normalizeDate, parseDate, formatDate, isSameDateAny } from '@/lib/utils/date-helpers';
import { FullTripData, DayWithActivities } from '@/lib/services/trip-service-v2';
import { ActivityV2, DayV2 } from '@/types/travel-v2';
import { ActivityModelV2 } from '@/lib/models/v2/activity-model-v2';
import { DayModelV2 } from '@/lib/models/v2/day-model-v2';
import { TripServiceV2 } from '@/lib/services/trip-service-v2';
import { toast } from 'sonner';

interface ItineraryBuilderV2Props {
  fullTripData: FullTripData;
  onUpdate: () => Promise<void>;
}

interface EditActivityDialogProps {
  activity: ActivityV2 | null;
  onClose: () => void;
  onSave: (activity: ActivityV2) => Promise<void>;
}

function EditActivityDialog({ activity, onClose, onSave }: EditActivityDialogProps) {
  const [editedActivity, setEditedActivity] = useState<ActivityV2 | null>(activity);

  useEffect(() => {
    setEditedActivity(activity);
  }, [activity]);

  if (!activity || !editedActivity) return null;

  const handleSave = async () => {
    if (editedActivity) {
      await onSave(editedActivity);
      onClose();
    }
  };

  return (
    <Dialog open={!!activity} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
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
                value={editedActivity.startTime || editedActivity.time || ''}
                onChange={(e) => setEditedActivity({ ...editedActivity, startTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={editedActivity.endTime || ''}
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

export function ItineraryBuilderV2({ fullTripData, onUpdate }: ItineraryBuilderV2Props) {
  const { trip, days } = fullTripData;
  const [selectedDay, setSelectedDay] = useState<DayWithActivities | null>(null);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityV2 | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const activityModel = new ActivityModelV2();
  const dayModel = new DayModelV2();
  const tripService = new TripServiceV2();

  // Select first day by default and sync selected day when days change
  useEffect(() => {
    if (!selectedDay && days.length > 0) {
      setSelectedDay(days[0]);
    } else if (selectedDay) {
      // Update selected day with fresh data when days change
      const updatedDay = days.find(d => d.id === selectedDay.id);
      if (updatedDay) {
        setSelectedDay(updatedDay);
      }
    }
  }, [days]);

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

  const handleSelectActivity = async (activity: any) => {
    if (!selectedDay) return;

    console.log('handleSelectActivity - selectedDay:', {
      id: selectedDay.id,
      tripId: trip.id,
      date: selectedDay.date,
      activities: selectedDay.activities?.length || 0
    });

    try {
      setError(null);
      setLoading(true);

      // Map the activity from search result to V2 format
      const activityData = {
        name: activity.name,
        description: activity.description,
        type: mapActivityType(activity.type),
        category: activity.type,
        location: {
          lat: activity.location.lat,
          lng: activity.location.lng,
          address: activity.location.address,
          placeId: activity.id
        },
        startTime: activity.startTime || '10:00',
        time: activity.startTime || '10:00',
        duration: activity.duration || 120,
        cost: activity.cost ? {
          amount: activity.cost.amount,
          currency: activity.cost.currency || trip.budget?.currency || 'USD',
          perPerson: activity.cost.perPerson
        } : undefined,
        photos: activity.photos,
        rating: activity.rating,
        status: 'planned' as const,
        novatrekEnhanced: true
      };

      // Create the activity using V2 model
      await activityModel.createActivity(
        trip.id,
        selectedDay.id,
        activityData
      );

      // Update day stats - skip for now as it's not critical
      // The stats will be recalculated when the page refreshes
      // try {
      //   await dayModel.updateStats(trip.id, selectedDay.id, {
      //     activityCount: selectedDay.activities.length + 1,
      //     totalCost: (selectedDay.stats?.totalCost || 0) + (activity.cost?.amount || 0)
      //   });
      // } catch (statsError) {
      //   console.error('Error updating day stats:', statsError);
      //   // Continue anyway - the activity was created successfully
      // }

      setIsAddingActivity(false);
      toast.success('Activity added successfully');
      await onUpdate();
    } catch (err) {
      console.error('Error adding activity:', err);
      setError('Failed to add activity. Please try again.');
      toast.error('Failed to add activity');
    } finally {
      setLoading(false);
    }
  };

  const handleEditActivity = (activity: ActivityV2) => {
    setEditingActivity(activity);
  };

  const handleSaveActivity = async (updatedActivity: ActivityV2) => {
    if (!selectedDay) return;

    try {
      setLoading(true);
      await activityModel.update(updatedActivity.id, updatedActivity, [trip.id, selectedDay.id]);
      setEditingActivity(null);
      toast.success('Activity updated successfully');
      await onUpdate();
    } catch (err) {
      console.error('Error updating activity:', err);
      toast.error('Failed to update activity');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveActivity = async (dayId: string, activityId: string) => {
    try {
      setLoading(true);
      await activityModel.delete(activityId, [trip.id, dayId]);
      
      // Update day stats - skip for now as it's not critical
      // The stats will be recalculated when the page refreshes
      // const day = days.find(d => d.id === dayId);
      // if (day) {
      //   await dayModel.updateStats(trip.id, dayId, {
      //     activityCount: Math.max(0, (day.stats?.activityCount || 0) - 1)
      //   });
      // }
      
      toast.success('Activity removed successfully');
      await onUpdate();
    } catch (err) {
      console.error('Error removing activity:', err);
      toast.error('Failed to remove activity');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateActivity = async (dayId: string, activity: ActivityV2) => {
    try {
      setLoading(true);
      const { id, createdAt, updatedAt, ...activityData } = activity;
      
      await activityModel.createActivity(
        trip.id,
        dayId,
        {
          ...activityData,
          name: `${activity.name} (Copy)`
        }
      );
      
      toast.success('Activity duplicated successfully');
      await onUpdate();
    } catch (err) {
      console.error('Error duplicating activity:', err);
      toast.error('Failed to duplicate activity');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveActivity = async (activityId: string, fromDayId: string, toDayId: string) => {
    try {
      setLoading(true);
      await activityModel.moveToDay(trip.id, fromDayId, toDayId, activityId);
      
      // Update stats for both days
      await Promise.all([
        dayModel.updateStats(trip.id, fromDayId, {
          activityCount: Math.max(0, days.find(d => d.id === fromDayId)?.activities.length || 0)
        }),
        dayModel.updateStats(trip.id, toDayId, {
          activityCount: (days.find(d => d.id === toDayId)?.activities.length || 0) + 1
        })
      ]);
      
      toast.success('Activity moved successfully');
      await onUpdate();
    } catch (err) {
      console.error('Error moving activity:', err);
      toast.error('Failed to move activity');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedDay) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No days available. Please create trip days first.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      {/* Day Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trip Days</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="p-4 space-y-2">
              {days.map((day) => {
                const isSelected = selectedDay && day.id === selectedDay.id;
                const activityCount = day.activities.length;

                return (
                  <button
                    key={day.id}
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      isSelected && "bg-accent text-accent-foreground"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">Day {day.dayNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(day.date, 'EEE, MMM d')}
                        </div>
                        {day.weather && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {day.weather.temperature}°C • {day.weather.condition}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {activityCount > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {activityCount}
                          </Badge>
                        )}
                        {day.type === 'travel' && (
                          <Badge variant="outline" className="text-xs">
                            Travel
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Day Details */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle>Day {selectedDay.dayNumber}</CardTitle>
                <CardDescription>
                  {formatDate(selectedDay.date, 'EEEE, MMMM d, yyyy')}
                  {selectedDay.destinationName && ` • ${selectedDay.destinationName}`}
                </CardDescription>
              </div>
              
              {/* Weather Display */}
              {selectedDay.weather && (
                <div className="mr-4">
                  <WeatherDisplay
                    weather={{
                      date: new Date(selectedDay.date),
                      temp: selectedDay.weather.temperature,
                      condition: selectedDay.weather.condition.toLowerCase() as any,
                      description: selectedDay.weather.condition,
                      icon: '',
                      windSpeed: selectedDay.weather.windSpeed,
                      humidity: 0,
                      precipitation: selectedDay.weather.precipitation
                    }}
                    compact
                  />
                </div>
              )}
              
              <Button onClick={handleAddActivity} disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                Add Activity
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-lg">
                {error}
              </div>
            )}

            {selectedDay.activities.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">
                  No activities planned for this day yet
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleAddActivity}
                  disabled={loading}
                >
                  Add your first activity
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDay.activities
                  .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
                  .map((activity) => (
                    <Card key={activity.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "text-xs",
                                  getActivityTypeColor(activity.type)
                                )}
                              >
                                {activity.type}
                              </Badge>
                              {activity.expertRecommended && (
                                <Badge variant="outline" className="text-xs">
                                  <Star className="mr-1 h-3 w-3" />
                                  Expert Pick
                                </Badge>
                              )}
                              {activity.novatrekEnhanced && (
                                <Badge variant="secondary" className="text-xs">
                                  AI Enhanced
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-semibold">{activity.name}</h4>
                            {activity.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {activity.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              {(activity.startTime || activity.time) && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {activity.startTime || activity.time}
                                  {activity.endTime && ` - ${activity.endTime}`}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {activity.location.address}
                              </span>
                              {activity.cost && (
                                <span>
                                  {activity.cost.currency} {activity.cost.amount}
                                  {activity.cost.perPerson && ' pp'}
                                </span>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={loading}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditActivity(activity)}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicateActivity(selectedDay.id, activity)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleRemoveActivity(selectedDay.id, activity.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}

            {selectedDay.notes && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm">{selectedDay.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Search Modal */}
      <ActivitySearchModal
        isOpen={isAddingActivity}
        onClose={() => setIsAddingActivity(false)}
        onSelect={handleSelectActivity}
        destination={trip.destinationName || trip.destinations?.[0]?.destination?.name || 'Unknown'}
        location={trip.destinationCoordinates}
        tripId={trip.id}
        date={parseDate(selectedDay.date)}
      />

      {/* Edit Activity Dialog */}
      <EditActivityDialog
        activity={editingActivity}
        onClose={() => setEditingActivity(null)}
        onSave={handleSaveActivity}
      />
    </div>
  );
}

// Helper function to map activity types
function mapActivityType(type: string): ActivityV2['type'] {
  const typeMap: Record<string, ActivityV2['type']> = {
    'restaurant': 'dining',
    'food': 'dining',
    'museum': 'sightseeing',
    'landmark': 'sightseeing',
    'hotel': 'accommodation',
    'transport': 'transport',
    'transit': 'transport'
  };
  
  return typeMap[type.toLowerCase()] || 'activity';
}