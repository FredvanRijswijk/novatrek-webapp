'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, Search, Calendar, ListTodo, Sparkles, Clock, Info, CheckCircle2, Bell, AlertCircle, Users, Heart, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEnhancedChat } from '@/hooks/use-enhanced-chat';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ActivityDetailsModal } from './ActivityDetailsModal';
import { toast } from 'sonner';

// Helper function to safely parse dates from various formats
function parseDate(date: any): Date {
  if (!date) return new Date();
  
  // Handle Firestore Timestamp
  if (date?.toDate) {
    return date.toDate();
  }
  
  // Handle JavaScript Date
  if (date instanceof Date) {
    return date;
  }
  
  // Handle string dates
  if (typeof date === 'string') {
    // If it's just a date string (YYYY-MM-DD), add time to avoid timezone issues
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Date(date + 'T00:00:00');
    }
    return new Date(date);
  }
  
  // Fallback
  return new Date();
}

interface EnhancedTravelChatProps {
  tripId: string;
  currentDate?: string;
  className?: string;
}

export function EnhancedTravelChat({ 
  tripId, 
  currentDate,
  className 
}: EnhancedTravelChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addingActivity, setAddingActivity] = useState<string | null>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    isReady,
    isAuthenticated,
    append
  } = useEnhancedChat({
    tripId,
    currentDate,
    model: 'gpt-4o'
  });

  // Handler for adding activity to itinerary
  const handleAddToItinerary = useCallback((activity: any) => {
    // Set loading state for this specific activity
    setAddingActivity(activity.id);
    
    // Show initial toast that we're processing
    toast.loading(
      <div className="flex items-start gap-2">
        <Loader2 className="h-5 w-5 animate-spin flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Adding to itinerary...</p>
          <p className="text-sm text-muted-foreground">{activity.name}</p>
        </div>
      </div>,
      {
        id: `add-${activity.id}`,
        duration: Infinity
      }
    );
    
    // Format the message to include all necessary activity details
    const activityDetails = {
      id: activity.id || `place-${Date.now()}`,
      name: activity.name,
      description: activity.description || '',
      location: {
        lat: activity.location?.lat || activity.lat,
        lng: activity.location?.lng || activity.lng,
        address: activity.address || activity.location?.address || ''
      },
      duration: activity.duration || 120,
      price: activity.price,
      category: activity.category || activity.type || 'activity',
      bookingRequired: activity.bookingRequired || false,
      bookingUrl: activity.bookingUrl,
      photos: activity.photos || [],
      expertRecommended: activity.rankingFactors?.expertEndorsed || false
    };

    // Include the date if available - ensure it's just the date part
    const dateForTool = currentDate ? (currentDate.includes('T') ? currentDate.split('T')[0] : currentDate) : '';
    const dateStr = currentDate ? ` for ${format(new Date(currentDate), 'MMMM d, yyyy')}` : '';

    // Create a properly formatted request
    const requestData = {
      activity: activityDetails,
      date: dateForTool
    };

    // Send a structured message that the AI can parse
    append({
      role: 'user',
      content: `Please add "${activity.name}" to my itinerary${dateStr}. Location: ${activity.address}. Tool parameters: ${JSON.stringify(requestData)}`
    });
  }, [append, currentDate]);

  // Handler for viewing activity details
  const handleViewDetails = useCallback((activity: any) => {
    setSelectedActivity(activity);
    setIsModalOpen(true);
  }, []);

  // Scroll to bottom when new messages arrive and clear loading states
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    
    // Clear adding activity state when we get a response
    if (!isLoading && addingActivity) {
      setAddingActivity(null);
    }
  }, [messages, isLoading]);
  
  // Monitor for successful activity additions
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant') return;
    
    // Check if the last message contains a successful add_activity tool invocation
    const toolInvocations = lastMessage.toolInvocations || [];
    const addActivityInvocation = toolInvocations.find(
      (inv: any) => inv.toolName === 'add_activity' && inv.result?.success
    );
    
    if (addActivityInvocation) {
      const activityData = addActivityInvocation.result.data?.activity;
      const activityName = activityData?.name;
      const time = activityData?.time;
      const endTime = activityData?.endTime;
      const activityId = activityData?.id;
      
      // Dismiss the loading toast
      if (activityId) {
        toast.dismiss(`add-${activityId}`);
      }
      
      // Show success toast
      toast.success(
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Activity added successfully!</p>
            <p className="text-sm text-muted-foreground">
              {activityName}<br />
              {time && endTime && `${time} - ${endTime}`}
            </p>
          </div>
        </div>,
        {
          duration: 5000
        }
      );
      
      // Show warnings if any
      const warnings = addActivityInvocation.result.data?.warnings;
      if (warnings && warnings.length > 0) {
        setTimeout(() => {
          toast.warning(
            <div>
              <p className="font-semibold">Note:</p>
              <p className="text-sm">{warnings.join('. ')}</p>
            </div>,
            { duration: 6000 }
          );
        }, 500);
      }
    }
    
    // Check for failed add_activity invocations
    const failedAddActivity = toolInvocations.find(
      (inv: any) => inv.toolName === 'add_activity' && !inv.result?.success
    );
    
    if (failedAddActivity) {
      const activityId = failedAddActivity.args?.activity?.id;
      if (activityId) {
        toast.dismiss(`add-${activityId}`);
      }
      
      toast.error(
        <div>
          <p className="font-semibold">Failed to add activity</p>
          <p className="text-sm text-muted-foreground">
            {failedAddActivity.result?.error || 'An error occurred'}
          </p>
        </div>,
        { duration: 5000 }
      );
    }
  }, [messages]);

  if (!isReady) {
    return (
      <Card className={cn("p-4", className)}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {!isAuthenticated ? 'Authenticating...' : 'Initializing chat...'}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className={cn("flex flex-col h-[600px]", className)}>
        {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">AI Travel Assistant</h3>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Enhanced Mode
          </Badge>
        </div>
        {currentDate && (
          <p className="text-sm text-muted-foreground mt-1">
            Planning for {format(new Date(currentDate), 'MMMM d, yyyy')}
          </p>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-semibold mb-2">
                Hi! I'm your intelligent travel assistant
              </h4>
              <p className="text-muted-foreground mb-4">
                I can help you search for activities, plan your itinerary, and manage your trip.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <SuggestedPrompt
                  icon={<Search className="h-4 w-4" />}
                  text="Find top-rated restaurants nearby"
                  onClick={() => handleInputChange({
                    target: { value: "Find top-rated restaurants nearby" }
                  } as any)}
                />
                <SuggestedPrompt
                  icon={<Calendar className="h-4 w-4" />}
                  text="Plan tomorrow's activities"
                  onClick={() => handleInputChange({
                    target: { value: "Help me plan tomorrow's activities" }
                  } as any)}
                />
                <SuggestedPrompt
                  icon={<ListTodo className="h-4 w-4" />}
                  text="Create my trip todo list"
                  onClick={() => handleInputChange({
                    target: { value: "Create a todo list for my trip" }
                  } as any)}
                />
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={message.id || index}>
              <MessageDisplay 
                message={message} 
                onAddToItinerary={handleAddToItinerary}
                onViewDetails={handleViewDetails}
                addingActivity={addingActivity}
              />
              
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">AI is thinking...</span>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg">
              <p className="text-sm">Error: {error.message}</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask me anything about your trip..."
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
    </Card>

    {/* Activity Details Modal */}
    <ActivityDetailsModal
      activity={selectedActivity}
      isOpen={isModalOpen}
      onClose={() => {
        setIsModalOpen(false);
        setSelectedActivity(null);
      }}
      onAddToItinerary={handleAddToItinerary}
      isAddingActivity={selectedActivity && addingActivity === selectedActivity.id}
    />
  </>
  );
}

function MessageDisplay({ 
  message, 
  onAddToItinerary,
  onViewDetails,
  addingActivity
}: { 
  message: any;
  onAddToItinerary: (activity: any) => void;
  onViewDetails: (activity: any) => void;
  addingActivity: string | null;
}) {
  const isUser = message.role === 'user';

  // Check if message has tool invocations (from AI SDK)
  const toolInvocations = message.toolInvocations || [];

  return (
    <div className="space-y-2">
      <div className={cn(
        "flex gap-3",
        isUser ? "justify-end" : "justify-start"
      )}>
        {!isUser && (
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
          </div>
        )}
        
        <div className={cn(
          "max-w-[80%] rounded-lg px-4 py-2",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        {isUser && (
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Display tool invocations if present */}
      {!isUser && toolInvocations.length > 0 && (
        <div className="ml-11 space-y-2">
          {toolInvocations.map((invocation: any, index: number) => (
            <ToolResultDisplay 
              key={index} 
              invocation={invocation}
              onAddToItinerary={onAddToItinerary}
              onViewDetails={onViewDetails}
              addingActivity={addingActivity}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SuggestedPrompt({ 
  icon, 
  text, 
  onClick 
}: { 
  icon: React.ReactNode;
  text: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="gap-2"
    >
      {icon}
      {text}
    </Button>
  );
}



function ToolResultDisplay({ 
  invocation, 
  onAddToItinerary,
  onViewDetails,
  addingActivity
}: { 
  invocation: any;
  onAddToItinerary: (activity: any) => void;
  onViewDetails: (activity: any) => void;
  addingActivity: string | null;
}) {
  const { toolName, args, result } = invocation;
  
  // Handle search results
  if ((toolName === 'search_activities' || toolName === 'search_restaurants') && result?.data) {
    const allResults = result.data;
    const displayCount = 10; // Show top 10 results
    const activities = allResults.slice(0, displayCount);
    
    if (activities.length === 0) {
      return (
        <Card className="p-3 bg-muted/50">
          <p className="text-sm text-muted-foreground">No results found</p>
        </Card>
      );
    }
    
    return (
      <Card className="p-3 bg-muted/50">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {toolName === 'search_activities' ? 'Activities Found' : 'Restaurants Found'}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              Showing {activities.length} of {allResults.length} results
            </span>
          </div>
          {activities.map((activity: any, index: number) => (
            <div key={index} className="border-l-2 border-primary/20 pl-3 py-2">
              <div className="space-y-2">
                <div className="flex gap-3">
                  {/* Activity Image */}
                  {activity.photos && activity.photos.length > 0 && (
                    <div className="flex-shrink-0">
                      <img
                        src={activity.photos[0]}
                        alt={activity.name}
                        className="w-20 h-20 object-cover rounded-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Activity Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{activity.name}</p>
                        {activity.address && (
                          <p className="text-xs text-muted-foreground">{activity.address}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {activity.rating && (
                            <span className="text-xs">⭐ {activity.rating}</span>
                          )}
                          {activity.priceLevel && (
                            <span className="text-xs">{'$'.repeat(activity.priceLevel)}</span>
                          )}
                          {activity.rankingFactors?.expertEndorsed && (
                            <Badge variant="secondary" className="text-xs h-5">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Expert Pick
                            </Badge>
                          )}
                          {activity.dietaryFriendly && (
                            <Badge variant="outline" className="text-xs h-5 text-green-600">
                              🌱 {activity.dietaryIndicators?.[0] || 'Dietary options'}
                            </Badge>
                          )}
                        </div>
                        {/* Additional info */}
                        {activity.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {activity.description}
                          </p>
                        )}
                      </div>
                      {activity.novatrekScore && (
                        <Badge variant="outline" className="text-xs ml-2">
                          Score: {Math.round(activity.novatrekScore)}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => onAddToItinerary(activity)}
                        disabled={addingActivity === activity.id}
                      >
                        {addingActivity === activity.id ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Calendar className="h-3 w-3 mr-1" />
                            Add to Itinerary
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7"
                        onClick={() => onViewDetails(activity)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {allResults.length > displayCount && (
            <div className="text-center pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                {allResults.length - displayCount} more results available. 
                Ask me to show more or refine your search.
              </p>
            </div>
          )}
        </div>
      </Card>
    );
  }
  
  // Handle add activity results
  if (toolName === 'add_activity') {
    if (result?.success && result?.data) {
      const { activity, warnings, suggestions, optimizedTime } = result.data;
      
      return (
        <Card className="p-3 bg-green-50 dark:bg-green-950/20">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                ✓ Added to itinerary
              </span>
            </div>
            
            {activity && (
              <div className="pl-6 space-y-1">
                <p className="text-sm font-medium">{activity.name}</p>
                <p className="text-xs text-muted-foreground">
                  {activity.time} - {activity.endTime}
                </p>
              </div>
            )}
            
            {warnings && warnings.length > 0 && (
              <div className="pl-6 space-y-1">
                {warnings.map((warning: string, i: number) => (
                  <p key={i} className="text-xs text-orange-600">⚠️ {warning}</p>
                ))}
              </div>
            )}
            
            {suggestions && suggestions.length > 0 && (
              <div className="pl-6 space-y-1">
                {suggestions.map((suggestion: string, i: number) => (
                  <p key={i} className="text-xs text-blue-600">💡 {suggestion}</p>
                ))}
              </div>
            )}
          </div>
        </Card>
      );
    } else {
      return (
        <Card className="p-3 bg-red-50 dark:bg-red-950/20">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-600">
              Failed to add activity: {result?.error || 'Unknown error'}
            </span>
          </div>
        </Card>
      );
    }
  }
  
  // Handle todo creation results
  if (toolName === 'create_todos' && result?.data) {
    return (
      <Card className="p-3 bg-muted/50">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <ListTodo className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Todos Created</span>
            {result.metadata?.totalTodos && (
              <Badge variant="secondary" className="text-xs">
                {result.metadata.totalTodos} items
              </Badge>
            )}
          </div>
          {result.data.map((todo: any) => (
            <div key={todo.id} className="border-l-2 border-primary/20 pl-3 py-2">
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 rounded border border-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{todo.task}</span>
                    {todo.priority === 'high' && (
                      <Badge variant="destructive" className="text-xs h-5">High Priority</Badge>
                    )}
                    {todo.autoCompletable && (
                      <Badge variant="secondary" className="text-xs h-5">Auto-completable</Badge>
                    )}
                  </div>
                  {todo.expertTip && (
                    <p className="text-xs text-muted-foreground italic">💡 {todo.expertTip}</p>
                  )}
                  {todo.deadline && (
                    <p className="text-xs text-muted-foreground">
                      Due: {format(new Date(todo.deadline), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {result.metadata?.suggestions && result.metadata.suggestions.length > 0 && (
            <div className="mt-2 pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                ℹ️ {result.metadata.suggestions[0]}
              </p>
            </div>
          )}
        </div>
      </Card>
    );
  }
  
  // Handle time slot finder results
  if (toolName === 'find_time_slots' && result?.data) {
    const { availableSlots, bestSlot, daySchedule, warnings } = result.data;
    
    return (
      <Card className="p-3 bg-muted/50">
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Available Time Slots</span>
            <Badge variant="secondary" className="text-xs">
              {availableSlots.length} slots found
            </Badge>
          </div>
          
          {/* Day Schedule Summary */}
          <div className="bg-background/50 rounded-lg p-2 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Activities:</span>
              <span>{daySchedule.totalActivities}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Busy Hours:</span>
              <span>{daySchedule.busyHours}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Free Hours:</span>
              <span>{daySchedule.freeHours}h</span>
            </div>
          </div>
          
          {/* Best Slot Highlight */}
          {bestSlot && (
            <div className="border-l-4 border-green-500 pl-3 py-2 bg-green-50 dark:bg-green-950/20">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">Best Time Slot</span>
              </div>
              <p className="text-sm">{bestSlot.startTime} - {bestSlot.endTime}</p>
              <p className="text-xs text-muted-foreground">Quality: {bestSlot.quality}</p>
            </div>
          )}
          
          {/* Other Available Slots */}
          {availableSlots.slice(0, 5).map((slot, index) => (
            <div key={index} className="border-l-2 border-primary/20 pl-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">{slot.startTime} - {slot.endTime}</span>
                <Badge 
                  variant={slot.quality === 'ideal' ? 'default' : slot.quality === 'good' ? 'secondary' : 'outline'}
                  className="text-xs"
                >
                  {slot.quality}
                </Badge>
              </div>
              {slot.conflicts.length > 0 && (
                <p className="text-xs text-orange-600 mt-1">⚠️ {slot.conflicts.join(', ')}</p>
              )}
              {slot.suggestions.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">{slot.suggestions[0]}</p>
              )}
            </div>
          ))}
          
          {warnings.length > 0 && (
            <div className="mt-2 pt-2 border-t space-y-1">
              {warnings.map((warning, i) => (
                <p key={i} className="text-xs text-orange-600">⚠️ {warning}</p>
              ))}
            </div>
          )}
        </div>
      </Card>
    );
  }
  
  // Handle create trip days results
  if (toolName === 'create_trip_days' && result?.data) {
    const { createdDays, existingDays, totalDays } = result.data;
    
    return (
      <Card className="p-3 bg-muted/50">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Trip Days Setup</span>
          </div>
          
          {createdDays.length > 0 && (
            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
              <p className="text-sm text-green-600">
                ✓ Created {createdDays.length} days for your trip
              </p>
              <div className="mt-2 space-y-1">
                {createdDays.slice(0, 5).map((day, index) => (
                  <p key={index} className="text-xs text-muted-foreground">
                    • {format(parseDate(day.date), 'EEEE, MMMM d, yyyy')}
                  </p>
                ))}
                {createdDays.length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    • ... and {createdDays.length - 5} more days
                  </p>
                )}
              </div>
            </div>
          )}
          
          {existingDays.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {existingDays.length} days already existed
            </div>
          )}
          
          <p className="text-sm">
            Your trip now has {totalDays} days ready for planning!
          </p>
        </div>
      </Card>
    );
  }
  
  // Handle weather filter results
  if (toolName === 'weather_filter' && result?.data) {
    const { weather, filteredActivities, recommendations, summary } = result.data;
    
    return (
      <Card className="p-3 bg-muted/50">
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Weather Analysis</span>
          </div>
          
          {/* Weather Summary */}
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
            <p className="text-sm">{summary}</p>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <span>🌡️ {weather.temperature.low}°C - {weather.temperature.high}°C</span>
              <span>☔ {weather.precipitation}% chance</span>
              <span>💨 {weather.windSpeed} km/h</span>
            </div>
          </div>
          
          {/* Best Time Recommendation */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Best time for activities: <strong>{recommendations.bestTimeOfDay}</strong></span>
          </div>
          
          {/* Activity Suitability */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Activity Suitability:</p>
            {filteredActivities.slice(0, 5).map((filtered, index) => (
              <div key={index} className="border-l-2 border-primary/20 pl-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{filtered.activity.name}</span>
                  <Badge 
                    variant={
                      filtered.suitability === 'excellent' ? 'default' : 
                      filtered.suitability === 'good' ? 'secondary' : 
                      filtered.suitability === 'fair' ? 'outline' : 'destructive'
                    }
                    className="text-xs"
                  >
                    {filtered.suitability}
                  </Badge>
                </div>
                {filtered.warnings.length > 0 && (
                  <p className="text-xs text-orange-600 mt-1">{filtered.warnings[0]}</p>
                )}
                {filtered.bestTime && (
                  <p className="text-xs text-green-600 mt-1">Best time: {filtered.bestTime}</p>
                )}
              </div>
            ))}
          </div>
          
          {/* Weather Tips */}
          {recommendations.weatherTips.length > 0 && (
            <div className="mt-2 pt-2 border-t space-y-1">
              <p className="text-xs font-medium mb-1">Weather Tips:</p>
              {recommendations.weatherTips.map((tip, i) => (
                <p key={i} className="text-xs text-muted-foreground">• {tip}</p>
              ))}
            </div>
          )}
        </div>
      </Card>
    );
  }
  
  // Handle booking reminder results
  if (toolName === 'create_booking_reminders' && result?.data) {
    const { reminders, stats, recommendations } = result.data;
    
    return (
      <Card className="p-3 bg-muted/50">
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Booking Reminders Created</span>
            <Badge variant="secondary" className="text-xs">
              {stats.remindersCreated} reminders
            </Badge>
          </div>
          
          {/* Stats overview */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center p-2 bg-background/50 rounded">
              <p className="font-medium">{stats.totalActivities}</p>
              <p className="text-muted-foreground">Activities</p>
            </div>
            <div className="text-center p-2 bg-background/50 rounded">
              <p className="font-medium">{stats.bookingRequired}</p>
              <p className="text-muted-foreground">Need Booking</p>
            </div>
            <div className="text-center p-2 bg-background/50 rounded">
              <p className="font-medium text-orange-600">{stats.urgentReminders}</p>
              <p className="text-muted-foreground">Urgent</p>
            </div>
          </div>
          
          {/* Urgent reminders highlight */}
          {stats.urgentReminders > 0 && (
            <div className="border-l-4 border-orange-500 pl-3 py-2 bg-orange-50 dark:bg-orange-950/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-600">
                  {stats.urgentReminders} activities need booking within 3 days!
                </span>
              </div>
            </div>
          )}
          
          {/* Reminder list */}
          {reminders.slice(0, 5).map((reminder, index) => (
            <div key={index} className="border-l-2 border-primary/20 pl-3 py-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{reminder.activityName}</span>
                  <Badge 
                    variant={reminder.priority === 'high' ? 'destructive' : 
                            reminder.priority === 'medium' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {reminder.priority} priority
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {reminder.type === 'booking' ? '📅' : reminder.type === 'confirmation' ? '✓' : '🎒'} 
                  {' '}{reminder.message}
                </p>
                <p className="text-xs text-muted-foreground">
                  Reminder: {format(new Date(reminder.reminderDate), 'MMM d, yyyy')}
                </p>
                {reminder.bookingUrl && (
                  <a 
                    href={reminder.bookingUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Book now →
                  </a>
                )}
                {reminder.tips.length > 0 && (
                  <div className="mt-1">
                    <p className="text-xs text-muted-foreground italic">
                      💡 {reminder.tips[0]}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {reminders.length > 5 && (
            <p className="text-xs text-center text-muted-foreground">
              ... and {reminders.length - 5} more reminders
            </p>
          )}
          
          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="mt-2 pt-2 border-t space-y-1">
              <p className="text-xs font-medium mb-1">Recommendations:</p>
              {recommendations.map((rec, i) => (
                <p key={i} className="text-xs text-muted-foreground">• {rec}</p>
              ))}
            </div>
          )}
        </div>
      </Card>
    );
  }
  
  // Handle group preference aggregation results
  if (toolName === 'aggregate_preferences' && result?.data) {
    const { groupSize, conflicts, compromises, recommendations, ...preferences } = result.data;
    
    return (
      <Card className="p-3 bg-muted/50">
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Group Preferences Analyzed</span>
            <Badge variant="secondary" className="text-xs">
              {groupSize} travelers
            </Badge>
          </div>
          
          {/* Conflicts summary */}
          {conflicts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-orange-600">Preference Differences Found:</p>
              {conflicts.map((conflict, i) => (
                <div key={i} className="border-l-2 border-orange-400 pl-3 py-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium capitalize">{conflict.field}</span>
                    <Badge 
                      variant={conflict.severity === 'high' ? 'destructive' : 
                              conflict.severity === 'medium' ? 'default' : 'secondary'}
                      className="text-xs h-5"
                    >
                      {conflict.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{conflict.resolution}</p>
                </div>
              ))}
            </div>
          )}
          
          {/* Compromises */}
          {compromises.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
              <p className="text-xs font-medium mb-2 flex items-center gap-1">
                <Heart className="h-3 w-3" /> Suggested Compromises:
              </p>
              {compromises.map((compromise, i) => (
                <p key={i} className="text-xs text-muted-foreground">• {compromise}</p>
              ))}
            </div>
          )}
          
          {/* Group recommendations */}
          {recommendations.length > 0 && (
            <div className="mt-2 pt-2 border-t space-y-1">
              <p className="text-xs font-medium mb-1">Group Travel Tips:</p>
              {recommendations.map((rec, i) => (
                <p key={i} className="text-xs text-muted-foreground">💡 {rec}</p>
              ))}
            </div>
          )}
        </div>
      </Card>
    );
  }
  
  // Handle group activity search results
  if (toolName === 'group_activity_search' && result?.data) {
    const activities = result.data;
    
    return (
      <Card className="p-3 bg-muted/50">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Group-Friendly Options</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {activities.length} suitable results
            </span>
          </div>
          
          {activities.slice(0, 5).map((activity: any, index: number) => (
            <div key={index} className="border-l-2 border-primary/20 pl-3 py-2">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{activity.name}</p>
                    <p className="text-xs text-muted-foreground">{activity.address}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activity.groupSuitability.score}% match
                  </Badge>
                </div>
                
                {/* Group suitability reasons */}
                <div className="space-y-1">
                  {activity.groupSuitability.reasons.slice(0, 2).map((reason: string, i: number) => (
                    <p key={i} className="text-xs text-green-600">✓ {reason}</p>
                  ))}
                  {activity.groupSuitability.warnings.map((warning: string, i: number) => (
                    <p key={i} className="text-xs text-orange-600">⚠️ {warning}</p>
                  ))}
                </div>
                
                {/* Group features */}
                <div className="flex gap-2 flex-wrap">
                  {activity.groupFeatures.hasGroupDiscounts && (
                    <Badge variant="secondary" className="text-xs h-5">Group discounts</Badge>
                  )}
                  {activity.groupFeatures.hasPrivateOptions && (
                    <Badge variant="secondary" className="text-xs h-5">Private options</Badge>
                  )}
                  {activity.groupFeatures.flexibleParticipation && (
                    <Badge variant="secondary" className="text-xs h-5">Flexible participation</Badge>
                  )}
                </div>
                
                {/* Action buttons */}
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() => onAddToItinerary(activity)}
                    disabled={addingActivity === activity.id}
                  >
                    {addingActivity === activity.id ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Calendar className="h-3 w-3 mr-1" />
                        Add to Itinerary
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7"
                    onClick={() => onViewDetails(activity)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {result.metadata?.suggestions && result.metadata.suggestions.length > 0 && (
            <div className="mt-2 pt-2 border-t space-y-1">
              <p className="text-xs font-medium mb-1">Group Planning Tips:</p>
              {result.metadata.suggestions.map((tip: string, i: number) => (
                <p key={i} className="text-xs text-muted-foreground">• {tip}</p>
              ))}
            </div>
          )}
        </div>
      </Card>
    );
  }
  
  // Handle itinerary overview results
  if (toolName === 'view_itinerary' && result?.data) {
    const { days, summary, suggestions, gaps } = result.data;
    
    return (
      <Card className="p-3 bg-muted/50">
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Map className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Trip Itinerary Overview</span>
            <Badge variant="secondary" className="text-xs">
              {summary.totalActivities} activities
            </Badge>
          </div>
          
          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="text-center p-2 bg-background/50 rounded">
              <p className="font-medium">{summary.totalDays}</p>
              <p className="text-muted-foreground">Total Days</p>
            </div>
            <div className="text-center p-2 bg-background/50 rounded">
              <p className="font-medium">{summary.plannedDays}</p>
              <p className="text-muted-foreground">Planned</p>
            </div>
            <div className="text-center p-2 bg-background/50 rounded">
              <p className="font-medium">{summary.bookingRequired}</p>
              <p className="text-muted-foreground">Need Booking</p>
            </div>
            <div className="text-center p-2 bg-background/50 rounded">
              <p className="font-medium">{summary.averageActivitiesPerDay}</p>
              <p className="text-muted-foreground">Avg/Day</p>
            </div>
          </div>
          
          {/* Days overview */}
          <div className="space-y-2">
            {days.slice(0, 5).map((day, index) => (
              <div key={index} className="border-l-2 border-primary/20 pl-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">
                    {format(parseDate(day.date), 'EEEE, MMM d')}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {day.activities.length} activities
                    </Badge>
                    {day.stats.busyPercentage > 70 && (
                      <Badge variant="destructive" className="text-xs">Busy</Badge>
                    )}
                    {day.stats.busyPercentage < 30 && day.activities.length > 0 && (
                      <Badge variant="secondary" className="text-xs">Light</Badge>
                    )}
                  </div>
                </div>
                
                {day.activities.length > 0 ? (
                  <div className="space-y-1">
                    {day.activities.slice(0, 3).map((activity, i) => (
                      <div key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="font-medium">{activity.time}</span>
                        <span className="truncate">{activity.name}</span>
                        {activity.bookingRequired && (
                          <Badge variant="outline" className="text-xs h-4 px-1">Book</Badge>
                        )}
                      </div>
                    ))}
                    {day.activities.length > 3 && (
                      <p className="text-xs text-muted-foreground italic">
                        ... and {day.activities.length - 3} more
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No activities planned</p>
                )}
              </div>
            ))}
            
            {days.length > 5 && (
              <p className="text-xs text-center text-muted-foreground">
                ... and {days.length - 5} more days
              </p>
            )}
          </div>
          
          {/* Gaps and issues */}
          {gaps.length > 0 && (
            <div className="border-l-4 border-orange-500 pl-3 py-2 bg-orange-50 dark:bg-orange-950/20">
              <p className="text-xs font-medium text-orange-600 mb-1">Planning Gaps Found:</p>
              {gaps.slice(0, 3).map((gap, i) => (
                <div key={i} className="text-xs text-muted-foreground mb-1">
                  <span className="font-medium">{format(parseDate(gap.date), 'MMM d')}:</span>
                  {' '}{gap.issue} - {gap.suggestion}
                </div>
              ))}
            </div>
          )}
          
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="mt-2 pt-2 border-t space-y-1">
              <p className="text-xs font-medium mb-1">Suggestions:</p>
              {suggestions.map((suggestion, i) => (
                <p key={i} className="text-xs text-muted-foreground">💡 {suggestion}</p>
              ))}
            </div>
          )}
        </div>
      </Card>
    );
  }
  
  // Generic fallback for other tools
  return null;
}