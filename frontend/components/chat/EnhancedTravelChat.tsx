'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Search, Calendar, ListTodo, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEnhancedChat } from '@/hooks/use-enhanced-chat';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface EnhancedTravelChatProps {
  tripId: string;
  currentDate?: string;
  className?: string;
}

interface ToolCallDisplay {
  id: string;
  name: string;
  status: 'running' | 'success' | 'error';
  description?: string;
}

export function EnhancedTravelChat({ 
  tripId, 
  currentDate,
  className 
}: EnhancedTravelChatProps) {
  const [toolCalls, setToolCalls] = useState<ToolCallDisplay[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    isReady
  } = useEnhancedChat({
    tripId,
    currentDate,
    model: 'gpt-4o',
    onToolCall: (toolName, args, result) => {
      // Display tool calls in the UI
      const toolDisplay: ToolCallDisplay = {
        id: `${toolName}-${Date.now()}`,
        name: toolName,
        status: result?.success ? 'success' : 'error',
        description: getToolDescription(toolName, args)
      };
      setToolCalls(prev => [...prev, toolDisplay]);
    }
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isReady) {
    return (
      <Card className={cn("p-4", className)}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </Card>
    );
  }

  return (
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
              <MessageDisplay message={message} />
              
              {/* Show tool calls after assistant messages */}
              {message.role === 'assistant' && toolCalls.length > 0 && index === messages.length - 1 && (
                <div className="ml-10 mt-2 space-y-1">
                  {toolCalls.map(tool => (
                    <ToolCallDisplay key={tool.id} tool={tool} />
                  ))}
                </div>
              )}
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
  );
}

function MessageDisplay({ message }: { message: any }) {
  const isUser = message.role === 'user';

  return (
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

function ToolCallDisplay({ tool }: { tool: ToolCallDisplay }) {
  const icons = {
    search_activities: <Search className="h-3 w-3" />,
    search_restaurants: <Search className="h-3 w-3" />,
    add_activity: <Calendar className="h-3 w-3" />,
    create_todos: <ListTodo className="h-3 w-3" />
  };

  const statusColors = {
    running: 'text-blue-600 bg-blue-50',
    success: 'text-green-600 bg-green-50',
    error: 'text-red-600 bg-red-50'
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs",
      statusColors[tool.status]
    )}>
      {icons[tool.name as keyof typeof icons] || <Sparkles className="h-3 w-3" />}
      <span className="font-medium">{tool.description || tool.name}</span>
      {tool.status === 'running' && <Loader2 className="h-3 w-3 animate-spin" />}
    </div>
  );
}

function getToolDescription(toolName: string, args: any): string {
  const descriptions: Record<string, (args: any) => string> = {
    search_activities: (args) => `Searching for ${args.query || 'activities'}...`,
    search_restaurants: (args) => `Finding ${args.cuisine?.join(', ') || 'restaurants'}...`,
    add_activity: (args) => `Adding ${args.activity?.name || 'activity'} to itinerary...`,
    create_todos: (args) => `Creating ${args.scope || 'trip'} todos...`
  };

  return descriptions[toolName]?.(args) || `Running ${toolName}...`;
}