"use client";

import { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, Plus, Plane, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/lib/firebase/context';
import { TripModelEnhanced as TripModel } from '@/lib/models/trip-enhanced';
import { Trip, DayItinerary } from '@/types/travel';
import { format, parseISO } from 'date-fns';

export default function ItinerariesPage() {
  const router = useRouter();
  const { user } = useFirebase();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadTrips = async () => {
      try {
        const userTrips = await TripModel.getUserTrips(user.uid);
        // Filter trips that have itineraries
        const tripsWithItineraries = userTrips.filter(
          trip => trip.itinerary && trip.itinerary.length > 0
        );
        setTrips(tripsWithItineraries);
      } catch (error) {
        console.error('Failed to load trips:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTrips();
  }, [user]);

  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'transport':
        return <Plane className="h-3 w-3" />;
      case 'accommodation':
        return <Car className="h-3 w-3" />;
      default:
        return <MapPin className="h-3 w-3" />;
    }
  };

  const getDayLabel = (dayItinerary: DayItinerary, trip: Trip) => {
    // Check if this is a travel day
    if (dayItinerary.notes?.includes('Travel from')) {
      return `Day ${dayItinerary.dayNumber} - Travel Day`;
    }
    
    // For multi-destination trips, show the destination
    if (trip.destinations && trip.destinations.length > 0) {
      const destination = trip.destinations.find(
        d => d.destination?.id === dayItinerary.destinationId
      );
      if (destination) {
        return `Day ${dayItinerary.dayNumber} - ${destination.destination.name}`;
      }
    }
    
    // For single destination trips
    return `Day ${dayItinerary.dayNumber} - ${trip.destination?.name || 'Activities'}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Itineraries</h1>
            <p className="text-muted-foreground mt-1">
              Loading your travel schedules...
            </p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-16 bg-muted rounded" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const hasItineraries = trips.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Itineraries</h1>
          <p className="text-muted-foreground mt-1">
            Manage your daily travel schedules and activities
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/trips/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Plan New Trip
        </Button>
      </div>

      {!hasItineraries ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-muted-foreground mb-4">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No itineraries yet</p>
              <p className="text-sm mt-2">Start planning your first trip!</p>
            </div>
            <Button 
              className="mt-4"
              onClick={() => router.push('/dashboard/trips/new')}
            >
              Create Your First Trip
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {trips.map((trip) => (
            <div key={trip.id} className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  {trip.title || `Trip to ${trip.destination?.name || 'Unknown'}`}
                </h2>
                <Badge variant="outline">
                  {trip.itinerary?.reduce((acc, day) => acc + (day.activities?.length || 0), 0) || 0} activities
                </Badge>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {trip.itinerary?.map((dayItinerary) => (
                  <Card
                    key={dayItinerary.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(`/dashboard/trips/${trip.id}/plan`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {getDayLabel(dayItinerary, trip)}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {dayItinerary.date && format(
                              typeof dayItinerary.date === 'string' 
                                ? parseISO(dayItinerary.date) 
                                : dayItinerary.date, 
                              'EEEE, MMM d, yyyy'
                            )}
                          </CardDescription>
                        </div>
                        {dayItinerary.activities && dayItinerary.activities.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {dayItinerary.activities.length}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      {dayItinerary.notes && (
                        <p className="text-sm text-muted-foreground mb-3 italic">
                          {dayItinerary.notes}
                        </p>
                      )}
                      
                      {(!dayItinerary.activities || dayItinerary.activities.length === 0) ? (
                        <div className="text-center py-6 text-muted-foreground">
                          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No activities planned</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {dayItinerary.activities.slice(0, 3).map((activity, index) => (
                            <div
                              key={activity.id || index}
                              className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 text-sm"
                            >
                              <div className="flex items-center gap-1 text-muted-foreground min-w-[50px]">
                                <Clock className="h-3 w-3" />
                                <span className="text-xs">
                                  {activity.startTime || '--:--'}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{activity.name}</p>
                                {activity.location && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                    {getActivityTypeIcon(activity.type)}
                                    <span className="truncate">
                                      {activity.location.name || activity.location.address}
                                    </span>
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          {dayItinerary.activities.length > 3 && (
                            <p className="text-xs text-center text-muted-foreground pt-1">
                              +{dayItinerary.activities.length - 3} more activities
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}