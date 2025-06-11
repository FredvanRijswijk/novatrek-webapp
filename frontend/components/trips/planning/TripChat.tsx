'use client';

import { useState, useEffect } from 'react';
import { Send, Bot, User, Sparkles, MapPin, Calendar, DollarSign, Plus, ChevronDown, ChevronUp, Clock, CheckCircle2, Square, Lightbulb, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Trip, Activity } from '@/types/travel';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { ProviderSelector } from '@/components/ai/ProviderSelector';
import { DEFAULT_PROVIDER } from '@/lib/ai/providers';
import { TripModelEnhanced as TripModel } from '@/lib/models/trip-enhanced';
import { ChatModelEnhanced as ChatModel } from '@/lib/models/chat-enhanced';
import { toast } from 'sonner';
import { useFirebase } from '@/lib/firebase/context';

// Lazy load markdown renderer to improve initial load time
const ReactMarkdown = dynamic(() => import('react-markdown'), {
  loading: () => <div className="animate-pulse h-4 bg-muted rounded" />,
});

interface TripChatProps {
  trip: Trip;
  onUpdate?: (updatedTrip: Trip) => void;
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
  activities?: any[]; // Store parsed activities from JSON
  requestedDay?: number; // Track which day was requested for activities
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

export function TripChat({ trip, onUpdate }: TripChatProps) {
  const { user } = useFirebase();
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
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>(() => {
    // Load saved preference or use default
    if (typeof window !== 'undefined') {
      return localStorage.getItem('preferred-ai-provider') || DEFAULT_PROVIDER;
    }
    return DEFAULT_PROVIDER;
  });
  
  // State for selective activity saving
  const [selectedActivities, setSelectedActivities] = useState<{[key: string]: boolean}>({});
  const [expandedMessages, setExpandedMessages] = useState<{[messageId: string]: boolean}>({});
  const [editingTimes, setEditingTimes] = useState<{[key: string]: {startTime: string; duration: number}}>({});
  const [showClearDialog, setShowClearDialog] = useState(false);
  
  // Helper function to get existing activities for a day
  const getExistingActivitiesForDay = (dayNumber: number): Activity[] => {
    const dayItinerary = trip.itinerary?.find(day => day.dayNumber === dayNumber);
    return dayItinerary?.activities || [];
  };
  
  // Helper function to check for time conflicts
  const hasTimeConflict = (newActivity: any, existingActivities: Activity[]): boolean => {
    if (!newActivity.startTime) return false;
    
    const newStart = newActivity.startTime;
    const newDuration = newActivity.duration || 60; // Default 60 minutes if not specified
    
    // Convert time string to minutes since midnight
    const timeToMinutes = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    // Calculate end time in minutes
    const newStartMinutes = timeToMinutes(newStart);
    const newEndMinutes = newStartMinutes + newDuration;
    
    return existingActivities.some(existing => {
      if (!existing.startTime || typeof existing.startTime !== 'string') return false;
      
      const existingStartMinutes = timeToMinutes(existing.startTime);
      const existingDuration = existing.duration || 60;
      const existingEndMinutes = existingStartMinutes + existingDuration;
      
      // Check for overlap
      return (newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes);
    });
  };
  
  // Helper function to check for duplicate activities
  const isDuplicateActivity = (newActivity: any, existingActivities: Activity[]): Activity | null => {
    // Normalize strings for comparison
    const normalize = (str: string): string => {
      return str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    };
    
    const newNameNormalized = normalize(newActivity.name);
    
    // Check for exact or similar names
    const duplicate = existingActivities.find(existing => {
      const existingNameNormalized = normalize(existing.name);
      
      // Exact match
      if (existingNameNormalized === newNameNormalized) return true;
      
      // Check if one contains the other (e.g., "Eiffel Tower" vs "Visit Eiffel Tower")
      if (existingNameNormalized.includes(newNameNormalized) || 
          newNameNormalized.includes(existingNameNormalized)) return true;
      
      // Check for common variations
      const commonWords = ['visit', 'tour', 'see', 'explore', 'goto', 'the', 'at', 'in', 'to', 'a', 'an'];
      const stripCommonWords = (str: string): string => {
        let result = str;
        commonWords.forEach(word => {
          result = result.replace(new RegExp(`\\b${word}\\b`, 'g'), '');
        });
        return result.replace(/\s+/g, ' ').trim();
      };
      
      const newStripped = stripCommonWords(newNameNormalized);
      const existingStripped = stripCommonWords(existingNameNormalized);
      
      // Also check Levenshtein distance for typos
      const levenshteinDistance = (s1: string, s2: string): number => {
        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;
        
        if (longer.length === 0) return shorter.length;
        
        const editDistance = Array(shorter.length + 1).fill(null).map(() => 
          Array(longer.length + 1).fill(null)
        );
        
        for (let i = 0; i <= longer.length; i++) {
          editDistance[0][i] = i;
        }
        
        for (let j = 0; j <= shorter.length; j++) {
          editDistance[j][0] = j;
        }
        
        for (let j = 1; j <= shorter.length; j++) {
          for (let i = 1; i <= longer.length; i++) {
            const indicator = shorter[j - 1] === longer[i - 1] ? 0 : 1;
            editDistance[j][i] = Math.min(
              editDistance[j][i - 1] + 1,
              editDistance[j - 1][i] + 1,
              editDistance[j - 1][i - 1] + indicator
            );
          }
        }
        
        return editDistance[shorter.length][longer.length];
      };
      
      if (newStripped === existingStripped) return true;
      
      // Check if very similar (allowing for small typos)
      const distance = levenshteinDistance(newStripped, existingStripped);
      const maxLength = Math.max(newStripped.length, existingStripped.length);
      const similarity = 1 - (distance / maxLength);
      
      return similarity > 0.8; // 80% similarity threshold
    });
    
    // Also check by location if available
    if (!duplicate && newActivity.location?.placeId) {
      const locationDuplicate = existingActivities.find(existing => 
        existing.location?.placeId === newActivity.location.placeId ||
        existing.googlePlaceId === newActivity.location.placeId
      );
      if (locationDuplicate) return locationDuplicate;
    }
    
    return duplicate || null;
  };

  // Load chat history when component mounts
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        setLoadingHistory(true);
        
        // Load existing chat messages for this trip
        const chatHistory = await ChatModel.getTripMessages(trip.id);
        
        const loadedMessages: Message[] = chatHistory.map(msg => {
          const message: Message = {
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: msg.createdAt instanceof Date ? msg.createdAt : msg.createdAt.toDate()
          };
          
          // Check if message contains JSON activities
          if (msg.role === 'assistant') {
            const jsonMatch = msg.content.match(/```json\n([\s\S]*?)(\n```|$)/);
            if (jsonMatch && jsonMatch[1]) {
              try {
                let jsonString = jsonMatch[1].trim();
                // Try to fix common JSON issues
                jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
                if (!jsonString.trim().endsWith('}')) {
                  const openBraces = (jsonString.match(/{/g) || []).length;
                  const closeBraces = (jsonString.match(/}/g) || []).length;
                  const openBrackets = (jsonString.match(/\[/g) || []).length;
                  const closeBrackets = (jsonString.match(/\]/g) || []).length;
                  jsonString += ']'.repeat(Math.max(0, openBrackets - closeBrackets));
                  jsonString += '}'.repeat(Math.max(0, openBraces - closeBraces));
                }
                const parsedData = JSON.parse(jsonString);
                if (parsedData.days && Array.isArray(parsedData.days)) {
                  message.activities = parsedData.days;
                  // Try to detect if this was for a specific day
                  if (parsedData.days.length === 1) {
                    message.requestedDay = parsedData.days[0].dayNumber;
                  }
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
          
          return message;
        });
        
        // Check if we need to add initial messages
        if (loadedMessages.length === 0) {
          const initialMessages: Message[] = [];
          
          // Check if there's an AI-generated itinerary from the planning chat
          const aiItinerary = trip.aiRecommendations?.find(rec => rec.type === 'itinerary' && !rec.applied);
          
          if (aiItinerary && aiItinerary.content?.fullItinerary) {
            // Calculate number of days in the trip
            const tripDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            
            initialMessages.push({
              id: '0',
              role: 'assistant',
              content: "I've prepared a detailed itinerary based on your requirements. Here's what I suggested:\n\n" + aiItinerary.content.fullItinerary,
              timestamp: new Date(aiItinerary.createdAt),
              suggestions: [
                "Apply Day 1 activities",
                tripDays > 1 ? "Apply Day 2 activities" : null,
                tripDays > 2 ? "Apply Day 3 activities" : null,
                "Show me alternative options"
              ].filter(Boolean) as string[]
            });
          }
          
          // Add the greeting message
          initialMessages.push({
            id: '1',
            role: 'assistant',
            content: getContextualGreeting(),
            timestamp: new Date(),
            suggestions: getContextualSuggestions(trip)
          });
          
          setMessages(initialMessages);
        } else {
          setMessages(loadedMessages);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        // Fallback to default greeting
        setMessages([{
          id: '1',
          role: 'assistant',
          content: getContextualGreeting(),
          timestamp: new Date(),
          suggestions: getContextualSuggestions(trip)
        }]);
      } finally {
        setLoadingHistory(false);
      }
    };
    
    loadChatHistory();
  }, [trip.id]);
  
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

    // Check if user wants to apply the itinerary
    const isApplyingItinerary = input.toLowerCase().includes('apply the suggested itinerary') || 
                               input.toLowerCase().includes('apply this itinerary') ||
                               input.toLowerCase().match(/apply day \d+ activities/);
    
    // Extract which day to apply (if specified)
    const dayMatch = input.toLowerCase().match(/apply day (\d+)/);
    const specificDay = dayMatch ? parseInt(dayMatch[1]) : null;
    
    // Check if user is asking for activities for a specific day
    const askingForDayMatch = input.toLowerCase().match(/(?:activities|suggestions?|things to do|plan)(?:\s+(?:for|on))?\s+day\s+(\d+)/i);
    const requestedDay = askingForDayMatch ? parseInt(askingForDayMatch[1]) : null;

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
    
    // Save user message to database
    if (user) {
      try {
        await ChatModel.createMessage({
          userId: user.uid,
          tripId: trip.id,
          role: 'user',
          content: input,
          provider: selectedProvider as any
        });
      } catch (error) {
        console.error('Error saving user message:', error);
      }
    }

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

      // Get the AI itinerary if user wants to apply it
      const aiItinerary = isApplyingItinerary && trip.aiRecommendations?.find(
        rec => rec.type === 'itinerary' && !rec.applied
      );

      const systemPrompt = isApplyingItinerary && aiItinerary
        ? `You are a helpful travel assistant. The user wants to apply a previously generated itinerary to their trip. 
           Original itinerary: ${aiItinerary.content.fullItinerary}
           
           ${specificDay 
             ? `Please extract ONLY Day ${specificDay} activities from the itinerary.` 
             : 'Please parse this itinerary and create a structured JSON response with activities.'}
           
           IMPORTANT: 
           1. Keep the response short to avoid truncation. ${specificDay ? `Only include Day ${specificDay}.` : 'Limit to a maximum of 2 days per response.'}
           2. Respond with ONLY the JSON code block. No explanatory text before or after.
           3. Start your response immediately with \`\`\`json
           
           Format:
           \`\`\`json
           {
             "days": [
               {
                 "dayNumber": ${specificDay || 1},
                 "activities": [
                   {
                     "name": "Activity Name",
                     "description": "Brief description",
                     "startTime": "09:00",
                     "duration": 120,
                     "location": { "name": "Location Name", "address": "Address" },
                     "cost": { "amount": 100, "currency": "USD", "perPerson": true },
                     "type": "sightseeing"
                   }
                 ]
               }
             ]
           }
           \`\`\`
           
           Extract activities, accommodations, and restaurants for ${specificDay ? `Day ${specificDay} only` : 'the requested days'}.`
        : `You are a helpful travel assistant for a trip to ${context.destination}. The trip is from ${context.dates} for ${context.travelers} travelers with a budget of ${context.budget}. Current planned activities include: ${context.currentActivities.join(', ') || 'none yet'}. 
           
           ${requestedDay ? `The user is asking for activities specifically for Day ${requestedDay} of their trip. 
           Please provide activities ONLY for Day ${requestedDay} in a structured JSON format.
           Start your response with a brief introduction, then provide the JSON with "dayNumber": ${requestedDay}.
           
           Format your response like:
           "Here are some great activities for Day ${requestedDay} of your trip:
           
           \`\`\`json
           {
             "days": [{
               "dayNumber": ${requestedDay},
               "activities": [...]
             }]
           }
           \`\`\`"
           ` : 'Provide specific, actionable advice and suggestions.'}`;

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: systemPrompt
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
        
        // Save assistant message to database
        if (user && streamedContent) {
          try {
            await ChatModel.createMessage({
              userId: user.uid,
              tripId: trip.id,
              role: 'assistant',
              content: streamedContent,
              provider: selectedProvider as any
            });
          } catch (error) {
            console.error('Error saving assistant message:', error);
          }
        }
        
        // Check if response contains JSON (regardless of whether user is applying itinerary)
        const jsonMatch = streamedContent.match(/```json\n([\s\S]*?)(\n```|$)/);
        
        if (jsonMatch && jsonMatch[1]) {
          try {
            let jsonString = jsonMatch[1].trim();
            
            // Try to fix common JSON issues
            // Remove trailing comma if present
            jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
            
            // Check if JSON might be incomplete (doesn't end with })
            if (!jsonString.trim().endsWith('}')) {
              // Try to close open structures
              const openBraces = (jsonString.match(/{/g) || []).length;
              const closeBraces = (jsonString.match(/}/g) || []).length;
              const openBrackets = (jsonString.match(/\[/g) || []).length;
              const closeBrackets = (jsonString.match(/\]/g) || []).length;
              
              // Add missing brackets/braces
              jsonString += ']'.repeat(Math.max(0, openBrackets - closeBrackets));
              jsonString += '}'.repeat(Math.max(0, openBraces - closeBraces));
            }
            
            const parsedData = JSON.parse(jsonString);
            
            // Store the parsed activities data in the message for later use
            setMessages(prev => 
              prev.map(msg => 
                msg.id === assistantMessage.id 
                  ? { ...msg, activities: parsedData.days, requestedDay }
                  : msg
              )
            );
            
            // If user was explicitly applying itinerary, process it immediately
            if (isApplyingItinerary && parsedData.days && Array.isArray(parsedData.days)) {
              // Hide the JSON from the user - show a processing message instead
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === assistantMessage.id 
                    ? { ...msg, content: `🔄 Processing Day ${specificDay || '1'} activities...` }
                    : msg
                )
              );
              
              // Apply activities to the trip
              const appliedDays = await applyItineraryToTrip(parsedData.days);
              
              // Update AI recommendation to mark as applied
              if (aiItinerary) {
                await TripModel.update(trip.id, {
                  aiRecommendations: trip.aiRecommendations?.map(rec => 
                    rec.id === aiItinerary.id ? { ...rec, applied: true } : rec
                  )
                });
              }
              
              // Add success message with suggestions for next days
              const tripDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
              const maxAppliedDay = Math.max(...appliedDays);
              const nextDaySuggestions: string[] = [];
              
              // Suggest applying next days if available
              if (maxAppliedDay < tripDays) {
                for (let i = 1; i <= Math.min(3, tripDays - maxAppliedDay); i++) {
                  nextDaySuggestions.push(`Apply Day ${maxAppliedDay + i} activities`);
                }
              }
              
              const successMessage: Message = {
                id: generateId(),
                role: 'assistant',
                content: `✅ Great! I've successfully added activities to your trip:\n\n${appliedDays.map(d => `Day ${d}: ${parsedData.days.find(day => day.dayNumber === d)?.activities.length || 0} activities`).join('\n')}\n\nYou can now see them in the Itinerary tab. Feel free to modify or rearrange them as needed!`,
                timestamp: new Date(),
                suggestions: [...nextDaySuggestions, 'View itinerary', 'Add more activities'].filter(Boolean)
              };
              setMessages(prev => [...prev, successMessage]);
            }
          } catch (parseError) {
            console.error('Error parsing itinerary JSON:', parseError);
            if (isApplyingItinerary) {
              // Replace the processing message with an error
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === assistantMessage.id 
                    ? { 
                        ...msg, 
                        content: '⚠️ I encountered an error while parsing the activities. This often happens when the response is too long. Let me help you apply it day by day instead.',
                        suggestions: ['Apply Day 1 activities', 'Apply Day 2 activities', 'Apply Day 3 activities', 'Show activities as a simple list']
                      }
                    : msg
                )
              );
            }
          }
        } else if (isApplyingItinerary) {
          // No JSON found but user requested to apply itinerary
          if (streamedContent.toLowerCase().includes('error') || streamedContent.toLowerCase().includes('sorry')) {
            console.log('AI unable to process itinerary application');
          } else {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === assistantMessage.id 
                  ? { 
                      ...msg, 
                      content: '⚠️ I couldn\'t find the activities to apply. Would you like me to try extracting them day by day?',
                      suggestions: ['Apply Day 1 activities', 'Apply Day 2 activities', 'Show me the original itinerary again']
                    }
                  : msg
              )
            );
          }
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
    // Special handling for applying itinerary
    if (suggestion === "Apply this itinerary to my trip") {
      setInput("Please help me apply the suggested itinerary to my trip by breaking it down into daily activities.");
      // Auto-send the message
      setTimeout(() => {
        const form = document.querySelector('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true }));
        }
      }, 100);
    } else if (suggestion.match(/Apply Day \d+ activities/)) {
      // For day-specific applications, just set the input and auto-send
      setInput(suggestion);
      setTimeout(() => {
        const form = document.querySelector('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true }));
        }
      }, 100);
    } else {
      setInput(suggestion);
    }
  };
  
  const handleClearChat = async () => {
    try {
      if (user) {
        // Delete all chat messages for this trip from the database
        const messages = await ChatModel.getTripMessages(trip.id);
        for (const msg of messages) {
          await ChatModel.delete(msg.id);
        }
      }
      
      // Clear local state
      setMessages([{
        id: Date.now().toString(),
        role: 'assistant',
        content: getContextualGreeting(),
        timestamp: new Date(),
        suggestions: getContextualSuggestions(trip)
      }]);
      setSelectedActivities({});
      setExpandedMessages({});
      setEditingTimes({});
      setShowClearDialog(false);
      
      toast.success('Chat history cleared');
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast.error('Failed to clear chat history');
    }
  };

  // Function to apply parsed itinerary to trip
  const applyItineraryToTrip = async (days: any[]): Promise<number[]> => {
    const appliedDays: number[] = [];
    
    try {
      for (const day of days) {
        const dayNumber = day.dayNumber;
        let daySuccess = true;
        
        for (const activityData of day.activities) {
          try {
            const activity: Activity = {
              id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: activityData.name,
              description: activityData.description,
              type: activityData.type || 'sightseeing',
              location: {
                name: activityData.location?.name || activityData.name,
                address: activityData.location?.address || '',
                coordinates: { lat: 0, lng: 0 } // We'll need to geocode later
              },
              startTime: activityData.startTime,
              duration: activityData.duration || 120,
              cost: activityData.cost,
              aiGenerated: true,
              userAdded: false
            };
            
            await TripModel.addActivity(trip.id, dayNumber, activity);
          } catch (activityError) {
            console.error(`Error adding activity ${activityData.name}:`, activityError);
            daySuccess = false;
          }
        }
        
        if (daySuccess && day.activities.length > 0) {
          appliedDays.push(dayNumber);
        }
      }
      
      if (appliedDays.length > 0) {
        toast.success(`Applied activities for ${appliedDays.length} days!`);
        
        // Refresh the trip data
        if (onUpdate) {
          const updatedTrip = await TripModel.getById(trip.id);
          if (updatedTrip) onUpdate(updatedTrip);
        }
      }
      
      return appliedDays;
    } catch (error) {
      console.error('Error applying itinerary:', error);
      toast.error('Failed to apply some activities. Please try again.');
      return appliedDays;
    }
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
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowClearDialog(true)}
                title="Clear chat history"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <ProviderSelector 
                value={selectedProvider}
                onChange={setSelectedProvider}
                showCost={false}
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Top padding for empty space */}
        <div className="h-20" />
        
        <div className="px-4">
          <div className="space-y-4 max-w-4xl mx-auto">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading chat history...</p>
                </div>
              </div>
            ) : messages.map((message) => (
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

                  {/* Show save activities button if message contains activities */}
                  {message.activities && message.activities.length > 0 && (
                    <div className="space-y-2">
                      <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="pb-3 pt-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">
                              {message.requestedDay 
                                ? `Activities for Day ${message.requestedDay}`
                                : 'Suggested Activities'}
                            </CardTitle>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedMessages(prev => ({
                                ...prev,
                                [message.id]: !prev[message.id]
                              }))}
                            >
                              {expandedMessages[message.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          {!expandedMessages[message.id] ? (
                            // Collapsed view - just show summary
                            <div className="space-y-1">
                              {message.activities.map((day, index) => (
                                <div key={index} className="text-xs text-muted-foreground">
                                  Day {day.dayNumber}: {day.activities?.length || 0} activities
                                </div>
                              ))}
                              <Button
                                size="sm"
                                variant="secondary"
                                className="w-full mt-2"
                                onClick={() => setExpandedMessages(prev => ({
                                  ...prev,
                                  [message.id]: true
                                }))}
                              >
                                View & Select Activities
                              </Button>
                            </div>
                          ) : (
                            // Expanded view - show all activities with checkboxes
                            <div className="space-y-4">
                              {message.activities.map((day) => {
                                const existingActivities = getExistingActivitiesForDay(day.dayNumber);
                                return (
                                <div key={day.dayNumber} className="space-y-2">
                                  {/* Day header with existing activities count */}
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">Day {day.dayNumber}</span>
                                      {existingActivities.length > 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                          {existingActivities.length} existing
                                        </Badge>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs h-auto py-1 px-2"
                                      onClick={() => {
                                        const dayPrefix = `${message.id}-${day.dayNumber}`;
                                        const allChecked = day.activities?.every((_, idx) => 
                                          selectedActivities[`${dayPrefix}-${idx}`]
                                        ) || false;
                                        
                                        const updates: {[key: string]: boolean} = {};
                                        day.activities?.forEach((_, idx) => {
                                          updates[`${dayPrefix}-${idx}`] = !allChecked;
                                        });
                                        
                                        setSelectedActivities(prev => ({ ...prev, ...updates }));
                                      }}
                                    >
                                      {day.activities?.every((_, idx) => 
                                        selectedActivities[`${message.id}-${day.dayNumber}-${idx}`]
                                      ) ? (
                                        <>
                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                          Deselect All
                                        </>
                                      ) : (
                                        <>
                                          <Square className="h-3 w-3 mr-1" />
                                          Select All
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                  
                                  {/* Visual Timeline Preview */}
                                  <div className="mb-3 p-3 bg-muted/30 rounded-lg">
                                    <p className="text-xs font-medium mb-2 text-muted-foreground">Current Schedule</p>
                                    {existingActivities.length > 0 ? (
                                      <div className="space-y-1">
                                        {existingActivities
                                          .sort((a, b) => {
                                            const timeA = a.startTime ? (typeof a.startTime === 'string' ? a.startTime : '00:00') : '23:59';
                                            const timeB = b.startTime ? (typeof b.startTime === 'string' ? b.startTime : '00:00') : '23:59';
                                            return timeA.localeCompare(timeB);
                                          })
                                          .map((activity, idx) => (
                                          <div key={idx} className="flex items-center gap-2 text-xs">
                                            <Clock className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-muted-foreground min-w-[45px]">
                                              {activity.startTime || 'All day'}
                                            </span>
                                            <span className="font-medium">{activity.name}</span>
                                            {activity.duration && (
                                              <span className="text-muted-foreground">({activity.duration}min)</span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-muted-foreground italic">No activities scheduled yet for this day</p>
                                    )}
                                  </div>
                                  
                                  <div className="space-y-2">
                                    {day.activities?.map((activity, actIdx) => {
                                      const activityKey = `${message.id}-${day.dayNumber}-${actIdx}`;
                                      const hasConflict = hasTimeConflict(activity, existingActivities);
                                      const duplicateActivity = isDuplicateActivity(activity, existingActivities);
                                      return (
                                        <div 
                                          key={actIdx} 
                                          className={cn(
                                            "flex items-start gap-3 p-2 rounded-lg transition-colors relative group",
                                            selectedActivities[activityKey] ? "bg-primary/10" : "hover:bg-muted/50",
                                            hasConflict && "border border-orange-200 dark:border-orange-800",
                                            duplicateActivity && "opacity-60"
                                          )}
                                        >
                                          <Checkbox
                                            id={activityKey}
                                            checked={selectedActivities[activityKey] || false}
                                            onCheckedChange={(checked) => 
                                              setSelectedActivities(prev => ({
                                                ...prev,
                                                [activityKey]: checked as boolean
                                              }))
                                            }
                                            className="mt-0.5"
                                          />
                                          <label 
                                            htmlFor={activityKey}
                                            className="flex-1 cursor-pointer space-y-1"
                                          >
                                            <div className="flex items-center gap-2">
                                              <span className="font-medium text-sm">{activity.name}</span>
                                              {activity.type && (
                                                <Badge variant="outline" className="text-xs">
                                                  {activity.type}
                                                </Badge>
                                              )}
                                              {hasConflict && (
                                                <Badge variant="destructive" className="text-xs">
                                                  Time conflict
                                                </Badge>
                                              )}
                                              {duplicateActivity && (
                                                <Badge variant="secondary" className="text-xs">
                                                  Already in itinerary
                                                </Badge>
                                              )}
                                            </div>
                                            {activity.description && (
                                              <p className="text-xs text-muted-foreground">{activity.description}</p>
                                            )}
                                            {duplicateActivity && (
                                              <p className="text-xs text-muted-foreground italic mt-1">
                                                Similar to: "{duplicateActivity.name}" 
                                                {duplicateActivity.startTime && ` at ${duplicateActivity.startTime}`}
                                              </p>
                                            )}
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                              {editingTimes[activityKey] ? (
                                                <div className="flex items-center gap-2">
                                                  <Input
                                                    type="time"
                                                    value={editingTimes[activityKey].startTime}
                                                    onChange={(e) => setEditingTimes(prev => ({
                                                      ...prev,
                                                      [activityKey]: {
                                                        ...prev[activityKey],
                                                        startTime: e.target.value
                                                      }
                                                    }))}
                                                    className="h-6 w-20 text-xs"
                                                    onClick={(e) => e.stopPropagation()}
                                                  />
                                                  <Input
                                                    type="number"
                                                    value={editingTimes[activityKey].duration}
                                                    onChange={(e) => setEditingTimes(prev => ({
                                                      ...prev,
                                                      [activityKey]: {
                                                        ...prev[activityKey],
                                                        duration: parseInt(e.target.value) || 60
                                                      }
                                                    }))}
                                                    className="h-6 w-16 text-xs"
                                                    placeholder="min"
                                                    min="15"
                                                    step="15"
                                                    onClick={(e) => e.stopPropagation()}
                                                  />
                                                  <span className="text-xs">min</span>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 px-1"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      // Apply the edited time
                                                      const edited = editingTimes[activityKey];
                                                      activity.startTime = edited.startTime;
                                                      activity.duration = edited.duration;
                                                      setEditingTimes(prev => {
                                                        const newTimes = { ...prev };
                                                        delete newTimes[activityKey];
                                                        return newTimes;
                                                      });
                                                    }}
                                                  >
                                                    ✓
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 px-1"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setEditingTimes(prev => {
                                                        const newTimes = { ...prev };
                                                        delete newTimes[activityKey];
                                                        return newTimes;
                                                      });
                                                    }}
                                                  >
                                                    ✗
                                                  </Button>
                                                </div>
                                              ) : (
                                                activity.startTime && (
                                                  <button
                                                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setEditingTimes(prev => ({
                                                        ...prev,
                                                        [activityKey]: {
                                                          startTime: activity.startTime as string,
                                                          duration: activity.duration || 60
                                                        }
                                                      }));
                                                    }}
                                                  >
                                                    <Clock className="h-3 w-3" />
                                                    {activity.startTime}
                                                    {activity.duration && ` (${activity.duration}min)`}
                                                    <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                  </button>
                                                )
                                              )}
                                              {activity.cost && (
                                                <span className="flex items-center gap-1">
                                                  <DollarSign className="h-3 w-3" />
                                                  {activity.cost.currency} {activity.cost.amount}
                                                  {activity.cost.perPerson && '/person'}
                                                </span>
                                              )}
                                            </div>
                                          </label>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                              })}
                              
                              <div className="flex gap-2 pt-2 border-t">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedActivities({})}
                                  disabled={Object.keys(selectedActivities).length === 0}
                                >
                                  Clear Selection
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    // Smart selection: deselect duplicates and conflicts
                                    const smartSelection: {[key: string]: boolean} = {};
                                    message.activities!.forEach(day => {
                                      const dayExistingActivities = getExistingActivitiesForDay(day.dayNumber);
                                      day.activities?.forEach((activity, actIdx) => {
                                        const key = `${message.id}-${day.dayNumber}-${actIdx}`;
                                        const isDuplicate = isDuplicateActivity(activity, dayExistingActivities);
                                        const hasConflict = hasTimeConflict(activity, dayExistingActivities);
                                        // Only select if not duplicate and no conflict
                                        if (!isDuplicate && !hasConflict) {
                                          smartSelection[key] = true;
                                        }
                                      });
                                    });
                                    setSelectedActivities(smartSelection);
                                  }}
                                  title="Automatically select only new activities without conflicts"
                                >
                                  <Lightbulb className="h-3 w-3 mr-1" />
                                  Smart Select
                                </Button>
                                <Button
                                  size="sm"
                                  className="flex-1"
                                  onClick={async () => {
                                    try {
                                      // Filter activities based on selection and apply edited times
                                      const selectedDays = message.activities!.map(day => ({
                                        ...day,
                                        activities: day.activities?.filter((_, actIdx) => 
                                          selectedActivities[`${message.id}-${day.dayNumber}-${actIdx}`]
                                        ).map((activity, actIdx) => {
                                          const activityKey = `${message.id}-${day.dayNumber}-${actIdx}`;
                                          // Apply edited times if they exist
                                          if (editingTimes[activityKey]) {
                                            return {
                                              ...activity,
                                              startTime: editingTimes[activityKey].startTime,
                                              duration: editingTimes[activityKey].duration
                                            };
                                          }
                                          return activity;
                                        }) || []
                                      })).filter(day => day.activities.length > 0);
                                      
                                      if (selectedDays.length === 0) {
                                        toast.error('Please select at least one activity');
                                        return;
                                      }
                                      
                                      const appliedDays = await applyItineraryToTrip(selectedDays);
                                      const activityCount = selectedDays.reduce((sum, day) => sum + day.activities.length, 0);
                                      
                                      toast.success(`Successfully added ${activityCount} activities!`);
                                      
                                      // Clear selections for this message
                                      setSelectedActivities(prev => {
                                        const newSelections = { ...prev };
                                        Object.keys(newSelections).forEach(key => {
                                          if (key.startsWith(message.id)) {
                                            delete newSelections[key];
                                          }
                                        });
                                        return newSelections;
                                      });
                                      
                                      // Collapse the message
                                      setExpandedMessages(prev => ({ ...prev, [message.id]: false }));
                                      
                                      // Refresh trip data
                                      if (onUpdate) {
                                        const updatedTrip = await TripModel.getById(trip.id);
                                        if (updatedTrip) onUpdate(updatedTrip);
                                      }
                                    } catch (error) {
                                      console.error('Error applying activities:', error);
                                      toast.error('Failed to add activities. Please try again.');
                                    }
                                  }}
                                  disabled={!Object.values(selectedActivities).some(Boolean)}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Save Selected Activities ({Object.values(selectedActivities).filter(Boolean).length})
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}

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
      
      {/* Clear Chat Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Chat History</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all chat messages for this trip? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearChat} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Clear History
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}