'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Map, List, Calendar, LayoutGrid, Camera } from 'lucide-react';
import { TripMapView } from './TripMapView';
import { ItineraryBuilderV2 } from './ItineraryBuilderV2';
import { FullTripData } from '@/lib/services/trip-service-v2';
import { ActivityV2 } from '@/types/travel-v2';
import { cn } from '@/lib/utils';
import { getPhotoUrl } from '@/lib/google-places/photo-utils';

interface TripPlanningMapIntegrationProps {
  fullTripData: FullTripData;
  onUpdate: () => Promise<void>;
}

export function TripPlanningMapIntegration({ fullTripData, onUpdate }: TripPlanningMapIntegrationProps) {
  const [view, setView] = useState<'map' | 'list' | 'calendar' | 'grid'>('map');
  const [selectedActivity, setSelectedActivity] = useState<ActivityV2 | null>(null);

  const handleActivityClick = (activity: ActivityV2) => {
    setSelectedActivity(activity);
    // You can open a modal or sidebar with activity details here
  };

  return (
    <div className="h-full flex flex-col">
      {/* View switcher */}
      <div className="border-b p-4">
        <Tabs value={view} onValueChange={(v) => setView(v as any)}>
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="map" className="gap-2">
              <Map className="w-4 h-4" />
              <span className="hidden sm:inline">Map</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="grid" className="gap-2">
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Grid</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content area */}
      <div className="flex-1 relative overflow-hidden min-h-[600px]">
        {view === 'map' && (
          <TripMapView
            fullTripData={fullTripData}
            onActivityClick={handleActivityClick}
            className="absolute inset-0"
          />
        )}
        
        {view === 'list' && (
          <div className="p-4">
            <ItineraryBuilderV2
              fullTripData={fullTripData}
              onUpdate={onUpdate}
            />
          </div>
        )}
        
        {view === 'calendar' && (
          <div className="p-4">
            {/* Calendar view implementation */}
            <CalendarView fullTripData={fullTripData} />
          </div>
        )}
        
        {view === 'grid' && (
          <div className="p-4">
            {/* Grid view with photos */}
            <PhotoGridView fullTripData={fullTripData} />
          </div>
        )}
      </div>
    </div>
  );
}

// Calendar view component (simplified)
function CalendarView({ fullTripData }: { fullTripData: FullTripData }) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {/* Calendar implementation */}
      <div className="text-center text-sm text-muted-foreground">
        Calendar view coming soon...
      </div>
    </div>
  );
}

// Photo grid view component
function PhotoGridView({ fullTripData }: { fullTripData: FullTripData }) {
  // Handle both data structures
  const days = fullTripData?.daysWithActivities || fullTripData?.days || [];
  const allActivities = days.flatMap(d => d.activities || []);
  const activitiesWithPhotos = allActivities.filter(a => a.photos && a.photos.length > 0);

  if (allActivities.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-muted/50 rounded-lg">
        <div className="text-center">
          <LayoutGrid className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No activities yet</p>
          <p className="text-sm text-muted-foreground mt-2">Add activities to see photos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {activitiesWithPhotos.length > 0 ? (
        activitiesWithPhotos.map((activity) => (
        <div key={activity.id} className="relative group cursor-pointer">
          <div className="aspect-square rounded-lg overflow-hidden">
            <img
              src={(() => {
                // Handle different photo data structures
                const firstPhoto = activity.photos?.[0];
                if (firstPhoto) {
                  // If it's a string, use it as photo reference
                  if (typeof firstPhoto === 'string') {
                    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${firstPhoto}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
                  }
                  // If it's an object with url property
                  if (typeof firstPhoto === 'object' && 'url' in firstPhoto) {
                    return firstPhoto.url;
                  }
                  // If it's an object with name property (new Places API)
                  if (typeof firstPhoto === 'object' && 'name' in firstPhoto) {
                    return `/api/places/photo?name=${encodeURIComponent(firstPhoto.name)}&maxWidth=400&maxHeight=400`;
                  }
                }
                // Fallback to place ID if available
                if (activity.location?.placeId) {
                  return `/api/places/photo?placeId=${activity.location.placeId}&maxWidth=400&maxHeight=400`;
                }
                // Default fallback
                return `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=400&fit=crop`;
              })()}
              alt={activity.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                // Only fallback once to prevent infinite loop
                if (!img.dataset.fallbackAttempted) {
                  img.dataset.fallbackAttempted = 'true';
                  img.src = `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=400&fit=crop`; // Generic travel photo
                }
              }}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white font-semibold">{activity.name}</h3>
              <p className="text-white/80 text-sm">{activity.startTime}</p>
            </div>
          </div>
        </div>
      ))
      ) : (
        <div className="col-span-full text-center py-12">
          <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No photos available yet</p>
          <p className="text-sm text-muted-foreground mt-2">Activities with photos will appear here</p>
        </div>
      )}
    </div>
  );
}