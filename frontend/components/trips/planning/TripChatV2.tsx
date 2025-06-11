'use client';

import { useChat } from 'ai/react';
import { useState, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Hotel, MapPin, Calendar, DollarSign, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trip } from '@/types/travel';
import { useFirebase } from '@/lib/firebase/context';
import { useTravelPreferences } from '@/hooks/use-travel-preferences';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TripChatV2Props {
  trip: Trip;
  onUpdate?: (trip: Trip) => void;
}

interface ToolResult {
  toolCallId: string;
  toolName: string;
  result: any;
}

// Component for displaying hotel search results
function HotelSearchResults({ 
  results, 
  onSelect 
}: { 
  results: any; 
  onSelect: (hotel: any) => void;
}) {
  const { hotels, checkIn, checkOut } = results;
  
  return (
    <div className="space-y-3 my-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Hotel className="h-4 w-4" />
        <span>Found {hotels.length} hotels for {checkIn} to {checkOut}</span>
      </div>
      {hotels.map((hotel: any) => (
        <Card key={hotel.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h4 className="font-semibold">{hotel.name}</h4>
              <p className="text-sm text-muted-foreground mt-1">{hotel.address}</p>
              <div className="flex items-center gap-4 mt-2">
                {hotel.rating && (
                  <Badge variant="secondary" className="text-xs">
                    ⭐ {hotel.rating}
                  </Badge>
                )}
                <span className="text-sm font-medium">
                  ${hotel.estimatedPrice}/night
                </span>
              </div>
            </div>
            <Button 
              size="sm"
              onClick={() => onSelect(hotel)}
              className="shrink-0"
            >
              Add to Trip
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Component for displaying activity search results
function ActivitySearchResults({ 
  results, 
  onSelect 
}: { 
  results: any; 
  onSelect: (activity: any) => void;
}) {
  const { activities, date } = results;
  
  return (
    <div className="space-y-3 my-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>Found {activities.length} activities for {new Date(date).toLocaleDateString()}</span>
      </div>
      {activities.map((activity: any) => (
        <Card key={activity.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h4 className="font-semibold">{activity.name}</h4>
              {activity.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {activity.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm">
                {activity.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {activity.location.name || activity.location.address}
                  </span>
                )}
                {activity.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {activity.duration} min
                  </span>
                )}
                {activity.cost && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {activity.cost.amount}
                  </span>
                )}
              </div>
            </div>
            <Button 
              size="sm"
              onClick={() => onSelect(activity)}
              className="shrink-0"
            >
              Add to Day
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Component for displaying add to itinerary results
function AddToItineraryResult({ result }: { result: any }) {
  return (
    <Card className={cn(
      "p-4 my-2",
      result.success ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" : "border-red-500/50 bg-red-50/50 dark:bg-red-950/20"
    )}>
      <p className="text-sm font-medium">
        {result.success ? '✅' : '❌'} {result.message}
      </p>
    </Card>
  );
}

export function TripChatV2({ trip, onUpdate }: TripChatV2Props) {
  const { user } = useFirebase();
  const { preferences } = useTravelPreferences();
  const [toolResults, setToolResults] = useState<Map<string, ToolResult>>(new Map());
  const [authToken, setAuthToken] = useState<string>('');

  // Get auth token
  useEffect(() => {
    const getToken = async () => {
      if (user) {
        try {
          const token = await user.getIdToken();
          setAuthToken(token);
        } catch (error) {
          console.error('Failed to get auth token:', error);
        }
      }
    };
    getToken();
  }, [user]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    append,
    reload,
    stop
  } = useChat({
    api: '/api/chat/trip-planning',
    headers: authToken ? {
      'Authorization': `Bearer ${authToken}`
    } : {},
    body: {
      tripId: trip.id,
      tripContext: {
        destination: trip.destination || trip.destinations?.[0]?.destination,
        duration: Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1,
        startDate: trip.startDate,
        budget: trip.budget,
        travelers: trip.travelers.length
      },
      userPreferences: preferences
    },
    onToolCall: async ({ toolCall }) => {
      // Store tool results for display
      setToolResults(prev => {
        const newMap = new Map(prev);
        newMap.set(toolCall.toolCallId, {
          toolCallId: toolCall.toolCallId,
          toolName: toolCall.toolName,
          result: toolCall.args
        });
        return newMap;
      });
    },
    onFinish: () => {
      // Refresh trip data after changes
      if (onUpdate) {
        onUpdate(trip);
      }
    }
  });

  // Handle tool result interactions
  const handleHotelSelect = async (hotel: any, toolCallId: string) => {
    const toolResult = toolResults.get(toolCallId);
    if (!toolResult) return;

    // Send message to add hotel
    await append({
      role: 'user',
      content: `Add "${hotel.name}" at ${hotel.address} to my trip as accommodation. Estimated price: $${hotel.estimatedPrice}/night.`
    });
  };

  const handleActivitySelect = async (activity: any, date: string) => {
    // Determine day number from date
    const activityDate = new Date(date);
    const tripStart = new Date(trip.startDate);
    const dayNumber = Math.ceil((activityDate.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    await append({
      role: 'user',
      content: `Add "${activity.name}" to Day ${dayNumber} of my trip. ${activity.startTime ? `Start time: ${activity.startTime}` : ''} ${activity.duration ? `Duration: ${activity.duration} minutes` : ''}`
    });
  };

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0 && authToken) {
      const hasAccommodation = trip.itinerary?.some(day => day.accommodations && day.accommodations.length > 0);
      const greeting = hasAccommodation 
        ? `Hi! I'm here to help you plan your trip to ${trip.destination?.name || 'your destination'}. What would you like to explore today?`
        : `Hi! I see you're planning a trip to ${trip.destination?.name || 'your destination'}. Would you like me to help you find hotels or activities?`;
      
      append({
        role: 'assistant',
        content: greeting
      });
    }
  }, [authToken]);

  // Quick action buttons
  const quickActions = [
    { label: 'Find Hotels', icon: Hotel, action: `Find hotels in ${trip.destination?.name || 'the area'} for my trip dates` },
    { label: 'Must-See Attractions', icon: MapPin, action: `What are the must-see attractions in ${trip.destination?.name}?` },
    { label: 'Restaurant Recommendations', icon: DollarSign, action: `Recommend restaurants for dinner in ${trip.destination?.name}` },
    { label: 'Day Planning', icon: Calendar, action: 'Help me plan activities for tomorrow' }
  ];

  // Show loading state while getting auth token
  if (!authToken) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">Initializing chat...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">AI Travel Assistant</h3>
            <p className="text-sm text-muted-foreground">
              Powered by advanced trip planning tools
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map((message) => {
            const isUser = message.role === 'user';
            const toolCallsInMessage = message.toolInvocations || [];
            
            return (
              <div key={message.id}>
                <div className={cn(
                  'flex gap-3',
                  isUser ? 'justify-end' : 'justify-start'
                )}>
                  {!isUser && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={cn(
                    'rounded-lg px-4 py-2 max-w-[80%]',
                    isUser
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  {isUser && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>

                {/* Tool results */}
                {toolCallsInMessage.map((toolCall: any) => {
                  const result = toolCall.result;
                  if (!result) return null;

                  return (
                    <div key={toolCall.toolCallId} className="ml-11 mt-2">
                      {toolCall.toolName === 'search_hotels' && result.hotels && (
                        <HotelSearchResults 
                          results={result} 
                          onSelect={(hotel) => handleHotelSelect(hotel, toolCall.toolCallId)}
                        />
                      )}
                      
                      {toolCall.toolName === 'search_activities' && result.activities && (
                        <ActivitySearchResults 
                          results={result} 
                          onSelect={(activity) => handleActivitySelect(activity, result.date)}
                        />
                      )}
                      
                      {toolCall.toolName === 'add_to_itinerary' && (
                        <AddToItineraryResult result={result} />
                      )}
                      
                      {toolCall.toolName === 'check_availability' && (
                        <Card className="p-3 mt-2">
                          <p className="text-sm">
                            {result.available 
                              ? '✅ This time slot is available!'
                              : `⚠️ Time conflict with: ${result.conflicts.map((c: any) => c.name).join(', ')}`
                            }
                          </p>
                        </Card>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
          
          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="border-t p-4">
          <p className="text-sm text-muted-foreground mb-2">Quick actions:</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                onClick={() => {
                  append({
                    role: 'user',
                    content: action.action
                  });
                }}
              >
                <action.icon className="h-4 w-4 mr-1" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about hotels, activities, restaurants..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}