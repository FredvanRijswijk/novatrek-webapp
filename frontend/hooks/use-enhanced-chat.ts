import { useChat } from 'ai/react';
import { Message } from 'ai';
import { useAuth } from '@/lib/firebase/context';
import { toast } from 'sonner';

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
  const { user } = useAuth();

  const chat = useChat({
    api: '/api/chat/enhanced',
    headers: async () => {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Get the ID token
      const token = await user.getIdToken();
      
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    },
    body: {
      tripId,
      currentDate,
      model
    },
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
    isReady: !!user && !!tripId
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