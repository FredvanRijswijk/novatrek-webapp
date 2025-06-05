// Example usage of EditDestinationsDialog component

import { useState } from 'react';
import { EditDestinationsDialog } from './EditDestinationsDialog';
import { Button } from '@/components/ui/button';
import { Trip } from '@/types/travel';

export function EditDestinationsExample() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Example trip data
  const [trip, setTrip] = useState<Trip>({
    id: 'trip-123',
    userId: 'user-123',
    title: 'European Adventure',
    description: 'A multi-city tour of Europe',
    // Single destination (legacy)
    destination: {
      id: 'dest-1',
      name: 'Paris',
      country: 'France',
      city: 'Paris',
      coordinates: { lat: 48.8566, lng: 2.3522 },
      timeZone: 'Europe/Paris',
      currency: 'EUR',
      language: ['French'],
    },
    // Multi-destination support
    destinations: [
      {
        destination: {
          id: 'dest-1',
          name: 'Paris',
          country: 'France',
          city: 'Paris',
          coordinates: { lat: 48.8566, lng: 2.3522 },
          timeZone: 'Europe/Paris',
          currency: 'EUR',
          language: ['French'],
        },
        arrivalDate: new Date('2024-06-01'),
        departureDate: new Date('2024-06-05'),
        order: 0
      },
      {
        destination: {
          id: 'dest-2',
          name: 'Rome',
          country: 'Italy',
          city: 'Rome',
          coordinates: { lat: 41.9028, lng: 12.4964 },
          timeZone: 'Europe/Rome',
          currency: 'EUR',
          language: ['Italian'],
        },
        arrivalDate: new Date('2024-06-05'),
        departureDate: new Date('2024-06-09'),
        order: 1
      }
    ],
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-06-15'),
    travelers: [{ id: '1', name: 'John Doe', relationship: 'self' }],
    itinerary: [],
    status: 'planning',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const handleUpdate = (updatedTrip: Trip) => {
    setTrip(updatedTrip);
    console.log('Trip updated:', updatedTrip);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Edit Destinations Example</h2>
      
      <Button onClick={() => setIsOpen(true)}>
        Edit Destinations
      </Button>

      <EditDestinationsDialog
        trip={trip}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onUpdate={handleUpdate}
      />

      {/* Display current destinations */}
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Current Destinations:</h3>
        {trip.destinations && trip.destinations.length > 0 ? (
          <ul className="space-y-2">
            {trip.destinations.map((dest, index) => (
              <li key={index} className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                <strong>{dest.destination.name}</strong> ({dest.destination.country})
                <br />
                {dest.arrivalDate.toLocaleDateString()} - {dest.departureDate.toLocaleDateString()}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No destinations added yet</p>
        )}
      </div>
    </div>
  );
}