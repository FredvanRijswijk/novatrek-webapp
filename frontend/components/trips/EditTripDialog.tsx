'use client';

import { useState } from 'react';
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
import { Trip } from '@/types/travel';
import { format } from 'date-fns';
import { CalendarIcon, MapPin, Users } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { TripModelEnhanced as TripModel } from '@/lib/models/trip-enhanced';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // Update in database
      if (trip.id) {
        await TripModel.update(trip.id, updatedTrip);
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !editedTrip.startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editedTrip.startDate ? format(editedTrip.startDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editedTrip.startDate}
                    onSelect={(date) => date && setEditedTrip({ ...editedTrip, startDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !editedTrip.endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editedTrip.endDate ? format(editedTrip.endDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editedTrip.endDate}
                    onSelect={(date) => date && setEditedTrip({ ...editedTrip, endDate: date })}
                    disabled={(date) => date < editedTrip.startDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

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