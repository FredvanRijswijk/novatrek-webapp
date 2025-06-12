'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, Edit, MoreVertical, Share2, Plane, Package, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useFirebase } from '@/lib/firebase/context';
import { TripServiceV2 } from '@/lib/services/trip-service-v2';
import { TripModelV2 } from '@/lib/models/v2/trip-model-v2';
import { TripV2 } from '@/types/travel-v2';
import { FullTripData } from '@/lib/services/trip-service-v2';
import { format, differenceInDays } from 'date-fns';
import { parseDate } from '@/lib/utils/date-helpers';
import { useFeatureFlag } from '@/hooks/use-feature-flag';
import { FeatureFlag } from '@/components/feature-flag/FeatureFlag';
import { DebugFeatureFlags } from '@/components/trips/DebugFeatureFlags';
import { FEATURE_FLAGS } from '@/lib/feature-flags';

// Lazy load planning components for better performance
import dynamic from 'next/dynamic';
import { Suspense, lazy } from 'react';

// Dynamically import heavy components
const ItineraryBuilder = dynamic(
  () => import('@/components/trips/planning/ItineraryBuilderV2').then(mod => ({ default: mod.ItineraryBuilderV2 })),
  { 
    loading: () => <div className="animate-pulse bg-muted h-96 rounded-lg" />,
    ssr: false 
  }
);

const BudgetTracker = dynamic(
  () => import('@/components/trips/planning/BudgetTracker').then(mod => ({ default: mod.BudgetTracker })),
  { 
    loading: () => <div className="animate-pulse bg-muted h-96 rounded-lg" />,
    ssr: false 
  }
);

const EnhancedChatWrapper = dynamic(
  () => import('@/components/trips/planning/EnhancedChatWrapperV2').then(mod => ({ default: mod.EnhancedChatWrapperV2 })),
  { 
    loading: () => <div className="animate-pulse bg-muted h-96 rounded-lg" />,
    ssr: false 
  }
);

const PhotoUpload = dynamic(
  () => import('@/components/trips/PhotoUpload').then(mod => ({ default: mod.PhotoUpload })),
  { 
    loading: () => <div className="animate-pulse bg-muted h-96 rounded-lg" />,
    ssr: false 
  }
);

// Lazy load dialogs since they're used conditionally
const EditTripDialog = lazy(() => 
  import('@/components/trips/EditTripDialog').then(mod => ({ default: mod.EditTripDialog }))
);

const EditDestinationsDialog = lazy(() => 
  import('@/components/trips/EditDestinationsDialog').then(mod => ({ default: mod.EditDestinationsDialog }))
);

const ShareTripDialog = lazy(() => 
  import('@/components/trips/ShareTripDialog').then(mod => ({ default: mod.ShareTripDialog }))
);

const DeleteTripDialog = lazy(() => 
  import('@/components/trips/DeleteTripDialog').then(mod => ({ default: mod.DeleteTripDialog }))
);

// Import progress indicator
const TripProgressIndicator = dynamic(
  () => import('@/components/trips/TripProgressIndicator').then(mod => ({ default: mod.TripProgressIndicator })),
  { 
    loading: () => <div className="animate-pulse bg-muted h-64 rounded-lg" />,
    ssr: false 
  }
);

// Import packing and flight components
const PackingChecklist = dynamic(
  () => import('@/components/trips/PackingChecklist').then(mod => ({ default: mod.PackingChecklist })),
  { 
    loading: () => <div className="animate-pulse bg-muted h-96 rounded-lg" />,
    ssr: false 
  }
);

const TransportPlanner = dynamic(
  () => import('@/components/trips/TransportPlanner').then(mod => ({ default: mod.TransportPlanner })),
  { 
    loading: () => <div className="animate-pulse bg-muted h-96 rounded-lg" />,
    ssr: false 
  }
);

export default function TripPlanningPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useFirebase();
  const [fullTripData, setFullTripData] = useState<FullTripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('itinerary');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDestinationsDialog, setShowDestinationsDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const tripSharingEnabled = useFeatureFlag('tripSharing');

  const tripId = params.id as string;
  const tripService = new TripServiceV2();
  const tripModel = new TripModelV2();

  useEffect(() => {
    if (!user || !tripId) return;

    let unsubscribe: (() => void) | undefined;

    const initializeTrip = async () => {
      try {
        // Check access first
        const hasAccess = await tripModel.hasAccess(tripId, user.uid);
        if (!hasAccess) {
          router.push('/dashboard/trips');
          return;
        }

        // Load full trip data with V2 structure
        const tripData = await tripService.getFullTrip(tripId);
        if (!tripData) {
          router.push('/dashboard/trips');
          return;
        }

        // Set initial data
        setFullTripData(tripData);
        setLoading(false);

        // Subscribe to real-time updates
        unsubscribe = tripService.subscribeToFullTrip(tripId, (updatedData) => {
          if (updatedData) {
            setFullTripData(updatedData);
          }
        });
      } catch (error) {
        console.error('Error loading trip:', error);
        router.push('/dashboard/trips');
        setLoading(false);
      }
    };

    initializeTrip();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, tripId, router]);

  const handleDeleteTrip = async () => {
    if (!fullTripData || !user) return;
    
    try {
      setDeleting(true);
      await tripService.deleteTrip(tripId, user.uid);
      router.push('/dashboard/trips');
    } catch (error) {
      console.error('Error deleting trip:', error);
      alert('Failed to delete trip. Please try again.');
      setDeleting(false);
    }
  };

  // Memoize date calculations and trip statistics
  const { trip, startDate, endDate, tripDuration, daysPlanned, totalActivities } = useMemo(() => {
    if (!fullTripData) {
      return {
        trip: null,
        startDate: new Date(),
        endDate: new Date(),
        tripDuration: 0,
        daysPlanned: 0,
        totalActivities: 0
      };
    }
    
    const start = parseDate(fullTripData.trip.startDate);
    const end = parseDate(fullTripData.trip.endDate);
    const duration = differenceInDays(end, start) + 1;
    const planned = fullTripData.days.filter(d => d.activities.length > 0).length;
    const activities = fullTripData.days.reduce((sum, day) => sum + day.activities.length, 0);
    
    return {
      trip: fullTripData.trip,
      startDate: start,
      endDate: end,
      tripDuration: duration,
      daysPlanned: planned,
      totalActivities: activities
    };
  }, [fullTripData]);

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
                    {trip.destinationName || 'Unknown location'}
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
            <div className="flex items-center gap-2">
              {tripSharingEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowShareDialog(true)}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Trip Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowDestinationsDialog(true)}>
                  <MapPin className="mr-2 h-4 w-4" />
                  Edit Destinations
                </DropdownMenuItem>
                {tripSharingEnabled && (
                  <DropdownMenuItem onClick={() => setShowShareDialog(true)}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Trip
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Trip
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            {/* Main Content */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
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
                    {trip.budget ? (() => {
                      let totalSpent = 0;
                      // Calculate from activities
                      trip.itinerary?.forEach(day => {
                        day.activities?.forEach(activity => {
                          if (activity.cost) {
                            totalSpent += activity.cost.amount * (activity.cost.perPerson ? trip.travelers.length : 1);
                          }
                        });
                      });
                      // Add manual expenses
                      trip.expenses?.forEach(expense => {
                        totalSpent += expense.amount;
                      });
                      return `${Math.round((totalSpent / trip.budget.total) * 100)}%`;
                    })() : 'N/A'}
                  </CardTitle>
                </CardHeader>
              </Card>
              </div>

            {/* Planning Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full flex flex-wrap gap-1 h-auto p-1">
                <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
                <TabsTrigger value="transport">Transport</TabsTrigger>
                <TabsTrigger value="budget">Budget</TabsTrigger>
                <TabsTrigger value="packing">Packing</TabsTrigger>
                <TabsTrigger value="photos">Photos</TabsTrigger>
                <TabsTrigger value="chat">✨ AI Assistant</TabsTrigger>
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
                    {activeTab === 'itinerary' && fullTripData && (
                      <ItineraryBuilder 
                        key={`itinerary-${fullTripData.days.reduce((sum, d) => sum + d.activities.length, 0)}`}
                        fullTripData={fullTripData} 
                        onUpdate={async () => {
                          // Reload trip data after update
                          const updated = await tripService.getFullTrip(tripId);
                          if (updated) setFullTripData(updated);
                        }} 
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transport" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Travel & Transport</CardTitle>
                    <CardDescription>
                      Track all your flights, trains, buses, and other transport between destinations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activeTab === 'transport' && fullTripData && (
                      <TransportPlanner 
                        trip={fullTripData.trip} 
                        onUpdate={async () => {
                          const updated = await tripService.getFullTrip(tripId);
                          if (updated) setFullTripData(updated);
                        }} 
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="budget" className="mt-6">
                {activeTab === 'budget' && fullTripData && (
                  <BudgetTracker 
                    trip={fullTripData.trip} 
                    onUpdate={async () => {
                      const updated = await tripService.getFullTrip(tripId);
                      if (updated) setFullTripData(updated);
                    }} 
                  />
                )}
              </TabsContent>

              <TabsContent value="packing" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Packing Checklist</CardTitle>
                    <CardDescription>
                      Keep track of what you need to pack for your trip
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activeTab === 'packing' && fullTripData && (
                      <PackingChecklist tripId={trip.id} trip={fullTripData.trip} />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="photos" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Trip Photos</CardTitle>
                    <CardDescription>
                      Upload and manage photos from your trip
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activeTab === 'photos' && fullTripData && (
                      <PhotoUpload tripId={trip.id} userId={trip.userId} maxPhotos={50} />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="chat" className="mt-6 h-[calc(100vh-20rem)]">
                {activeTab === 'chat' && fullTripData && (
                  <EnhancedChatWrapper 
                    trip={fullTripData.trip}
                    fullTripData={fullTripData}
                    onUpdate={async () => {
                      const updated = await tripService.getFullTrip(tripId);
                      if (updated) setFullTripData(updated);
                    }} 
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Progress Indicator */}
            {fullTripData && (
              <TripProgressIndicator 
                trip={fullTripData.trip} 
                onSuggestionClick={(suggestion) => {
                  // Switch to AI assistant tab
                  setActiveTab('chat');
                  // TODO: Pass suggestion to chat
                }}
              />
            )}
            
            {/* Trip Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Trip Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Destination</p>
                  <p className="text-sm text-muted-foreground">
                    {trip.destinationName || 'Unknown location'}
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
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  size="sm"
                  onClick={() => setActiveTab('itinerary')}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Add Activity
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  size="sm"
                  onClick={() => setActiveTab('budget')}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Add Expense
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  size="sm"
                  onClick={() => setActiveTab('packing')}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Manage Packing
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  size="sm"
                  onClick={() => setActiveTab('transport')}
                >
                  <Plane className="mr-2 h-4 w-4" />
                  Add Flight
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Trip Dialog */}
      {trip && (
        <Suspense fallback={null}>
          <EditTripDialog
            trip={trip}
            isOpen={showEditDialog}
            onClose={() => setShowEditDialog(false)}
            onUpdate={async () => {
              const updated = await tripService.getFullTrip(tripId);
              if (updated) setFullTripData(updated);
            }}
          />
        </Suspense>
      )}

      {/* Edit Destinations Dialog */}
      {trip && (
        <Suspense fallback={null}>
          <EditDestinationsDialog
            trip={trip}
            isOpen={showDestinationsDialog}
            onClose={() => setShowDestinationsDialog(false)}
            onUpdate={async () => {
              const updated = await tripService.getFullTrip(tripId);
              if (updated) setFullTripData(updated);
            }}
          />
        </Suspense>
      )}

      {/* Share Trip Dialog */}
      {trip && tripSharingEnabled && (
        <Suspense fallback={null}>
          <ShareTripDialog
            trip={trip}
            open={showShareDialog}
            onOpenChange={setShowShareDialog}
          />
        </Suspense>
      )}

      {/* Delete Trip Dialog */}
      {trip && (
        <Suspense fallback={null}>
          <DeleteTripDialog
            isOpen={showDeleteDialog}
            onClose={() => setShowDeleteDialog(false)}
            onConfirm={handleDeleteTrip}
            tripTitle={trip.title}
            tripId={trip.id}
            isDeleting={deleting}
          />
        </Suspense>
      )}
      
      {/* Debug Feature Flags - Remove in production */}
      <DebugFeatureFlags />
    </div>
  );
}