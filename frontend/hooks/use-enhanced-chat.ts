import { useChat } from 'ai/react';
import { Message } from 'ai';
import { useFirebase } from '@/lib/firebase/context';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

interface UseEnhancedChatOptions {
  tripId: string;
  currentDate?: string;
  model?: 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo';
  onToolCall?: (toolName: string, args: any, result: any) => void;
}

export function useEnhancedChat({
  tripId,
  currentDate,
  model = 'gpt-4o',
  onToolCall
}: UseEnhancedChatOptions) {
  const { user } = useFirebase();
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
          toast.error('Authentication failed. Please try refreshing the page.');
        }
      }
    };
    getToken();
  }, [user]);

  const chat = useChat({
    api: '/api/chat/enhanced-v2',
    headers: authToken ? {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    } : {},
    body: {
      tripId,
      currentDate,
      model
    },
    experimental_toolCallStreaming: true, // Enable tool call streaming
    onError: (error) => {
      console.error('Chat error:', error);
      toast.error('Failed to send message. Please try again.');
    },
    onResponse: (response) => {
      if (!response.ok) {
        console.error('Chat response error:', response.statusText);
      }
    },
    onFinish: (message) => {
      // Log tool calls if any
      const toolCalls = extractToolCalls(message);
      if (toolCalls.length > 0 && onToolCall) {
        toolCalls.forEach(call => {
          onToolCall(call.name, call.args, call.result);
        });
      }
    }
  });

  return {
    ...chat,
    isAuthenticated: !!user,
    isReady: !!user && !!tripId && !!authToken
  };
}

// Helper to extract tool calls from message
function extractToolCalls(message: Message): Array<{
  name: string;
  args: any;
  result: any;
}> {
  // This would parse the message for tool call information
  // Implementation depends on how the AI returns tool call data
  return [];
}