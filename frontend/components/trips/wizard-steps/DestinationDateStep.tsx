'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, MapPin, Users, Plus, Minus, Loader2, Trash2, ArrowRight } from 'lucide-react';
import { Destination } from '@/types/travel';
import { useGooglePlacesNew } from '@/hooks/use-google-places-new';
import { useDebounce } from '@/hooks/use-debounce';

interface DestinationDateStepProps {
  formData: any;
  updateFormData: (updates: any) => void;
  errors?: Record<string, string>;
}

export function DestinationDateStep({ formData, updateFormData, errors = {} }: DestinationDateStepProps) {
  const [isMultiDestination, setIsMultiDestination] = useState(formData.destinations.length > 0);
  const [activeDestinationIndex, setActiveDestinationIndex] = useState(0);
  
  // For single destination mode
  const [destinationSearch, setDestinationSearch] = useState(
    formData.destination ? `${formData.destination.name}, ${formData.destination.country}` : ''
  );
  
  // For multi-destination mode
  const [multiDestinationSearches, setMultiDestinationSearches] = useState<string[]>(
    formData.destinations.map((d: any) => 
      d.destination ? `${d.destination.name}, ${d.destination.country}` : ''
    )
  );
  
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<Destination[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { searchDestinations } = useGooglePlacesNew();
  const debouncedSearch = useDebounce(
    isMultiDestination ? multiDestinationSearches[activeDestinationIndex] || '' : destinationSearch, 
    300
  );

  // Search for destinations when input changes
  useEffect(() => {
    if (debouncedSearch && debouncedSearch.length > 2) {
      setIsSearching(true);
      searchDestinations(debouncedSearch)
        .then(results => {
          setSuggestions(results);
          setIsSearching(false);
        })
        .catch(err => {
          console.error('Search error:', err);
          setIsSearching(false);
        });
    } else {
      setSuggestions([]);
    }
  }, [debouncedSearch, searchDestinations]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-calculate overall trip dates based on destinations
  useEffect(() => {
    if (isMultiDestination && formData.destinations.length > 0) {
      const firstArrival = formData.destinations[0]?.arrivalDate;
      const lastDeparture = formData.destinations[formData.destinations.length - 1]?.departureDate;
      
      if (firstArrival && lastDeparture) {
        updateFormData({
          startDate: new Date(firstArrival),
          endDate: new Date(lastDeparture)
        });
      }
    }
  }, [formData.destinations, isMultiDestination]);

  const toggleMultiDestination = () => {
    if (!isMultiDestination) {
      // Convert single destination to multi-destination format
      if (formData.destination) {
        updateFormData({
          destinations: [{
            destination: formData.destination,
            arrivalDate: formData.startDate,
            departureDate: formData.endDate,
            order: 0
          }],
          destination: null
        });
        setMultiDestinationSearches([`${formData.destination.name}, ${formData.destination.country}`]);
      } else {
        // Start with empty first destination
        updateFormData({
          destinations: [{
            destination: null,
            arrivalDate: formData.startDate,
            departureDate: formData.endDate,
            order: 0
          }]
        });
        setMultiDestinationSearches(['']);
      }
    } else {
      // Convert back to single destination
      if (formData.destinations.length > 0 && formData.destinations[0].destination) {
        updateFormData({
          destination: formData.destinations[0].destination,
          destinations: [],
          startDate: formData.destinations[0].arrivalDate,
          endDate: formData.destinations[formData.destinations.length - 1]?.departureDate || formData.destinations[0].departureDate
        });
        setDestinationSearch(
          formData.destinations[0].destination 
            ? `${formData.destinations[0].destination.name}, ${formData.destinations[0].destination.country}`
            : ''
        );
      }
      setMultiDestinationSearches([]);
    }
    setIsMultiDestination(!isMultiDestination);
  };

  const selectDestination = (destination: Destination) => {
    if (isMultiDestination) {
      const updatedDestinations = [...formData.destinations];
      updatedDestinations[activeDestinationIndex] = {
        ...updatedDestinations[activeDestinationIndex],
        destination
      };
      updateFormData({ destinations: updatedDestinations });
      
      const updatedSearches = [...multiDestinationSearches];
      updatedSearches[activeDestinationIndex] = `${destination.name}, ${destination.country}`;
      setMultiDestinationSearches(updatedSearches);
    } else {
      updateFormData({ destination });
      setDestinationSearch(`${destination.name}, ${destination.country}`);
    }
    setShowSuggestions(false);
  };

  const addDestination = () => {
    const lastDestination = formData.destinations[formData.destinations.length - 1];
    const newDestination = {
      destination: null,
      arrivalDate: lastDestination?.departureDate || null,
      departureDate: null,
      order: formData.destinations.length
    };
    
    updateFormData({
      destinations: [...formData.destinations, newDestination]
    });
    setMultiDestinationSearches([...multiDestinationSearches, '']);
    setActiveDestinationIndex(formData.destinations.length);
  };

  const removeDestination = (index: number) => {
    if (formData.destinations.length > 1) {
      const updatedDestinations = formData.destinations.filter((_: any, i: number) => i !== index);
      // Reorder remaining destinations
      updatedDestinations.forEach((dest: any, i: number) => {
        dest.order = i;
      });
      
      updateFormData({ destinations: updatedDestinations });
      
      const updatedSearches = multiDestinationSearches.filter((_, i) => i !== index);
      setMultiDestinationSearches(updatedSearches);
      
      if (activeDestinationIndex >= updatedDestinations.length) {
        setActiveDestinationIndex(Math.max(0, updatedDestinations.length - 1));
      }
    }
  };

  const updateDestinationDates = (index: number, field: 'arrivalDate' | 'departureDate', value: Date | null) => {
    const updatedDestinations = [...formData.destinations];
    updatedDestinations[index] = {
      ...updatedDestinations[index],
      [field]: value
    };
    
    // Auto-adjust next destination's arrival date
    if (field === 'departureDate' && value && index < updatedDestinations.length - 1) {
      const nextDestination = updatedDestinations[index + 1];
      if (!nextDestination.arrivalDate || nextDestination.arrivalDate < value) {
        nextDestination.arrivalDate = value;
      }
    }
    
    updateFormData({ destinations: updatedDestinations });
  };

  const updateTraveler = (index: number, field: string, value: any) => {
    const updatedTravelers = [...formData.travelers];
    updatedTravelers[index] = { ...updatedTravelers[index], [field]: value };
    updateFormData({ travelers: updatedTravelers });
  };

  const addTraveler = () => {
    const newTraveler = {
      name: '',
      relationship: 'friend' as const,
      age: undefined
    };
    updateFormData({ travelers: [...formData.travelers, newTraveler] });
  };

  const removeTraveler = (index: number) => {
    if (formData.travelers.length > 1) {
      const updatedTravelers = formData.travelers.filter((_: any, i: number) => i !== index);
      updateFormData({ travelers: updatedTravelers });
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const parseDate = (dateString: string) => {
    return dateString ? new Date(dateString) : null;
  };

  return (
    <div className="space-y-8">
      {/* Destination Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-500" />
            <Label className="text-lg font-semibold">Where are you going? *</Label>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleMultiDestination}
          >
            {isMultiDestination ? 'Single Destination' : 'Multi-Destination'}
          </Button>
        </div>

        {!isMultiDestination ? (
          // Single destination mode
          <div>
            <div className="relative" ref={dropdownRef}>
              <Input
                placeholder="Search for a destination..."
                value={destinationSearch}
                onChange={(e) => {
                  setDestinationSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className={errors.destination ? 'border-red-500' : ''}
              />
            
            {showSuggestions && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                    <p className="text-sm text-gray-500 mt-2">Searching destinations...</p>
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <p className="text-sm">No destinations found</p>
                  </div>
                ) : (
                  suggestions.map((destination) => (
                  <button
                    key={destination.id}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    onClick={() => selectDestination(destination)}
                  >
                    <div className="flex items-center gap-3">
                      {destination.imageUrl && (
                        <img 
                          src={destination.imageUrl} 
                          alt={destination.name}
                          className="w-12 h-12 rounded-md object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium">{destination.name}</div>
                        <div className="text-sm text-gray-500">{destination.country}</div>
                        {destination.description && (
                          <div className="text-xs text-gray-400">{destination.description}</div>
                        )}
                      </div>
                    </div>
                  </button>
                  ))
                )}
              </div>
            )}
            </div>
            {errors.destination && (
              <p className="text-sm text-red-500 mt-1">{errors.destination}</p>
            )}
          </div>
        ) : (
          // Multi-destination mode
          <div className="space-y-4">
            {formData.destinations.map((dest: any, index: number) => (
              <Card key={index} className={`${activeDestinationIndex === index ? 'border-blue-500' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          Destination {index + 1}
                        </Label>
                        {formData.destinations.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDestination(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="relative" ref={activeDestinationIndex === index ? dropdownRef : undefined}>
                        <Input
                          placeholder="Search for a destination..."
                          value={multiDestinationSearches[index] || ''}
                          onChange={(e) => {
                            const updatedSearches = [...multiDestinationSearches];
                            updatedSearches[index] = e.target.value;
                            setMultiDestinationSearches(updatedSearches);
                            setActiveDestinationIndex(index);
                            setShowSuggestions(true);
                          }}
                          onFocus={() => {
                            setActiveDestinationIndex(index);
                            setShowSuggestions(true);
                          }}
                        />
                        
                        {showSuggestions && activeDestinationIndex === index && (
                          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {isSearching ? (
                              <div className="p-4 text-center">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                                <p className="text-sm text-gray-500 mt-2">Searching destinations...</p>
                              </div>
                            ) : suggestions.length === 0 ? (
                              <div className="p-4 text-center text-gray-500">
                                <p className="text-sm">No destinations found</p>
                              </div>
                            ) : (
                              suggestions.map((destination) => (
                              <button
                                key={destination.id}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                                onClick={() => selectDestination(destination)}
                              >
                                <div className="flex items-center gap-3">
                                  {destination.imageUrl && (
                                    <img 
                                      src={destination.imageUrl} 
                                      alt={destination.name}
                                      className="w-12 h-12 rounded-md object-cover"
                                    />
                                  )}
                                  <div>
                                    <div className="font-medium">{destination.name}</div>
                                    <div className="text-sm text-gray-500">{destination.country}</div>
                                    {destination.description && (
                                      <div className="text-xs text-gray-400">{destination.description}</div>
                                    )}
                                  </div>
                                </div>
                              </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Arrival</Label>
                          <Input
                            type="date"
                            value={formatDate(dest.arrivalDate)}
                            onChange={(e) => updateDestinationDates(index, 'arrivalDate', parseDate(e.target.value))}
                            min={index > 0 ? formatDate(formData.destinations[index - 1]?.departureDate) : new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Departure</Label>
                          <Input
                            type="date"
                            value={formatDate(dest.departureDate)}
                            onChange={(e) => updateDestinationDates(index, 'departureDate', parseDate(e.target.value))}
                            min={dest.arrivalDate ? formatDate(dest.arrivalDate) : undefined}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {index < formData.destinations.length - 1 && (
                      <ArrowRight className="h-5 w-5 text-gray-400 mt-8" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={addDestination}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Destination
            </Button>
            
            {(errors.destination || errors.destinations) && (
              <p className="text-sm text-red-500">{errors.destination || errors.destinations}</p>
            )}
          </div>
        )}

        {/* Display selected destination(s) */}
        {!isMultiDestination && formData.destination && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {formData.destination.imageUrl && (
                  <img 
                    src={formData.destination.imageUrl} 
                    alt={formData.destination.name}
                    className="w-16 h-16 rounded-md object-cover"
                  />
                )}
                <div>
                  <h3 className="font-semibold text-lg">{formData.destination.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{formData.destination.country}</p>
                  <p className="text-sm text-gray-500">{formData.destination.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Date Selection (only for single destination) */}
      {!isMultiDestination && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-500" />
            <Label className="text-lg font-semibold">When are you traveling? *</Label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formatDate(formData.startDate)}
                onChange={(e) => updateFormData({ startDate: parseDate(e.target.value) })}
                min={new Date().toISOString().split('T')[0]}
                className={errors.startDate ? 'border-red-500' : ''}
              />
              {errors.startDate && (
                <p className="text-sm text-red-500 mt-1">{errors.startDate}</p>
              )}
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formatDate(formData.endDate)}
                onChange={(e) => updateFormData({ endDate: parseDate(e.target.value) })}
                min={formData.startDate ? formatDate(formData.startDate) : new Date().toISOString().split('T')[0]}
                className={errors.endDate ? 'border-red-500' : ''}
              />
              {errors.endDate && (
                <p className="text-sm text-red-500 mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>

          {formData.startDate && formData.endDate && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Trip duration: {Math.ceil((formData.endDate.getTime() - formData.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} days
            </div>
          )}
        </div>
      )}

      {/* Overall trip duration for multi-destination */}
      {isMultiDestination && formData.startDate && formData.endDate && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Total Trip Duration</span>
              </div>
              <span className="text-lg font-semibold">
                {Math.ceil((formData.endDate.getTime() - formData.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} days
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Travelers */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <Label className="text-lg font-semibold">Who's traveling? *</Label>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addTraveler}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Traveler
          </Button>
        </div>

        <div className="space-y-3">
          {formData.travelers.map((traveler: any, index: number) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label>Name</Label>
                      <Input
                        placeholder="Full name"
                        value={traveler.name}
                        onChange={(e) => updateTraveler(index, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Relationship</Label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800"
                        value={traveler.relationship}
                        onChange={(e) => updateTraveler(index, 'relationship', e.target.value)}
                      >
                        <option value="self">Self</option>
                        <option value="partner">Partner</option>
                        <option value="family">Family</option>
                        <option value="friend">Friend</option>
                      </select>
                    </div>
                    <div>
                      <Label>Age (Optional)</Label>
                      <Input
                        type="number"
                        placeholder="Age"
                        value={traveler.age || ''}
                        onChange={(e) => updateTraveler(index, 'age', e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </div>
                  </div>
                  {formData.travelers.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeTraveler(index)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {errors.travelers && (
          <p className="text-sm text-red-500 mt-1">{errors.travelers}</p>
        )}
      </div>
    </div>
  );
}