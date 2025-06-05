'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirebase } from '@/lib/firebase/context';
import { TripModel } from '@/lib/models/trip';
import { Trip } from '@/types/travel';
import { format, differenceInDays } from 'date-fns';

// Import planning components
import { ItineraryBuilder } from '@/components/trips/planning/ItineraryBuilder';
import { BudgetTracker } from '@/components/trips/planning/BudgetTracker';
import { TripChat } from '@/components/trips/planning/TripChat';

export default function TripPlanningPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useFirebase();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('itinerary');

  const tripId = params.id as string;

  useEffect(() => {
    if (!user || !tripId) return;

    const loadTrip = async () => {
      try {
        const tripData = await TripModel.getById(tripId);
        if (tripData && tripData.userId === user.uid) {
          setTrip(tripData);
        } else {
          router.push('/dashboard/trips');
        }
      } catch (error) {
        console.error('Error loading trip:', error);
        router.push('/dashboard/trips');
      } finally {
        setLoading(false);
      }
    };

    loadTrip();
  }, [user, tripId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return null;
  }

  // Safely parse dates
  const startDate = trip.startDate instanceof Date ? trip.startDate : new Date(trip.startDate);
  const endDate = trip.endDate instanceof Date ? trip.endDate : new Date(trip.endDate);
  
  const tripDuration = differenceInDays(endDate, startDate) + 1;
  const daysPlanned = trip.itinerary?.length || 0;
  const totalActivities = trip.itinerary?.reduce((sum, day) => sum + (day.activities?.length || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/dashboard/trips')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{trip.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {trip.destinations && trip.destinations.length > 0
                      ? trip.destinations.map(d => d.destination?.name).filter(Boolean).join(' → ')
                      : trip.destination?.name || 'Unknown location'
                    }
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {trip.travelers.length} {trip.travelers.length === 1 ? 'traveler' : 'travelers'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Trip Duration</CardDescription>
                  <CardTitle className="text-2xl">{tripDuration} days</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Days Planned</CardDescription>
                  <CardTitle className="text-2xl">{daysPlanned}/{tripDuration}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Activities</CardDescription>
                  <CardTitle className="text-2xl">{totalActivities}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Budget Used</CardDescription>
                  <CardTitle className="text-2xl">
                    {trip.budget ? `${Math.round((0 / trip.budget.total) * 100)}%` : 'N/A'}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Planning Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
                <TabsTrigger value="budget">Budget</TabsTrigger>
                <TabsTrigger value="chat">AI Assistant</TabsTrigger>
              </TabsList>

              <TabsContent value="itinerary" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Day-by-Day Itinerary</CardTitle>
                    <CardDescription>
                      Plan your activities for each day of your trip
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ItineraryBuilder trip={trip} onUpdate={setTrip} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="budget" className="mt-6">
                <BudgetTracker trip={trip} onUpdate={setTrip} />
              </TabsContent>

              <TabsContent value="chat" className="mt-6">
                <TripChat trip={trip} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Trip Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Trip Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Destination{trip.destinations && trip.destinations.length > 1 ? 's' : ''}</p>
                  <p className="text-sm text-muted-foreground">
                    {trip.destinations && trip.destinations.length > 0
                      ? trip.destinations.map(d => d.destination?.name).filter(Boolean).join(' → ')
                      : trip.destination?.name || 'Unknown location'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Dates</p>
                  <p className="text-sm text-muted-foreground">
                    {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Travelers</p>
                  <div className="text-sm text-muted-foreground">
                    {trip.travelers.map((traveler, index) => (
                      <p key={index}>{traveler.name}</p>
                    ))}
                  </div>
                </div>
                {trip.budget && (
                  <div>
                    <p className="text-sm font-medium">Budget</p>
                    <p className="text-sm text-muted-foreground">
                      {trip.budget.currency} {trip.budget.total.toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  Add Activity
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Add Expense
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Users className="mr-2 h-4 w-4" />
                  Invite Travelers
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}