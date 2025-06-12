'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EnhancedTravelChat } from '@/components/chat/EnhancedTravelChat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirebase } from '@/lib/firebase/context';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { format } from 'date-fns';
import { Loader2, Bot, Calendar, MapPin, Info, Sparkles } from 'lucide-react';

interface Trip {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  destinations: Array<{ name: string }>;
}

export default function TestEnhancedChatPage() {
  const router = useRouter();
  const { user } = useFirebase();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    loadUserTrips();
  }, [user, router]);

  const loadUserTrips = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const tripsRef = collection(db, 'trips');
      const q = query(
        tripsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      
      const snapshot = await getDocs(q);
      const userTrips: Trip[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        
        // Handle both string dates and Firestore Timestamps
        let startDate = data.startDate;
        let endDate = data.endDate;
        
        // Convert Firestore Timestamps to ISO strings
        if (startDate?.toDate) {
          startDate = startDate.toDate().toISOString();
        }
        if (endDate?.toDate) {
          endDate = endDate.toDate().toISOString();
        }
        
        userTrips.push({
          id: doc.id,
          name: data.name || 'Untitled Trip',
          startDate: startDate || '',
          endDate: endDate || '',
          destinations: data.destinations || []
        });
      });
      
      setTrips(userTrips);
      
      // Auto-select first trip
      if (userTrips.length > 0) {
        setSelectedTripId(userTrips[0].id);
        
        // Set date to today if within trip range, otherwise start date
        if (userTrips[0].startDate) {
          const today = new Date().toISOString().split('T')[0];
          const tripStart = userTrips[0].startDate.split('T')[0];
          const tripEnd = userTrips[0].endDate ? userTrips[0].endDate.split('T')[0] : tripStart;
          
          if (today >= tripStart && today <= tripEnd) {
            setSelectedDate(today);
          } else {
            setSelectedDate(tripStart);
          }
        } else {
          // If no dates, default to today
          setSelectedDate(new Date().toISOString().split('T')[0]);
        }
      }
    } catch (err) {
      console.error('Error loading trips:', err);
      setError('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const selectedTrip = trips.find(t => t.id === selectedTripId);

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Bot className="h-8 w-8 text-primary" />
          Enhanced AI Chat Test
        </h1>
        <p className="text-muted-foreground">
          Test the new AI travel assistant with intelligent tools and expert recommendations
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Panel - Configuration */}
        <div className="lg:col-span-1 space-y-4">
          {/* Trip Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Test Configuration</CardTitle>
              <CardDescription>Select a trip to test the enhanced chat</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : trips.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">No trips found</p>
                  <Button onClick={() => router.push('/dashboard/trips/new')}>
                    Create a Trip
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Trip</label>
                    <Select value={selectedTripId} onValueChange={setSelectedTripId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a trip" />
                      </SelectTrigger>
                      <SelectContent>
                        {trips.map(trip => (
                          <SelectItem key={trip.id} value={trip.id}>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3" />
                              {trip.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedTrip && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Planning Date</label>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          min={selectedTrip.startDate}
                          max={selectedTrip.endDate}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>

                      <div className="pt-2 space-y-2">
                        {selectedTrip.startDate && selectedTrip.endDate && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {(() => {
                                try {
                                  const startDate = new Date(selectedTrip.startDate);
                                  const endDate = new Date(selectedTrip.endDate);
                                  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                                    return 'Invalid dates';
                                  }
                                  return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
                                } catch (error) {
                                  return 'Invalid dates';
                                }
                              })()}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {selectedTrip.destinations?.map(d => d.name).join(', ') || 'No destinations'}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Feature Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Available Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <ToolInfo
                  name="Activity Search"
                  description="Find attractions with expert recommendations"
                  example="Find top museums near me"
                />
                <ToolInfo
                  name="Restaurant Search"
                  description="Discover dining with dietary preferences"
                  example="Find vegan restaurants for dinner"
                />
                <ToolInfo
                  name="Add to Itinerary"
                  description="Smart scheduling with conflict detection"
                  example="Add this activity to my itinerary"
                />
                <ToolInfo
                  name="Find Time Slots"
                  description="Find available time slots in your schedule"
                  example="Find a 2-hour slot for tomorrow"
                />
                <ToolInfo
                  name="Weather Filter"
                  description="Get weather-aware activity recommendations"
                  example="Check weather for my activities tomorrow"
                />
                <ToolInfo
                  name="Create Todos"
                  description="Generate smart task lists"
                  example="Create a todo list for my trip"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Chat */}
        <div className="lg:col-span-2">
          {selectedTripId ? (
            <Tabs defaultValue="chat" className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chat">Enhanced Chat</TabsTrigger>
                <TabsTrigger value="tips">Usage Tips</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chat" className="mt-4">
                <EnhancedTravelChat
                  tripId={selectedTripId}
                  currentDate={selectedDate}
                />
              </TabsContent>
              
              <TabsContent value="tips" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>How to Test the Enhanced Chat</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <TipSection
                      title="🔍 Search Features"
                      tips={[
                        "Ask for 'expert-recommended restaurants' to see ranking",
                        "Try 'find activities suitable for rainy weather'",
                        "Search with dietary needs: 'vegan breakfast spots'",
                        "Request specific types: 'outdoor adventures near me'"
                      ]}
                    />
                    
                    <TipSection
                      title="📅 Planning Features"
                      tips={[
                        "Say 'add Louvre Museum to my itinerary at 2pm'",
                        "Ask 'find a 3-hour time slot for tomorrow'",
                        "Try 'what time slots are available today?'",
                        "Request 'check weather for my activities'"
                      ]}
                    />
                    
                    <TipSection
                      title="✅ Todo Management"
                      tips={[
                        "Ask 'create a todo list for my trip'",
                        "Try 'what do I need to book?'",
                        "Say 'remind me to book dinner reservations'",
                        "Request 'preparation checklist'"
                      ]}
                    />
                    
                    <TipSection
                      title="🌟 Expert Recommendations"
                      tips={[
                        "Look for the expert badge on recommendations",
                        "Ask for 'hidden gems' or 'local favorites'",
                        "Try 'expert tips for [destination]'",
                        "Request 'authentic local experiences'"
                      ]}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <CardContent className="text-center">
                <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Select a trip to start testing the enhanced chat
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ToolInfo({ name, description, example }: { 
  name: string; 
  description: string;
  example: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{name}</span>
        <Badge variant="secondary" className="text-xs">Available</Badge>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
      <p className="text-xs italic text-muted-foreground">"{example}"</p>
    </div>
  );
}

function TipSection({ title, tips }: { title: string; tips: string[] }) {
  return (
    <div className="space-y-2">
      <h4 className="font-semibold">{title}</h4>
      <ul className="space-y-1">
        {tips.map((tip, index) => (
          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}