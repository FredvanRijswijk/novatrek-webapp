'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trip, TripDestination } from '@/types/travel';
import { format, differenceInDays } from 'date-fns';
import { CalendarIcon, MapPin, Users, AlertCircle, Info } from 'lucide-react';
import { Calendar, DateRange } from '@/components/ui/calendar-range';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { TripModelEnhanced as TripModel } from '@/lib/models/trip-enhanced';
import { DayModelV2 } from '@/lib/models/v2/day-model-v2';
import { ActivityModelV2 } from '@/lib/models/v2/activity-model-v2';

interface EditTripDialogProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (trip: Trip) => void;
}

export function EditTripDialog({ trip, isOpen, onClose, onUpdate }: EditTripDialogProps) {
  const [editedTrip, setEditedTrip] = useState({
    title: trip.title,
    description: trip.description || '',
    startDate: new Date(trip.startDate),
    endDate: new Date(trip.endDate),
    budget: trip.budget?.total || 0,
    currency: trip.budget?.currency || 'USD',
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(trip.startDate),
    to: new Date(trip.endDate),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateWarning, setDateWarning] = useState<string | null>(null);
  const [adjustedDestinations, setAdjustedDestinations] = useState<TripDestination[] | null>(null);

  // Sync date range with edited trip dates
  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      setEditedTrip(prev => ({
        ...prev,
        startDate: dateRange.from!,
        endDate: dateRange.to!,
      }));
    }
  }, [dateRange]);

  // Check if destination dates need adjustment when trip dates change
  useEffect(() => {
    if (!trip.destinations || trip.destinations.length === 0) {
      setDateWarning(null);
      setAdjustedDestinations(null);
      return;
    }

    const conflicts: string[] = [];
    const needsAdjustment: TripDestination[] = [];

    trip.destinations.forEach((dest, index) => {
      const arrivalDate = new Date(dest.arrivalDate);
      const departureDate = new Date(dest.departureDate);
      
      // Check if destination dates fall outside new trip dates
      if (arrivalDate < editedTrip.startDate || departureDate > editedTrip.endDate) {
        conflicts.push(`${dest.destination.name} (${format(arrivalDate, 'MMM d')} - ${format(departureDate, 'MMM d')})`);
        
        // Calculate adjusted dates
        const destDuration = differenceInDays(departureDate, arrivalDate);
        let newArrival = new Date(arrivalDate);
        let newDeparture = new Date(departureDate);

        // If arrival is before new start date, shift to start date
        if (arrivalDate < editedTrip.startDate) {
          newArrival = new Date(editedTrip.startDate);
          newDeparture = new Date(editedTrip.startDate);
          newDeparture.setDate(newDeparture.getDate() + destDuration);
        }

        // If departure is after new end date, shift back
        if (newDeparture > editedTrip.endDate) {
          newDeparture = new Date(editedTrip.endDate);
          newArrival = new Date(editedTrip.endDate);
          newArrival.setDate(newArrival.getDate() - destDuration);
        }

        needsAdjustment.push({
          ...dest,
          arrivalDate: newArrival,
          departureDate: newDeparture
        });
      } else {
        needsAdjustment.push(dest);
      }
    });

    if (conflicts.length > 0) {
      setDateWarning(`The following destinations fall outside the new trip dates and will be adjusted: ${conflicts.join(', ')}`);
      setAdjustedDestinations(needsAdjustment);
    } else {
      setDateWarning(null);
      setAdjustedDestinations(null);
    }
  }, [editedTrip.startDate, editedTrip.endDate, trip.destinations]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate dates
      if (editedTrip.startDate > editedTrip.endDate) {
        setError('End date must be after start date');
        return;
      }

      const updatedTrip: Partial<Trip> = {
        title: editedTrip.title,
        description: editedTrip.description,
        startDate: editedTrip.startDate,
        endDate: editedTrip.endDate,
        budget: trip.budget ? {
          ...trip.budget,
          total: editedTrip.budget,
          currency: editedTrip.currency,
        } : {
          total: editedTrip.budget,
          currency: editedTrip.currency,
          breakdown: {
            accommodation: 0,
            transportation: 0,
            food: 0,
            activities: 0,
            miscellaneous: 0,
          }
        }
      };

      // Include adjusted destinations if dates were changed
      if (adjustedDestinations) {
        updatedTrip.destinations = adjustedDestinations;
      }

      // Update in database
      if (trip.id) {
        await TripModel.update(trip.id, updatedTrip);
        
        // Check if dates have changed
        const datesChanged = 
          trip.startDate.toISOString().split('T')[0] !== editedTrip.startDate.toISOString().split('T')[0] ||
          trip.endDate.toISOString().split('T')[0] !== editedTrip.endDate.toISOString().split('T')[0];
        
        if (datesChanged) {
          // Update days for the new date range
          const dayModel = new DayModelV2();
          const destinationInfo = trip.destinations?.[0] || trip.destination;
          
          const result = await dayModel.updateDaysForNewDateRange(
            trip.id,
            editedTrip.startDate.toISOString(),
            editedTrip.endDate.toISOString(),
            destinationInfo?.id,
            destinationInfo?.name
          );
          
          console.log('Day update result:', result);
          
          // If there are days with activities outside the new range, show a warning but still close
          if (result.daysWithActivitiesOutsideRange.length > 0) {
            const activityCount = result.daysWithActivitiesOutsideRange.reduce(
              (sum, day) => sum + day.stats.activityCount, 
              0
            );
            
            // Show a more detailed warning
            const daysDetails = result.daysWithActivitiesOutsideRange
              .map(day => format(new Date(day.date), 'MMM d'))
              .join(', ');
            
            alert(
              `⚠️ Important: ${result.daysWithActivitiesOutsideRange.length} days with ${activityCount} activities are now outside the new trip dates.\n\n` +
              `Affected days: ${daysDetails}\n\n` +
              `Please visit your itinerary to move or remove these activities.`
            );
          }
          
          // Log the update results
          if (result.created > 0 || result.deleted > 0) {
            console.log(`Days updated: ${result.created} created, ${result.deleted} deleted, ${result.preserved} preserved`);
          }
        }
      }

      // Update local state
      onUpdate({
        ...trip,
        ...updatedTrip,
      } as Trip);

      onClose();
    } catch (err) {
      console.error('Error updating trip:', err);
      setError('Failed to update trip. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit Trip Details</DialogTitle>
          <DialogDescription>
            Make changes to your trip information
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {dateWarning && (
            <Alert className="border-orange-200 dark:border-orange-800">
              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertTitle>Destination dates will be adjusted</AlertTitle>
              <AlertDescription className="mt-2">
                {dateWarning}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Trip Title</Label>
            <Input
              id="title"
              value={editedTrip.title}
              onChange={(e) => setEditedTrip({ ...editedTrip, title: e.target.value })}
              placeholder="My Amazing Trip"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={editedTrip.description}
              onChange={(e) => setEditedTrip({ ...editedTrip, description: e.target.value })}
              placeholder="Add a description for your trip..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Travel Dates</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dateRange && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'LLL dd, y')} -{' '}
                        {format(dateRange.to, 'LLL dd, y')}
                      </>
                    ) : (
                      format(dateRange.from, 'LLL dd, y')
                    )
                  ) : (
                    <span>Pick your travel dates</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Show day changes preview */}
          {dateRange?.from && dateRange?.to && (
            (trip.startDate.toISOString().split('T')[0] !== dateRange.from.toISOString().split('T')[0] ||
             trip.endDate.toISOString().split('T')[0] !== dateRange.to.toISOString().split('T')[0]) && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Itinerary will be updated</AlertTitle>
                <AlertDescription>
                  <ul className="text-sm space-y-1 mt-2">
                    <li>• Days will be regenerated for the new date range</li>
                    <li>• Existing activities will be preserved</li>
                    <li>• Days with activities outside the new range will be flagged for review</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Budget</Label>
              <Input
                id="budget"
                type="number"
                value={editedTrip.budget}
                onChange={(e) => setEditedTrip({ ...editedTrip, budget: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={editedTrip.currency}
                onChange={(e) => setEditedTrip({ ...editedTrip, currency: e.target.value })}
                placeholder="USD"
              />
            </div>
          </div>

          {/* Trip Summary */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="font-medium text-sm">Trip Summary</h4>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {trip.destinations && trip.destinations.length > 0
                  ? trip.destinations.map(d => d.destination?.name).filter(Boolean).join(' → ')
                  : trip.destination?.name || 'No destination'
                }
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarIcon className="h-3 w-3" />
                {editedTrip.startDate && editedTrip.endDate && (
                  <span>
                    {Math.ceil((editedTrip.endDate.getTime() - editedTrip.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-3 w-3" />
                {trip.travelers.length} {trip.travelers.length === 1 ? 'traveler' : 'travelers'}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}