'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, MapPin, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trip } from '@/types/travel';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TripChatProps {
  trip: Trip;
}

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
    suggestions.push(`What are the must-see attractions in ${trip.destination.name}?`);
    suggestions.push(`Suggest activities for a ${trip.travelers.length} person trip`);
  }

  // Budget-related suggestions
  if (trip.budget) {
    suggestions.push(`Find budget-friendly restaurants in ${trip.destination.name}`);
    suggestions.push('How can I save money on this trip?');
  }

  // Date-specific suggestions
  const startDate = new Date(trip.startDate);
  const month = format(startDate, 'MMMM');
  suggestions.push(`What's the weather like in ${trip.destination.name} in ${month}?`);
  suggestions.push(`Special events in ${trip.destination.name} during my dates`);

  return suggestions;
};

export function TripChat({ trip }: TripChatProps) {
  // Parse dates once at the component level
  const startDate = trip.startDate instanceof Date ? trip.startDate : new Date(trip.startDate);
  const endDate = trip.endDate instanceof Date ? trip.endDate : new Date(trip.endDate);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi! I'm your AI travel assistant for your trip to ${trip.destination.name}. I can help you plan activities, find restaurants, suggest itineraries, and answer any questions about your destination. What would you like to know?`,
      timestamp: new Date(),
      suggestions: getContextualSuggestions(trip)
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

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
      // Prepare context for the AI
      const context = {
        destination: trip.destination.name,
        dates: `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`,
        travelers: trip.travelers.length,
        budget: trip.budget ? `${trip.budget.currency} ${trip.budget.total}` : 'Not specified',
        currentActivities: trip.itinerary?.flatMap(day => 
          day.activities?.map(a => a.name) || []
        ) || []
      };

      const response = await fetch('/api/chat', {
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

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again later.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>AI Travel Assistant</CardTitle>
              <CardDescription>
                Get personalized recommendations for {trip.destination.name}
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary">
            <Bot className="h-3 w-3 mr-1" />
            Online
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
          <div className="space-y-4 py-4">
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
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {message.role === 'user' ? (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        className="text-sm prose prose-sm dark:prose-invert max-w-none"
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

            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
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
              className="flex-1"
            />
            <Button type="submit" disabled={!input.trim() || isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>

          {/* Quick Context Chips */}
          <div className="flex gap-2 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {trip.destination.name}
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
      </CardContent>
    </Card>
  );
}