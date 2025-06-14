'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleMap, LoadScript, Marker, Polyline, InfoWindow, OverlayView, useJsApiLoader } from '@react-google-maps/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  MapPin, 
  Camera, 
  Clock, 
  Navigation, 
  Layers, 
  ChevronLeft, 
  ChevronRight,
  Play,
  Pause,
  RotateCw,
  Maximize2,
  Image as ImageIcon,
  Star,
  TrendingUp,
  Sun,
  Moon,
  Coffee,
  Utensils,
  Wine
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { FullTripData, DayWithActivities } from '@/lib/services/trip-service-v2';
import { ActivityV2 } from '@/types/travel-v2';
import { PhotoSpotMarker } from './PhotoSpotMarker';
import { TimelineView } from './TimelineView';
import { parseDate } from '@/lib/utils/date-helpers';
import { getPhotoUrl } from '@/lib/google-places/photo-utils';

// Define libraries as a constant to prevent re-renders
const LIBRARIES: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ['places'];

// Map styles for better travel visualization
const mapStyles = [
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "transit",
    elementType: "labels",
    stylers: [{ visibility: "off" }]
  }
];

interface TripMapViewProps {
  fullTripData: FullTripData;
  onActivityClick?: (activity: ActivityV2) => void;
  className?: string;
}

// Activity type colors for markers
const activityColors = {
  sightseeing: '#3B82F6', // blue
  restaurant: '#EF4444', // red
  accommodation: '#10B981', // green
  transport: '#6366F1', // indigo
  shopping: '#F59E0B', // amber
  entertainment: '#8B5CF6', // purple
  nature: '#22C55E', // green
  culture: '#EC4899', // pink
  nightlife: '#6366F1', // indigo
  relaxation: '#14B8A6', // teal
  default: '#6B7280' // gray
};

// Time of day icons
const timeIcons = {
  morning: { icon: Coffee, color: '#F59E0B' },
  afternoon: { icon: Sun, color: '#EAB308' },
  evening: { icon: Wine, color: '#7C3AED' },
  night: { icon: Moon, color: '#6366F1' }
};

export function TripMapView({ fullTripData, onActivityClick, className }: TripMapViewProps) {
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [selectedActivity, setSelectedActivity] = useState<ActivityV2 | null>(null);
  
  // Initialize map center based on trip destination or default
  const initialCenter = fullTripData?.trip?.destination?.coordinates || 
    { lat: 48.8566, lng: 2.3522 }; // Default to Paris
  
  const [mapCenter, setMapCenter] = useState(initialCenter);
  const [mapZoom, setMapZoom] = useState(12);
  const [showPhotoSpots, setShowPhotoSpots] = useState(true);
  const [showTimeline, setShowTimeline] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // Use the hook instead of LoadScript to prevent multiple loads
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: LIBRARIES,
  });

  // Ensure we have valid data structure
  const daysWithActivities = fullTripData?.daysWithActivities || fullTripData?.days || [];
  
  // Get activities for selected day
  const currentDayData = daysWithActivities[selectedDay];
  const activities = currentDayData?.activities || [];

  // Set initial map center based on destination or first activity
  useEffect(() => {
    if (!map || typeof google === 'undefined') return;
    
    if (activities.length > 0 && activities.some(a => a.location?.coordinates)) {
      const bounds = new google.maps.LatLngBounds();
      activities.forEach(activity => {
        if (activity.location?.coordinates) {
          bounds.extend({
            lat: activity.location.coordinates.lat,
            lng: activity.location.coordinates.lng
          });
        }
      });
      map.fitBounds(bounds);
    } else if (fullTripData?.trip?.destination?.coordinates) {
      // Use trip destination if no activities
      setMapCenter({
        lat: fullTripData.trip.destination.coordinates.lat,
        lng: fullTripData.trip.destination.coordinates.lng
      });
      setMapZoom(13);
    } else {
      // Default to a world view
      setMapCenter({ lat: 40.7128, lng: -74.0060 }); // NYC as default
      setMapZoom(10);
    }
  }, [activities, map, fullTripData]);

  // Auto-play through activities
  useEffect(() => {
    if (isPlaying && activities.length > 0) {
      const interval = setInterval(() => {
        setCurrentActivityIndex((prev) => {
          if (prev >= activities.length - 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [isPlaying, activities.length]);

  // Photo spots (mock data - in real app, fetch from API)
  const photoSpots = useMemo(() => [
    {
      id: '1',
      name: 'Sunset Viewpoint',
      location: { lat: 48.8584, lng: 2.2945 }, // Eiffel Tower
      rating: 4.8,
      photos: 1250,
      bestTime: 'Golden Hour',
      tips: 'Best views from Trocadéro Gardens'
    },
    // Add more photo spots based on destination
  ], []);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const handleDayChange = (dayIndex: number) => {
    setSelectedDay(dayIndex);
    setCurrentActivityIndex(0);
    setIsPlaying(false);
  };

  const getTimeOfDay = (time: string): string => {
    const hour = parseInt(time.split(':')[0]);
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  };

  const getActivityIcon = (activity: ActivityV2) => {
    const timeOfDay = getTimeOfDay(activity.startTime || '12:00');
    const TimeIcon = timeIcons[timeOfDay].icon;
    return (
      <div className="relative">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
          style={{ backgroundColor: activityColors[activity.type] || activityColors.default }}
        >
          <MapPin className="w-5 h-5 text-white" />
        </div>
        <div 
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center bg-white shadow-md"
          style={{ color: timeIcons[timeOfDay].color }}
        >
          <TimeIcon className="w-3 h-3" />
        </div>
      </div>
    );
  };

  // Early return if no data
  if (!fullTripData || daysWithActivities.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-full bg-muted/50 rounded-lg", className)}>
        <div className="text-center">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No itinerary data available yet.</p>
          <p className="text-sm text-muted-foreground mt-2">Add some activities to see them on the map!</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (!isLoaded) {
    return (
      <div className={cn("flex items-center justify-center h-full bg-muted/50 rounded-lg", className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (loadError) {
    return (
      <div className={cn("flex items-center justify-center h-full bg-muted/50 rounded-lg", className)}>
        <div className="text-center">
          <MapPin className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive">Error loading map</p>
          <p className="text-sm text-muted-foreground mt-2">{loadError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative h-full", className)}>
      {/* Day selector */}
      <div className="absolute top-4 left-4 z-10">
        <Card className="shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Day {selectedDay + 1}</CardTitle>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDayChange(Math.max(0, selectedDay - 1))}
                  disabled={selectedDay === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDayChange(Math.min(daysWithActivities.length - 1, selectedDay + 1))}
                  disabled={selectedDay === daysWithActivities.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardDescription>
              {currentDayData?.date ? 
                format(parseDate(currentDayData.date), 'EEEE, MMMM d') :
                'No date available'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={isPlaying ? "default" : "outline"}
                onClick={() => setIsPlaying(!isPlaying)}
                className="gap-2"
              >
                {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                {isPlaying ? 'Pause' : 'Play'} Tour
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentActivityIndex(0)}
              >
                <RotateCw className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map controls */}
      <div className="absolute top-4 right-4 z-10 space-y-2">
        <Card className="shadow-lg">
          <CardContent className="p-2">
            <div className="flex flex-col gap-1">
              <Button
                size="sm"
                variant={showPhotoSpots ? "default" : "ghost"}
                onClick={() => setShowPhotoSpots(!showPhotoSpots)}
                className="justify-start gap-2"
              >
                <Camera className="h-4 w-4" />
                Photo Spots
              </Button>
              <Button
                size="sm"
                variant={showTimeline ? "default" : "ghost"}
                onClick={() => setShowTimeline(!showTimeline)}
                className="justify-start gap-2"
              >
                <Clock className="h-4 w-4" />
                Timeline
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="justify-start gap-2"
              >
                <Layers className="h-4 w-4" />
                Map Style
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity cards (bottom) */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-2">
            <AnimatePresence>
              {activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: currentActivityIndex === index ? 1 : 0.7,
                    y: 0,
                    scale: currentActivityIndex === index ? 1.05 : 1
                  }}
                  exit={{ opacity: 0, y: 20 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => {
                    setCurrentActivityIndex(index);
                    setSelectedActivity(activity);
                  }}
                >
                  <Card 
                    className={cn(
                      "w-64 cursor-pointer transition-all",
                      currentActivityIndex === index && "ring-2 ring-primary"
                    )}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        {(activity.photos?.[0] || activity.location?.placeId) && (
                          <img
                            src={(() => {
                              // Handle different photo data structures
                              const firstPhoto = activity.photos?.[0];
                              if (firstPhoto) {
                                // If it's a string, use it as photo reference
                                if (typeof firstPhoto === 'string') {
                                  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=80&photo_reference=${firstPhoto}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
                                }
                                // If it's an object with url property
                                if (typeof firstPhoto === 'object' && 'url' in firstPhoto) {
                                  return firstPhoto.url;
                                }
                                // If it's an object with name property (new Places API)
                                if (typeof firstPhoto === 'object' && 'name' in firstPhoto) {
                                  return `/api/places/photo?name=${encodeURIComponent(firstPhoto.name)}&maxWidth=80&maxHeight=80`;
                                }
                              }
                              // Fallback to place ID if available
                              if (activity.location?.placeId) {
                                return `/api/places/photo?placeId=${activity.location.placeId}&maxWidth=80&maxHeight=80`;
                              }
                              // Default fallback
                              return `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=80&h=80&fit=crop`;
                            })()}
                            alt={activity.name}
                            className="w-20 h-20 rounded-lg object-cover"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              // Only fallback once to prevent infinite loop
                              if (!img.dataset.fallbackAttempted) {
                                img.dataset.fallbackAttempted = 'true';
                                img.src = `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=80&h=80&fit=crop`; // Generic travel photo
                              }
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-sm line-clamp-1">{activity.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {activity.startTime} - {activity.endTime}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {activity.type}
                            </Badge>
                            {activity.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs">{activity.rating}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>

      {/* Timeline overlay */}
      {showTimeline && (
        <div className="absolute top-20 left-4 z-10 w-80">
          <TimelineView
            activities={activities}
            currentActivityIndex={currentActivityIndex}
            onActivityClick={(index) => {
              setCurrentActivityIndex(index);
              setSelectedActivity(activities[index]);
            }}
          />
        </div>
      )}

      {/* Map */}
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={mapCenter}
        zoom={mapZoom}
        onLoad={onLoad}
        options={{
          styles: mapStyles,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        }}
      >
          {/* Only render markers and overlays when map is loaded */}
          {map && (
            <>
              {/* Activity markers */}
              {activities.map((activity, index) => {
            if (!activity.location?.coordinates) return null;
            
            return (
              <OverlayView
                key={activity.id}
                position={{
                  lat: activity.location.coordinates.lat,
                  lng: activity.location.coordinates.lng
                }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <div
                  className={cn(
                    "transform -translate-x-1/2 -translate-y-full cursor-pointer transition-all",
                    currentActivityIndex === index && "scale-125"
                  )}
                  onClick={() => {
                    setSelectedActivity(activity);
                    setCurrentActivityIndex(index);
                    onActivityClick?.(activity);
                  }}
                >
                  {getActivityIcon(activity)}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1">
                    <div className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                      {index + 1}. {activity.name}
                    </div>
                  </div>
                </div>
              </OverlayView>
            );
              })}

              {/* Photo spots */}
              {showPhotoSpots && photoSpots.map((spot) => (
                <PhotoSpotMarker
                  key={spot.id}
                  spot={spot}
                  onClick={() => {
                    // Handle photo spot click
                  }}
                />
              ))}

              {/* Route polyline */}
              {activities.length > 1 && (
                <Polyline
              path={activities
                .filter(a => a.location?.coordinates)
                .map(a => ({
                  lat: a.location!.coordinates!.lat,
                  lng: a.location!.coordinates!.lng
                }))}
              options={{
                strokeColor: '#3B82F6',
                strokeOpacity: 0.8,
                strokeWeight: 3,
                geodesic: true,
                icons: typeof google !== 'undefined' ? [{
                  icon: {
                    path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
                    scale: 3,
                    strokeColor: '#3B82F6'
                  },
                  offset: '100%',
                  repeat: '50px'
                }] : []
              }}
            />
          )}

              {/* Selected activity info window */}
              {selectedActivity && selectedActivity.location?.coordinates && (
                <InfoWindow
                  position={{
                    lat: selectedActivity.location.coordinates.lat,
                    lng: selectedActivity.location.coordinates.lng
                  }}
                  onCloseClick={() => setSelectedActivity(null)}
                >
                  <div className="p-2 max-w-xs">
                    <h3 className="font-semibold">{selectedActivity.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedActivity.startTime} - {selectedActivity.endTime}
                    </p>
                    {selectedActivity.description && (
                      <p className="text-sm mt-2">{selectedActivity.description}</p>
                    )}
                    {(selectedActivity.photos?.[0] || selectedActivity.location?.placeId) && (
                      <img
                        src={(() => {
                          // Handle different photo data structures
                          const firstPhoto = selectedActivity.photos?.[0];
                          if (firstPhoto) {
                            // If it's a string, use it as photo reference
                            if (typeof firstPhoto === 'string') {
                              return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=200&photo_reference=${firstPhoto}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
                            }
                            // If it's an object with url property
                            if (typeof firstPhoto === 'object' && 'url' in firstPhoto) {
                              return firstPhoto.url;
                            }
                            // If it's an object with name property (new Places API)
                            if (typeof firstPhoto === 'object' && 'name' in firstPhoto) {
                              return `/api/places/photo?name=${encodeURIComponent(firstPhoto.name)}&maxWidth=200&maxHeight=150`;
                            }
                          }
                          // Fallback to place ID if available
                          if (selectedActivity.location?.placeId) {
                            return `/api/places/photo?placeId=${selectedActivity.location.placeId}&maxWidth=200&maxHeight=150`;
                          }
                          // Default fallback
                          return `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=200&h=150&fit=crop`;
                        })()}
                        alt={selectedActivity.name}
                        className="w-full h-32 object-cover rounded mt-2"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          // Only fallback once to prevent infinite loop
                          if (!img.dataset.fallbackAttempted) {
                            img.dataset.fallbackAttempted = 'true';
                            img.src = `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=200&h=150&fit=crop`; // Generic travel photo
                          }
                        }}
                      />
                    )}
                  </div>
                </InfoWindow>
              )}
            </>
          )}
      </GoogleMap>
    </div>
  );
}