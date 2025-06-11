'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Utensils, 
  Navigation, 
  Camera, 
  Cloud,
  Loader2
} from 'lucide-react';
import { Activity } from '@/types/travel';
import { TravelPreferences } from '@/types/preferences';
import { toast } from 'sonner';

interface QuickActionConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  handler: (activity?: Activity, preferences?: TravelPreferences) => Promise<string>;
}

interface QuickActionsProps {
  currentActivity?: Activity;
  onActionResult: (result: string) => void;
  userPreferences?: TravelPreferences;
}

export function QuickActions({ 
  currentActivity, 
  onActionResult,
  userPreferences 
}: QuickActionsProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleAction = async (action: QuickActionConfig) => {
    setLoadingAction(action.id);
    try {
      const prompt = await action.handler(currentActivity, userPreferences);
      onActionResult(prompt);
    } catch (error) {
      console.error(`Error executing ${action.id}:`, error);
      toast.error('Failed to execute action. Please try again.');
    } finally {
      setLoadingAction(null);
    }
  };

  const quickActions: QuickActionConfig[] = [
    {
      id: 'food',
      label: 'Find Nearby Food',
      icon: <Utensils className="h-4 w-4" />,
      handler: async (activity, preferences) => {
        if (activity?.location?.coordinates) {
          try {
            const response = await fetch('/api/places/quick-search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'nearby-food',
                location: activity.location.coordinates,
                preferences: {
                  dietaryRestrictions: preferences?.dietaryRestrictions || [],
                  priceLevel: preferences?.budgetLevel === 'budget' ? 2 : undefined
                }
              })
            });
            
            if (!response.ok) throw new Error('Search failed');
            
            const data = await response.json();
            if (data.formatted) {
              return `Here are some restaurants near ${activity.location.name}:\n\n${data.formatted}`;
            }
          } catch (error) {
            console.error('Restaurant search error:', error);
          }
        }
        
        // Fallback to text-based request
        const dietaryInfo = preferences?.dietaryRestrictions?.length 
          ? ` that accommodate ${preferences.dietaryRestrictions.join(', ')} diets`
          : '';
        return activity?.location?.name 
          ? `Find restaurants near ${activity.location.name}${dietaryInfo}`
          : 'Find good restaurants nearby for today\'s activities';
      }
    },
    {
      id: 'directions',
      label: 'Get Directions',
      icon: <Navigation className="h-4 w-4" />,
      handler: async (activity) => {
        if (activity?.location?.name) {
          return `How do I get to ${activity.location.name}? What are the best transport options?`;
        }
        return 'Help me plan transportation between my activities today';
      }
    },
    {
      id: 'photos',
      label: 'Find Photo Spots',
      icon: <Camera className="h-4 w-4" />,
      handler: async (activity) => {
        if (activity?.location?.coordinates) {
          try {
            const response = await fetch('/api/places/quick-search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'photo-spots',
                location: activity.location.coordinates
              })
            });
            
            if (!response.ok) throw new Error('Search failed');
            
            const data = await response.json();
            if (data.formatted) {
              return `Here are the best photo spots near ${activity.location.name}:\n\n${data.formatted}`;
            }
          } catch (error) {
            console.error('Photo spots search error:', error);
          }
        }
        
        // Fallback to text-based request
        return activity?.location?.name
          ? `What are the best photo spots and viewpoints near ${activity.location.name}?`
          : 'Find the most photogenic spots to visit today';
      }
    },
    {
      id: 'weather',
      label: 'Weather Check',
      icon: <Cloud className="h-4 w-4" />,
      handler: async (activity) => {
        if (activity?.location?.name) {
          return `What's the weather forecast for ${activity.location.name} today? Should I bring an umbrella?`;
        }
        return 'What\'s the weather forecast for my trip? Any weather concerns I should know about?';
      }
    }
  ];

  return (
    <div className="border-b bg-background/50 backdrop-blur-sm">
      <div className="flex flex-wrap gap-2 p-3">
        <span className="text-xs font-medium text-muted-foreground self-center mr-2">
          Quick Actions:
        </span>
        {quickActions.map((action) => (
          <Button
            key={action.id}
            variant="outline"
            size="sm"
            onClick={() => handleAction(action)}
            disabled={loadingAction !== null}
            className="flex items-center gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary transition-colors text-xs h-8"
          >
            {loadingAction === action.id ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              action.icon
            )}
            <span className="hidden sm:inline">{action.label}</span>
            <span className="sm:hidden">{action.label.split(' ').pop()}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}