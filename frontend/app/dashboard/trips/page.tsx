'use client';

import { useEffect, useState } from 'react';
import { Plus, Calendar, MapPin, Users, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFirebase } from '@/lib/firebase/context';
import { useRouter } from 'next/navigation';
import { TripModelEnhanced as TripModel } from '@/lib/models/trip-enhanced';
import { Trip } from '@/types/travel';
import { format, differenceInDays } from 'date-fns';

export default function TripsPage() {
  const { user } = useFirebase();
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadTrips = async () => {
      try {
        const userTrips = await TripModel.getUserTrips(user.uid);
        setTrips(userTrips);
      } catch (error) {
        console.error('Error loading trips:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTrips();
  }, [user]);

  const getTripStatus = (trip: Trip) => {
    const now = new Date();
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);

    if (now < startDate) {
      const daysUntil = differenceInDays(startDate, now);
      return { 
        label: `In ${daysUntil} days`, 
        variant: 'secondary' as const,
        status: 'upcoming' 
      };
    } else if (now >= startDate && now <= endDate) {
      return { 
        label: 'Ongoing', 
        variant: 'default' as const,
        status: 'active' 
      };
    } else {
      return { 
        label: 'Completed', 
        variant: 'outline' as const,
        status: 'past' 
      };
    }
  };

  const getTripDuration = (trip: Trip) => {
    const days = differenceInDays(new Date(trip.endDate), new Date(trip.startDate)) + 1;
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Trips</h1>
          <p className="text-muted-foreground mt-1">
            Manage and plan your travel adventures
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/trips/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Trip
        </Button>
      </div>

      {trips.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-muted-foreground mb-4">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No trips yet</p>
              <p className="text-sm mt-2">Start planning your next adventure!</p>
            </div>
            <Button 
              onClick={() => router.push('/dashboard/trips/new')}
              className="mt-4"
            >
              Create Your First Trip
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => {
            const status = getTripStatus(trip);
            return (
              <Card 
                key={trip.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/dashboard/trips/${trip.id}/plan`)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="line-clamp-1">
                        {trip.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        {trip.destinations && trip.destinations.length > 0
                          ? trip.destinations.map(d => d.destination?.name).filter(Boolean).join(' → ')
                          : trip.destination?.name || 'Unknown location'
                        }
                      </CardDescription>
                    </div>
                    <Badge variant={status.variant}>
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(trip.startDate), 'MMM d')} - {format(new Date(trip.endDate), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <span className="font-medium">{getTripDuration(trip)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{trip.travelers.length} {trip.travelers.length === 1 ? 'traveler' : 'travelers'}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>

                    {trip.budget && (
                      <div className="pt-2 border-t">
                        <div className="text-sm font-medium">
                          Budget: {trip.budget.currency} {trip.budget.total.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}