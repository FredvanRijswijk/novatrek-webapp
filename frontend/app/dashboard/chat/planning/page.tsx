'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Send, 
  Loader2, 
  MapPin, 
  Calendar,
  Users,
  DollarSign,
  Sparkles,
  Plus,
  Bot,
  User,
  Clock,
  Target,
  Lightbulb,
  CheckCircle,
  ArrowRight,
  Plane,
  Hotel,
  Utensils,
  Camera,
  Copy,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useFirebase } from '@/lib/firebase/context';
import { TripModelEnhanced as TripModel } from '@/lib/models/trip-enhanced';
import { useTravelPreferences } from '@/hooks/use-travel-preferences';
import { Trip } from '@/types/travel';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  tripData?: Partial<Trip>;
  activities?: any[];
}

interface PlanningContext {
  destination?: string;
  duration?: number;
  budget?: string;
  travelers?: number;
  interests?: string[];
  accommodation?: string;
  transport?: string;
  startDate?: Date;
}

export default function ChatPlanningPage() {
  const router = useRouter();
  const { user } = useFirebase();
  const { preferences } = useTravelPreferences();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [planningContext, setPlanningContext] = useState<PlanningContext>({});
  const [quickPrompts, setQuickPrompts] = useState<string[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize with welcome message
    setMessages([{
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your AI travel planning assistant. I'll help you create a detailed itinerary for your next adventure. 

To get started, tell me:
- Where would you like to go?
- When do you want to travel? (e.g., "July 15", "next month", "in December")
- How many days are you planning to travel?
- What's your approximate budget?
- Are you traveling solo or with others?

Or you can just tell me about your dream trip and I'll help you plan it!`,
      timestamp: new Date(),
      suggestions: [
        "Plan a 7-day trip to Japan",
        "I want a romantic weekend in Paris",
        "Family vacation to Orlando theme parks",
        "Backpacking through Southeast Asia"
      ]
    }]);

    // Set initial quick prompts
    updateQuickPrompts({});
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const updateQuickPrompts = (context: PlanningContext) => {
    const prompts = [];
    
    if (!context.destination) {
      prompts.push(
        "Suggest destinations for beach lovers",
        "Best cities for food tourism",
        "Adventure destinations in Europe",
        "Family-friendly destinations"
      );
    } else if (!context.startDate) {
      prompts.push(
        "I want to travel in July",
        "Planning for next month",
        "Christmas vacation",
        "Spring break trip"
      );
    } else if (!context.duration) {
      prompts.push(
        "Weekend getaway (2-3 days)",
        "One week vacation",
        "Two week adventure",
        "Month-long journey"
      );
    } else if (!context.budget) {
      prompts.push(
        "Budget backpacker ($50/day)",
        "Mid-range comfort ($150/day)",
        "Luxury experience ($300+/day)",
        "Help me estimate costs"
      );
    } else {
      prompts.push(
        "Create day-by-day itinerary",
        "Find best places to stay",
        "Recommend must-try restaurants",
        "Suggest unique activities"
      );
    }
    
    setQuickPrompts(prompts);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare context for AI
      const aiContext = {
        planningContext,
        userPreferences: preferences,
        previousMessages: messages.slice(-5), // Last 5 messages for context
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a travel planning assistant helping to create detailed itineraries. 
              Current planning context: ${JSON.stringify(planningContext)}
              User preferences: ${JSON.stringify(preferences)}
              
              Help the user plan their trip step by step. Extract key information like:
              - Destination
              - Travel dates (when they want to go)
              - Duration
              - Budget
              - Number of travelers
              - Interests and preferences
              
              If the user hasn't specified when they want to travel, ask them for their preferred travel dates or timeframe.
              When you have enough information, suggest a day-by-day itinerary with specific activities, restaurants, and accommodations.
              Format your responses in a friendly, conversational tone.`
            },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: input }
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      // Handle streaming response from Vercel AI SDK
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');
      
      let fullResponse = '';
      const decoder = new TextDecoder();
      let buffer = '';
      
      // Reset streaming message
      setStreamingMessage('');
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          
          // Vercel AI SDK format: "0:chunk text"
          if (line.match(/^\d+:/)) {
            const colonIndex = line.indexOf(':');
            const content = line.slice(colonIndex + 1);
            
            // Remove quotes if present
            if (content.startsWith('"') && content.endsWith('"')) {
              const text = JSON.parse(content);
              fullResponse += text;
              setStreamingMessage(prev => prev + text);
            } else {
              fullResponse += content;
              setStreamingMessage(prev => prev + content);
            }
          }
          // Standard SSE format: "data: {...}"
          else if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              // Handle different response formats
              const text = parsed.text || parsed.content || parsed.delta?.text || parsed.delta?.content || '';
              fullResponse += text;
              setStreamingMessage(prev => prev + text);
            } catch (e) {
              console.error('Failed to parse SSE data:', data);
            }
          }
        }
      }
      
      // Process any remaining buffer
      if (buffer.trim()) {
        console.log('Remaining buffer:', buffer);
      }
      
      console.log('Full response:', fullResponse);
      
      if (!fullResponse.trim()) {
        throw new Error('No response content received from AI');
      }
      
      // Clear streaming message
      setStreamingMessage('');
      
      // Extract planning context from response
      const updatedContext = extractPlanningContext(input, planningContext);
      setPlanningContext(updatedContext);
      updateQuickPrompts(updatedContext);

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
        suggestions: generateSuggestions(updatedContext)
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Check if we have enough info to create a trip
      if (updatedContext.destination && updatedContext.duration && updatedContext.budget) {
        // Use extracted start date or default to 7 days from now
        const tripStartDate = updatedContext.startDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const tripEndDate = new Date(tripStartDate.getTime() + (updatedContext.duration * 24 * 60 * 60 * 1000));
        
        assistantMessage.tripData = {
          destination: { name: updatedContext.destination } as any,
          startDate: tripStartDate,
          endDate: tripEndDate,
          budget: { 
            total: parseInt(updatedContext.budget.replace(/[^0-9]/g, '')) || 1000, 
            currency: 'USD',
            breakdown: {
              accommodation: 0,
              transportation: 0,
              food: 0,
              activities: 0,
              miscellaneous: 0
            }
          }
        };
      }

    } catch (error) {
      console.error('Error in chat:', error);
      
      // Add error message to chat
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I'm sorry, I encountered an error while processing your request. ${error instanceof Error ? error.message : 'Please try again.'}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const extractPlanningContext = (message: string, currentContext: PlanningContext): PlanningContext => {
    const context = { ...currentContext };
    
    // Simple extraction logic - in production, this would use NLP
    const lowerMessage = message.toLowerCase();
    
    // Extract destination
    const destinations = ['japan', 'paris', 'london', 'new york', 'bali', 'thailand', 'italy', 'spain'];
    destinations.forEach(dest => {
      if (lowerMessage.includes(dest)) {
        context.destination = dest.charAt(0).toUpperCase() + dest.slice(1);
      }
    });
    
    // Extract duration
    const durationMatch = message.match(/(\d+)\s*(day|week|night)/i);
    if (durationMatch) {
      const num = parseInt(durationMatch[1]);
      const unit = durationMatch[2].toLowerCase();
      context.duration = unit.includes('week') ? num * 7 : num;
    }
    
    // Extract budget
    const budgetMatch = message.match(/\$?\d+(?:,\d+)?(?:\s*(?:per|\/)\s*day)?|\$?\d+k/i);
    if (budgetMatch) {
      context.budget = budgetMatch[0];
    }
    
    // Extract travelers
    const travelersMatch = message.match(/(\d+)\s*(?:people|persons|travelers|adults)/i);
    if (travelersMatch) {
      context.travelers = parseInt(travelersMatch[1]);
    }
    
    // Extract dates
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const monthRegex = months.join('|');
    const dateMatch = message.match(new RegExp(`(${monthRegex})\\s*(\\d{1,2})(?:st|nd|rd|th)?(?:\\s*,?\\s*(\\d{4}))?`, 'i'));
    
    if (dateMatch) {
      const monthIndex = months.indexOf(dateMatch[1].toLowerCase());
      const day = parseInt(dateMatch[2]);
      const year = dateMatch[3] ? parseInt(dateMatch[3]) : new Date().getFullYear();
      
      // If the date is in the past this year, assume next year
      const potentialDate = new Date(year, monthIndex, day);
      if (potentialDate < new Date() && !dateMatch[3]) {
        potentialDate.setFullYear(year + 1);
      }
      
      context.startDate = potentialDate;
    } else if (lowerMessage.includes('next week')) {
      context.startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    } else if (lowerMessage.includes('next month')) {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      context.startDate = nextMonth;
    }
    
    return context;
  };

  const generateSuggestions = (context: PlanningContext): string[] => {
    const suggestions = [];
    
    if (context.destination && context.duration) {
      suggestions.push(
        `Show me the best attractions in ${context.destination}`,
        `Find hotels in ${context.destination} within my budget`,
        `Recommend restaurants in ${context.destination}`,
        `Create a ${context.duration}-day itinerary`
      );
    }
    
    return suggestions;
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const handleCreateTrip = async (tripData: Partial<Trip>) => {
    if (!user) {
      toast.error('Please sign in to create a trip');
      return;
    }

    try {
      const tripId = await TripModel.create({
        ...tripData,
        userId: user.uid,
        title: `Trip to ${tripData.destination?.name}`,
        status: 'planning',
        travelers: [{
          id: user.uid,
          name: user.displayName || user.email || 'Me',
          email: user.email || undefined,
          relationship: 'self'
        }],
        itinerary: [] // This will be overridden by TripModel.create anyway
      } as Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>);

      toast.success('Trip created! Redirecting to trip planner...');
      router.push(`/dashboard/trips/${tripId}/plan`);
    } catch (error) {
      console.error('Error creating trip:', error);
      toast.error('Failed to create trip');
    }
  };

  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const renderMessage = (message: Message) => {
    const isAssistant = message.role === 'assistant';
    
    return (
      <div key={message.id} className={`flex gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}>
        <div className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border ${
          isAssistant ? 'bg-primary text-primary-foreground' : 'bg-background'
        }`}>
          {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
        </div>
        
        <div className={`flex flex-col gap-2 ${isAssistant ? 'items-start' : 'items-end'} max-w-[80%]`}>
          <div className={`rounded-lg px-4 py-2 ${
            isAssistant ? 'bg-muted' : 'bg-primary text-primary-foreground'
          }`}>
            {isAssistant ? (
              <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown 
                  components={{
                  p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({children}) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                  ol: ({children}) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                  li: ({children}) => <li className="mb-1">{children}</li>,
                  h1: ({children}) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                  h2: ({children}) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                  h3: ({children}) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                  code: ({inline, children}) => 
                    inline ? (
                      <code className="px-1 py-0.5 rounded bg-background/50 text-xs">{children}</code>
                    ) : (
                      <pre className="p-2 rounded bg-background/50 overflow-x-auto mb-2">
                        <code className="text-xs">{children}</code>
                      </pre>
                    ),
                  strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                  em: ({children}) => <em className="italic">{children}</em>,
                }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            )}
          </div>
          
          {isAssistant && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyMessage(message.id, message.content)}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                {copiedMessageId === message.id ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                <span className="ml-1">{copiedMessageId === message.id ? 'Copied' : 'Copy'}</span>
              </Button>
              <span className="text-xs text-muted-foreground">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          )}
          
          {!isAssistant && (
            <span className="text-xs text-muted-foreground">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          )}
          
          {message.suggestions && message.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {message.suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickPrompt(suggestion)}
                  className="text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}
          
          {message.tripData && (
            <Card className="mt-2">
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-2">Ready to create your trip?</p>
                <Button 
                  size="sm" 
                  onClick={() => handleCreateTrip(message.tripData!)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Trip & Start Planning
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Trip Planning Assistant
            </CardTitle>
            <CardDescription>
              Chat with AI to plan your perfect trip itinerary
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map(renderMessage)}
                {isLoading && streamingMessage && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex-1 max-w-[80%]">
                      <div className="rounded-lg px-4 py-2 bg-muted">
                        <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown 
                            components={{
                            p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({children}) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                            ol: ({children}) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                            li: ({children}) => <li className="mb-1">{children}</li>,
                            h1: ({children}) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                            h2: ({children}) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                            h3: ({children}) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                            code: ({inline, children}) => 
                              inline ? (
                                <code className="px-1 py-0.5 rounded bg-background/50 text-xs">{children}</code>
                              ) : (
                                <pre className="p-2 rounded bg-background/50 overflow-x-auto mb-2">
                                  <code className="text-xs">{children}</code>
                                </pre>
                              ),
                            strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                            em: ({children}) => <em className="italic">{children}</em>,
                          }}
                          >
                            {streamingMessage}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {isLoading && !streamingMessage && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">AI is thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            <Separator />
            
            {/* Quick Prompts */}
            {quickPrompts.length > 0 && (
              <div className="p-4 border-b">
                <div className="flex gap-2 flex-wrap">
                  {quickPrompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickPrompt(prompt)}
                      className="text-xs"
                    >
                      <Lightbulb className="h-3 w-3 mr-1" />
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Input Area */}
            <div className="p-4">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Tell me about your dream trip..."
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
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Planning Context Sidebar */}
      <div className="w-80 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Planning Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {planningContext.destination ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2" />
                )}
                <span className="text-sm">Destination</span>
              </div>
              {planningContext.destination && (
                <div className="ml-6 text-sm text-muted-foreground">
                  {planningContext.destination}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {planningContext.startDate ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2" />
                )}
                <span className="text-sm">Travel Dates</span>
              </div>
              {planningContext.startDate && (
                <div className="ml-6 text-sm text-muted-foreground">
                  {format(planningContext.startDate, 'MMM d, yyyy')}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {planningContext.duration ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2" />
                )}
                <span className="text-sm">Duration</span>
              </div>
              {planningContext.duration && (
                <div className="ml-6 text-sm text-muted-foreground">
                  {planningContext.duration} days
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {planningContext.budget ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2" />
                )}
                <span className="text-sm">Budget</span>
              </div>
              {planningContext.budget && (
                <div className="ml-6 text-sm text-muted-foreground">
                  {planningContext.budget}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {planningContext.travelers ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2" />
                )}
                <span className="text-sm">Travelers</span>
              </div>
              {planningContext.travelers && (
                <div className="ml-6 text-sm text-muted-foreground">
                  {planningContext.travelers} {planningContext.travelers === 1 ? 'person' : 'people'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Be specific about your interests and preferences
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Mention any dietary restrictions or accessibility needs
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Include your travel style (luxury, budget, adventure)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Ask for local tips and hidden gems
              </li>
            </ul>
          </CardContent>
        </Card>
        
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            The AI assistant uses your travel preferences to provide personalized recommendations.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}