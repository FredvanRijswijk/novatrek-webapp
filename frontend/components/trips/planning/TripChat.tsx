'use client';

import { useState, useEffect } from 'react';
import { Send, Bot, User, Sparkles, MapPin, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trip } from '@/types/travel';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { ProviderSelector } from '@/components/ai/ProviderSelector';
import { DEFAULT_PROVIDER } from '@/lib/ai/providers';

// Lazy load markdown renderer to improve initial load time
const ReactMarkdown = dynamic(() => import('react-markdown'), {
  loading: () => <div className="animate-pulse h-4 bg-muted rounded" />,
});

interface TripChatProps {
  trip: Trip;
}

// Helper function to get destination names for both single and multi-destination trips
const getDestinationName = (trip: Trip): string => {
  if (trip.destinations && trip.destinations.length > 0) {
    return trip.destinations.map(d => d.destination?.name).filter(Boolean).join(', ');
  }
  return trip.destination?.name || 'your destination';
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

// Quick action suggestions based on trip context
const getContextualSuggestions = (trip: Trip): string[] => {
  const suggestions = [];
  
  // Check if trip has few activities
  const totalActivities = trip.itinerary?.reduce((sum, day) => sum + (day.activities?.length || 0), 0) || 0;
  if (totalActivities < 3) {
    suggestions.push(`What are the must-see attractions in ${getDestinationName(trip)}?`);
    suggestions.push(`Suggest activities for a ${trip.travelers.length} person trip`);
  }

  // Budget-related suggestions
  if (trip.budget) {
    suggestions.push(`Find budget-friendly restaurants in ${getDestinationName(trip)}`);
    suggestions.push('How can I save money on this trip?');
  }

  // Date-specific suggestions
  const startDate = new Date(trip.startDate);
  const month = format(startDate, 'MMMM');
  suggestions.push(`What's the weather like in ${getDestinationName(trip)} in ${month}?`);
  suggestions.push(`Special events in ${getDestinationName(trip)} during my dates`);

  return suggestions;
};

export function TripChat({ trip }: TripChatProps) {
  // Parse dates once at the component level
  const startDate = trip.startDate instanceof Date ? trip.startDate : new Date(trip.startDate);
  const endDate = trip.endDate instanceof Date ? trip.endDate : new Date(trip.endDate);
  
  // Analyze trip progress for contextual greeting
  const emptyDays = [];
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  for (let i = 1; i <= totalDays; i++) {
    const dayItinerary = trip.itinerary?.find(day => day.dayNumber === i);
    if (!dayItinerary || !dayItinerary.activities?.length) {
      emptyDays.push(i);
    }
  }
  
  const getContextualGreeting = () => {
    const totalActivities = trip.itinerary?.reduce((sum, day) => sum + (day.activities?.length || 0), 0) || 0;
    
    if (totalActivities === 0) {
      return `Hi! I see you're just starting to plan your trip to ${getDestinationName(trip)}. I'm here to help you discover the best attractions, restaurants, and experiences. Let's start building your perfect itinerary!`;
    } else if (emptyDays.length > 0) {
      return `Welcome back! I can see you've made great progress planning your trip to ${getDestinationName(trip)}. You still have ${emptyDays.length} day${emptyDays.length > 1 ? 's' : ''} to plan. Would you like suggestions for day ${emptyDays[0]}?`;
    } else {
      return `Your trip to ${getDestinationName(trip)} is looking great! All days have activities planned. I can help you optimize your itinerary, find restaurant reservations, or suggest additional activities if you'd like to pack more in.`;
    }
  };
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: getContextualGreeting(),
      timestamp: new Date(),
      suggestions: getContextualSuggestions(trip)
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>(() => {
    // Load saved preference or use default
    if (typeof window !== 'undefined') {
      return localStorage.getItem('preferred-ai-provider') || DEFAULT_PROVIDER;
    }
    return DEFAULT_PROVIDER;
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    // Find the scrollable container (messages area)
    const scrollContainer = document.querySelector('.overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Generate unique IDs using timestamp + random string
    const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare context for the AI
      const context = {
        destination: getDestinationName(trip),
        dates: `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`,
        travelers: trip.travelers.length,
        budget: trip.budget ? `${trip.budget.currency} ${trip.budget.total}` : 'Not specified',
        currentActivities: trip.itinerary?.flatMap(day => 
          day.activities?.map(a => a.name) || []
        ) || []
      };

      // Create a placeholder message for streaming
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a helpful travel assistant for a trip to ${context.destination}. The trip is from ${context.dates} for ${context.travelers} travelers with a budget of ${context.budget}. Current planned activities include: ${context.currentActivities.join(', ') || 'none yet'}. Provide specific, actionable advice and suggestions.`
            },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: input }
          ]
        })
      });

      if (!response.ok) throw new Error('Failed to get response');

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let streamedContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          streamedContent += chunk;
          
          // Update the message with streamed content
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessage.id 
                ? { ...msg, content: streamedContent }
                : msg
            )
          );
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Update the last message with error content
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content === '') {
          return prev.slice(0, -1).concat({
            ...lastMessage,
            content: 'I apologize, but I encountered an error. Please try again later.'
          });
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Fixed Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">AI Travel Assistant</h3>
                <p className="text-sm text-muted-foreground">
                  Get personalized recommendations for {getDestinationName(trip)}
                </p>
              </div>
            </div>
            <ProviderSelector 
              value={selectedProvider}
              onChange={setSelectedProvider}
              showCost={false}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Top padding for empty space */}
        <div className="h-20" />
        
        <div className="px-4">
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={cn(
                  'max-w-[80%] space-y-2',
                  message.role === 'user' ? 'items-end' : 'items-start'
                )}>
                  <div
                    className={cn(
                      'rounded-lg px-4 py-2',
                      message.role === 'user'
                        ? 'bg-blue-600 text-white dark:bg-blue-500'
                        : 'bg-muted'
                    )}
                  >
                    {message.role === 'user' ? (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                        {message.content ? (
                          <ReactMarkdown
                            components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="ml-2">{children}</li>,
                          h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          code: ({ children }) => <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs">{children}</code>,
                          pre: ({ children }) => <pre className="bg-black/10 dark:bg-white/10 p-2 rounded overflow-x-auto mb-2">{children}</pre>,
                          blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/50 pl-2 italic">{children}</blockquote>,
                          a: ({ href, children }) => (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              {children}
                            </a>
                          ),
                          hr: () => <hr className="my-2 border-t border-border" />,
                          table: ({ children }) => <table className="w-full border-collapse mb-2">{children}</table>,
                          th: ({ children }) => <th className="border border-border px-2 py-1 text-left font-semibold">{children}</th>,
                          td: ({ children }) => <td className="border border-border px-2 py-1">{children}</td>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                        ) : (
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground px-1">Suggested questions:</p>
                      <div className="flex flex-wrap gap-2">
                        {message.suggestions.map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground px-1">
                    {format(message.timestamp, 'h:mm a')}
                  </p>
                </div>

                {message.role === 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Bottom padding to ensure last message is visible above input */}
        <div className="h-32" />
      </div>

      {/* Fixed Bottom Input */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about activities, restaurants, or travel tips..."
              disabled={isLoading}
              className="flex-1 h-12"
            />
            <Button type="submit" disabled={!input.trim() || isLoading} className="h-12 px-4">
              <Send className="h-4 w-4" />
            </Button>
          </form>

          {/* Quick Context Chips */}
          <div className="flex gap-2 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {getDestinationName(trip)}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(startDate, 'MMM d')} - {format(endDate, 'MMM d')}
            </div>
            {trip.budget && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {trip.budget.currency} {trip.budget.total}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}