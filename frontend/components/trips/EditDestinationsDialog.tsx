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
import { Trip, TripDestination, Destination } from '@/types/travel';
import { format } from 'date-fns';
import { 
  CalendarIcon, 
  MapPin, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { TripModel } from '@/lib/models/trip';
import { useGooglePlaces } from '@/hooks/use-google-places';

interface EditDestinationsDialogProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (trip: Trip) => void;
}

export function EditDestinationsDialog({ trip, isOpen, onClose, onUpdate }: EditDestinationsDialogProps) {
  // Initialize destinations from trip data
  const [destinations, setDestinations] = useState<TripDestination[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newDestinationSearch, setNewDestinationSearch] = useState('');
  const [selectedNewDestination, setSelectedNewDestination] = useState<Destination | null>(null);
  const [showNewDestination, setShowNewDestination] = useState(false);

  // Google Places integration
  const { searchPlaces, isLoading: isSearching } = useGooglePlaces();
  const [searchResults, setSearchResults] = useState<google.maps.places.PlaceResult[]>([]);

  useEffect(() => {
    // Initialize destinations from trip
    if (trip.destinations && trip.destinations.length > 0) {
      // Use existing destinations array
      setDestinations([...trip.destinations].sort((a, b) => a.order - b.order));
    } else if (trip.destination) {
      // Convert single destination to array format
      setDestinations([{
        destination: trip.destination,
        arrivalDate: trip.startDate,
        departureDate: trip.endDate,
        order: 0
      }]);
    } else {
      setDestinations([]);
    }
  }, [trip]);

  // Handle place search
  const handleSearch = async () => {
    if (!newDestinationSearch.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await searchPlaces(newDestinationSearch);
      setSearchResults(results);
    } catch (err) {
      console.error('Error searching places:', err);
      setError('Failed to search places. Please try again.');
    }
  };

  // Handle place selection
  const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
    if (!place.geometry?.location) return;

    const newDestination: Destination = {
      id: place.place_id || `dest-${Date.now()}`,
      name: place.name || '',
      country: getAddressComponent(place, 'country') || '',
      city: getAddressComponent(place, 'locality') || getAddressComponent(place, 'administrative_area_level_1') || '',
      coordinates: {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      },
      timeZone: '', // Would need additional API call to get timezone
      currency: '', // Would need additional logic based on country
      language: [], // Would need additional logic based on country
      description: place.formatted_address || '',
    };

    setSelectedNewDestination(newDestination);
    setSearchResults([]);
    setNewDestinationSearch('');
  };

  // Helper to extract address components
  const getAddressComponent = (place: google.maps.places.PlaceResult, type: string): string => {
    const component = place.address_components?.find(comp => 
      comp.types.includes(type)
    );
    return component?.long_name || '';
  };

  // Add new destination
  const handleAddDestination = () => {
    if (!selectedNewDestination) return;

    const lastDestination = destinations[destinations.length - 1];
    const newTripDestination: TripDestination = {
      destination: selectedNewDestination,
      arrivalDate: lastDestination ? lastDestination.departureDate : trip.startDate,
      departureDate: lastDestination 
        ? new Date(lastDestination.departureDate.getTime() + 3 * 24 * 60 * 60 * 1000) // 3 days after last destination
        : new Date(trip.startDate.getTime() + 3 * 24 * 60 * 60 * 1000),
      order: destinations.length
    };

    setDestinations([...destinations, newTripDestination]);
    setSelectedNewDestination(null);
    setShowNewDestination(false);
  };

  // Remove destination
  const handleRemoveDestination = (index: number) => {
    const newDestinations = destinations.filter((_, i) => i !== index);
    // Reorder remaining destinations
    newDestinations.forEach((dest, i) => {
      dest.order = i;
    });
    setDestinations(newDestinations);
  };

  // Move destination up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newDestinations = [...destinations];
    [newDestinations[index], newDestinations[index - 1]] = [newDestinations[index - 1], newDestinations[index]];
    newDestinations[index].order = index;
    newDestinations[index - 1].order = index - 1;
    setDestinations(newDestinations);
  };

  // Move destination down
  const handleMoveDown = (index: number) => {
    if (index === destinations.length - 1) return;
    const newDestinations = [...destinations];
    [newDestinations[index], newDestinations[index + 1]] = [newDestinations[index + 1], newDestinations[index]];
    newDestinations[index].order = index;
    newDestinations[index + 1].order = index + 1;
    setDestinations(newDestinations);
  };

  // Update destination dates
  const handleDateChange = (index: number, field: 'arrivalDate' | 'departureDate', date: Date) => {
    const newDestinations = [...destinations];
    newDestinations[index][field] = date;
    setDestinations(newDestinations);
  };

  // Validate dates
  const validateDates = (): boolean => {
    for (let i = 0; i < destinations.length; i++) {
      const dest = destinations[i];
      
      // Check if arrival is before departure
      if (dest.arrivalDate > dest.departureDate) {
        setError(`Destination ${i + 1}: Departure date must be after arrival date`);
        return false;
      }

      // Check if dates overlap with previous destination
      if (i > 0) {
        const prevDest = destinations[i - 1];
        if (dest.arrivalDate < prevDest.departureDate) {
          setError(`Destination ${i + 1}: Arrival date must be after previous destination's departure`);
          return false;
        }
      }
    }

    // Check if all destinations fit within trip dates
    if (destinations.length > 0) {
      if (destinations[0].arrivalDate < trip.startDate) {
        setError('First destination arrival must be on or after trip start date');
        return false;
      }
      if (destinations[destinations.length - 1].departureDate > trip.endDate) {
        setError('Last destination departure must be on or before trip end date');
        return false;
      }
    }

    return true;
  };

  // Save changes
  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate dates
      if (!validateDates()) {
        return;
      }

      // If there's only one destination, also update the legacy destination field
      const updatedTrip: Partial<Trip> = {
        destinations: destinations,
      };

      if (destinations.length === 1) {
        updatedTrip.destination = destinations[0].destination;
      } else if (destinations.length === 0) {
        updatedTrip.destination = undefined;
      }

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
      console.error('Error updating destinations:', err);
      setError('Failed to update destinations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Trip Destinations</DialogTitle>
          <DialogDescription>
            Manage your trip destinations and travel dates
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-md flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Existing Destinations */}
            {destinations.length > 0 ? (
              <div className="space-y-3">
                {destinations.map((dest, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium">{dest.destination.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {dest.destination.city}, {dest.destination.country}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === destinations.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDestination(index)}
                          disabled={destinations.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm">Arrival Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !dest.arrivalDate && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dest.arrivalDate ? format(dest.arrivalDate, 'PP') : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={dest.arrivalDate}
                              onSelect={(date) => date && handleDateChange(index, 'arrivalDate', date)}
                              disabled={(date) => {
                                // Disable dates before trip start
                                if (date < trip.startDate) return true;
                                // Disable dates after trip end
                                if (date > trip.endDate) return true;
                                // Disable dates before previous destination's departure
                                if (index > 0 && date < destinations[index - 1].departureDate) return true;
                                return false;
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Departure Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !dest.departureDate && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dest.departureDate ? format(dest.departureDate, 'PP') : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={dest.departureDate}
                              onSelect={(date) => date && handleDateChange(index, 'departureDate', date)}
                              disabled={(date) => {
                                // Disable dates before arrival
                                if (date < dest.arrivalDate) return true;
                                // Disable dates after trip end
                                if (date > trip.endDate) return true;
                                // Disable dates after next destination's arrival
                                if (index < destinations.length - 1 && date > destinations[index + 1].arrivalDate) return true;
                                return false;
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No destinations added yet</p>
                <p className="text-sm">Click &quot;Add Destination&quot; to get started</p>
              </div>
            )}

            {/* Add New Destination */}
            {showNewDestination && (
              <div className="border-2 border-dashed rounded-lg p-4 space-y-3">
                <h4 className="font-medium">Add New Destination</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="destination-search">Search for a destination</Label>
                  <div className="flex gap-2">
                    <Input
                      id="destination-search"
                      value={newDestinationSearch}
                      onChange={(e) => setNewDestinationSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="e.g., Paris, France"
                    />
                    <Button 
                      onClick={handleSearch}
                      disabled={isSearching || !newDestinationSearch.trim()}
                    >
                      {isSearching ? 'Searching...' : 'Search'}
                    </Button>
                  </div>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="border rounded-md max-h-48 overflow-y-auto">
                    {searchResults.map((place, index) => (
                      <button
                        key={index}
                        onClick={() => handlePlaceSelect(place)}
                        className="w-full text-left px-3 py-2 hover:bg-muted transition-colors"
                      >
                        <div className="font-medium">{place.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {place.formatted_address}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected Destination */}
                {selectedNewDestination && (
                  <div className="bg-muted rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{selectedNewDestination.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedNewDestination.city}, {selectedNewDestination.country}
                        </p>
                      </div>
                      <Button onClick={handleAddDestination} size="sm">
                        Add
                      </Button>
                    </div>
                  </div>
                )}

                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowNewDestination(false);
                    setSelectedNewDestination(null);
                    setNewDestinationSearch('');
                    setSearchResults([]);
                  }}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            )}

            {!showNewDestination && (
              <Button
                variant="outline"
                onClick={() => setShowNewDestination(true)}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Destination
              </Button>
            )}
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || destinations.length === 0}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}