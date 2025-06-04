'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, MapPin, Users, Plus, Minus } from 'lucide-react';
import { Destination } from '@/types/travel';

interface DestinationDateStepProps {
  formData: any;
  updateFormData: (updates: any) => void;
}

export function DestinationDateStep({ formData, updateFormData }: DestinationDateStepProps) {
  const [destinationSearch, setDestinationSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Mock destination suggestions - In production, this would be from Google Places API
  const destinationSuggestions: Destination[] = [
    {
      id: 'paris-france',
      name: 'Paris',
      country: 'France',
      city: 'Paris',
      coordinates: { lat: 48.8566, lng: 2.3522 },
      timeZone: 'Europe/Paris',
      currency: 'EUR',
      language: ['fr', 'en'],
      description: 'The City of Light',
      imageUrl: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52'
    },
    {
      id: 'tokyo-japan',
      name: 'Tokyo',
      country: 'Japan',
      city: 'Tokyo',
      coordinates: { lat: 35.6762, lng: 139.6503 },
      timeZone: 'Asia/Tokyo',
      currency: 'JPY',
      language: ['ja', 'en'],
      description: 'Modern metropolis meets traditional culture',
      imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf'
    },
    {
      id: 'bali-indonesia',
      name: 'Bali',
      country: 'Indonesia',
      city: 'Denpasar',
      coordinates: { lat: -8.4095, lng: 115.1889 },
      timeZone: 'Asia/Makassar',
      currency: 'IDR',
      language: ['id', 'en'],
      description: 'Tropical paradise with rich culture',
      imageUrl: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2'
    },
    {
      id: 'new-york-usa',
      name: 'New York City',
      country: 'United States',
      city: 'New York',
      coordinates: { lat: 40.7128, lng: -74.0060 },
      timeZone: 'America/New_York',
      currency: 'USD',
      language: ['en'],
      description: 'The city that never sleeps',
      imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9'
    }
  ];

  const filteredSuggestions = destinationSuggestions.filter(dest =>
    dest.name.toLowerCase().includes(destinationSearch.toLowerCase()) ||
    dest.country.toLowerCase().includes(destinationSearch.toLowerCase())
  );

  const selectDestination = (destination: Destination) => {
    updateFormData({ destination });
    setDestinationSearch(destination.name + ', ' + destination.country);
    setShowSuggestions(false);
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
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-500" />
          <Label className="text-lg font-semibold">Where are you going? *</Label>
        </div>
        
        <div className="relative">
          <Input
            placeholder="Search for a destination..."
            value={destinationSearch}
            onChange={(e) => {
              setDestinationSearch(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
          />
          
          {showSuggestions && destinationSearch && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredSuggestions.map((destination) => (
                <button
                  key={destination.id}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  onClick={() => selectDestination(destination)}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={destination.imageUrl} 
                      alt={destination.name}
                      className="w-12 h-12 rounded-md object-cover"
                    />
                    <div>
                      <div className="font-medium">{destination.name}</div>
                      <div className="text-sm text-gray-500">{destination.country}</div>
                      <div className="text-xs text-gray-400">{destination.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {formData.destination && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <img 
                  src={formData.destination.imageUrl} 
                  alt={formData.destination.name}
                  className="w-16 h-16 rounded-md object-cover"
                />
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

      {/* Date Selection */}
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
            />
          </div>
          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={formatDate(formData.endDate)}
              onChange={(e) => updateFormData({ endDate: parseDate(e.target.value) })}
              min={formData.startDate ? formatDate(formData.startDate) : new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {formData.startDate && formData.endDate && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Trip duration: {Math.ceil((formData.endDate.getTime() - formData.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} days
          </div>
        )}
      </div>

      {/* Travelers */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <Label className="text-lg font-semibold">Who's traveling?</Label>
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
      </div>
    </div>
  );
}