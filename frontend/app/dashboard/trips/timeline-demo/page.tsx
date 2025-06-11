'use client';

import { ActivityTimeline } from '@/components/trips/planning/ActivityTimeline';
import { DayContext, TimeSlot } from '@/types/chat-context';
import { Activity } from '@/types/travel';
import { toast } from 'sonner';

// Sample data for demo
const sampleDayContext: DayContext = {
  dayNumber: 1,
  date: new Date(),
  activities: [
    {
      id: '1',
      name: 'Breakfast at Café de Flore',
      type: 'dining',
      location: {
        name: 'Café de Flore',
        address: '172 Bd Saint-Germain, Paris',
        coordinates: { lat: 48.854, lng: 2.333 }
      },
      startTime: '08:30',
      duration: 60,
      cost: { amount: 30, currency: 'EUR', perPerson: true },
      dayNumber: 1,
      conflicts: [],
      weatherSuitable: true
    },
    {
      id: '2',
      name: 'Louvre Museum Visit',
      type: 'sightseeing',
      location: {
        name: 'Louvre Museum',
        address: 'Rue de Rivoli, Paris',
        coordinates: { lat: 48.861, lng: 2.336 }
      },
      startTime: '10:00',
      duration: 180,
      cost: { amount: 17, currency: 'EUR', perPerson: true },
      dayNumber: 1,
      conflicts: [],
      weatherSuitable: true
    },
    {
      id: '3',
      name: 'Seine River Cruise',
      type: 'sightseeing',
      location: {
        name: 'Port de la Bourdonnais',
        address: 'Port de la Bourdonnais, Paris',
        coordinates: { lat: 48.860, lng: 2.293 }
      },
      startTime: '14:30',
      duration: 90,
      cost: { amount: 15, currency: 'EUR', perPerson: true },
      dayNumber: 1,
      conflicts: [],
      weatherSuitable: true
    },
    {
      id: '4',
      name: 'Dinner at Le Comptoir',
      type: 'dining',
      location: {
        name: 'Le Comptoir du Relais',
        address: '9 Carrefour de l\'Odéon, Paris',
        coordinates: { lat: 48.851, lng: 2.339 }
      },
      startTime: '19:30',
      duration: 120,
      cost: { amount: 60, currency: 'EUR', perPerson: true },
      dayNumber: 1,
      conflicts: [],
      weatherSuitable: true
    },
    // Add a conflicting activity for demo
    {
      id: '5',
      name: 'Conflicting Event',
      type: 'shopping',
      location: {
        name: 'Galeries Lafayette',
        address: '40 Bd Haussmann, Paris',
        coordinates: { lat: 48.873, lng: 2.332 }
      },
      startTime: '14:00',
      duration: 120,
      dayNumber: 1,
      conflicts: ['Seine River Cruise'],
      weatherSuitable: true
    }
  ] as any[],
  accommodations: [],
  transportation: [],
  totalCost: 122,
  freeTimeSlots: [
    { start: '06:00', end: '08:30', duration: 150 },
    { start: '09:30', end: '10:00', duration: 30 },
    { start: '13:00', end: '14:00', duration: 60 },
    { start: '16:00', end: '19:30', duration: 210 },
    { start: '21:30', end: '23:00', duration: 90 }
  ],
  hasBreakfast: true,
  hasLunch: false,
  hasDinner: true
};

export default function TimelineDemoPage() {
  const handleAddActivity = (timeSlot: TimeSlot) => {
    toast.success(`Add activity clicked for ${timeSlot.start} - ${timeSlot.end} (${timeSlot.duration} minutes)`);
  };

  const handleEditActivity = (activity: Activity) => {
    toast.info(`Edit activity clicked: ${activity.name}`);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Activity Timeline Demo</h1>
        <p className="text-muted-foreground">
          Visual timeline showing a day's activities with free time slots and meal indicators
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline View */}
        <div className="bg-card rounded-lg border p-4">
          <h2 className="text-xl font-semibold mb-4">Timeline View</h2>
          <div className="h-[600px]">
            <ActivityTimeline
              dayContext={sampleDayContext}
              onAddActivity={handleAddActivity}
              onEditActivity={handleEditActivity}
            />
          </div>
        </div>

        {/* Feature Description */}
        <div className="space-y-4">
          <div className="bg-card rounded-lg border p-4">
            <h3 className="font-semibold mb-2">Features Demonstrated</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Color-coded activities by type (dining, sightseeing, shopping)</li>
              <li>• Visual duration representation (block height)</li>
              <li>• Free time slots with "+" button on hover</li>
              <li>• Meal time indicators (breakfast, lunch, dinner zones)</li>
              <li>• Time conflict detection (see the red-outlined activity)</li>
              <li>• Current time indicator (red line if viewing today)</li>
              <li>• Activity details on hover</li>
              <li>• Click activities to edit, click free slots to add</li>
            </ul>
          </div>

          <div className="bg-card rounded-lg border p-4">
            <h3 className="font-semibold mb-2">Color Legend</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded" />
                <span>Sightseeing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded" />
                <span>Dining</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500 rounded" />
                <span>Shopping</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded" />
                <span>Entertainment</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded" />
                <span>Transport</span>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border p-4">
            <h3 className="font-semibold mb-2">Integration with Chat</h3>
            <p className="text-sm text-muted-foreground">
              In the trip planning chat, this timeline is available as a separate tab. 
              Users can switch between chat and timeline views. Clicking on free time 
              slots or activities will populate the chat input with relevant prompts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}