'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Clock, DollarSign, Star, Filter, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Activity, ActivityType } from '@/types/travel';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ActivitySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (activity: Activity) => void;
  destination: string;
  date: Date;
  location?: { lat: number; lng: number };
}

const activityTypes: { value: ActivityType; label: string }[] = [
  { value: 'sightseeing', label: 'Sightseeing' },
  { value: 'dining', label: 'Dining' },
  { value: 'activity', label: 'Activities' },
  { value: 'transport', label: 'Transport' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'wellness', label: 'Wellness' }
];

export function ActivitySearchModal({
  isOpen,
  onClose,
  onSelect,
  destination,
  date,
  location
}: ActivitySearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ActivityType | 'all'>('all');
  const [priceRange, setPriceRange] = useState<'all' | 'budget' | 'moderate' | 'expensive'>('all');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Calculate budget limit based on price range
  const getBudgetLimit = () => {
    switch (priceRange) {
      case 'budget':
        return 30;
      case 'moderate':
        return 100;
      case 'expensive':
        return 500;
      default:
        return undefined;
    }
  };

  // Calculate time of day based on the date
  const getTimeOfDay = () => {
    const hour = date.getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const searchActivities = async () => {
    if (!location) {
      toast.error('Unable to search without location coordinates');
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      // Get auth token from Firebase
      const auth = await import('firebase/auth');
      const currentUser = auth.getAuth().currentUser;
      const token = currentUser ? await currentUser.getIdToken() : null;

      const response = await fetch('/api/activities/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          location,
          activityType: selectedType === 'all' ? undefined : selectedType,
          searchQuery: searchQuery || undefined,
          budget: getBudgetLimit(),
          date: date.toISOString(),
          timeOfDay: getTimeOfDay()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to search activities');
      }

      const data = await response.json();
      setActivities(data.activities || []);

      if (data.activities.length === 0) {
        toast.info('No activities found. Try adjusting your filters.');
      }
    } catch (error) {
      console.error('Activity search error:', error);
      toast.error('Failed to search activities');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  // Search on filter changes (after initial search)
  useEffect(() => {
    if (hasSearched && isOpen) {
      searchActivities();
    }
  }, [selectedType, priceRange]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedType('all');
      setPriceRange('all');
      setActivities([]);
      setHasSearched(false);
    }
  }, [isOpen]);

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'sightseeing':
        return '🏛️';
      case 'dining':
        return '🍽️';
      case 'activity':
        return '🎯';
      case 'shopping':
        return '🛍️';
      case 'entertainment':
        return '🎭';
      case 'cultural':
        return '🎨';
      case 'outdoor':
        return '🏞️';
      case 'wellness':
        return '🧘';
      default:
        return '📍';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Activity</DialogTitle>
          <DialogDescription>
            Search and add activities for {destination} on {date.toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search activities, attractions, restaurants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchActivities()}
                className="pl-9"
              />
            </div>
            <Button onClick={searchActivities} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {activityTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {getActivityIcon(type.value)} {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priceRange} onValueChange={(value: any) => setPriceRange(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="budget">💵 Budget (&lt; $30)</SelectItem>
                <SelectItem value="moderate">💵💵 Moderate ($30-100)</SelectItem>
                <SelectItem value="expensive">💵💵💵 Expensive (&gt; $100)</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedType('all');
                setPriceRange('all');
                if (hasSearched) {
                  searchActivities();
                }
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        <Separator />

        {/* Results */}
        <ScrollArea className="flex-1">
          <div className="space-y-3 pr-4">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 mx-auto mb-3 animate-spin text-primary" />
                <p className="text-muted-foreground">Searching for activities in {destination}...</p>
              </div>
            ) : !hasSearched ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">Find Amazing Activities</p>
                <p className="text-sm mt-1">Search for attractions, restaurants, and experiences</p>
                {!location && (
                  <p className="text-sm mt-2 text-amber-600">
                    ⚠️ Location coordinates needed for accurate results
                  </p>
                )}
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No activities found</p>
                <p className="text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onSelect(activity)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                        <h3 className="font-semibold text-lg">{activity.name}</h3>
                        {activity.rating && (
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{activity.rating}</span>
                          </div>
                        )}
                      </div>

                      {activity.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {activity.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-3 text-sm">
                        {activity.location && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{activity.location.name}</span>
                          </div>
                        )}
                        {activity.duration && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{activity.duration} min</span>
                          </div>
                        )}
                        {activity.cost && (
                          <div className="flex items-center gap-1 font-medium">
                            <DollarSign className="h-3 w-3" />
                            <span>
                              ${activity.cost.amount}
                              {activity.cost.perPerson && ' pp'}
                            </span>
                          </div>
                        )}
                      </div>

                      {activity.tags && activity.tags.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {activity.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {activity.images && activity.images[0] && (
                      <img
                        src={typeof activity.images[0] === 'string' 
                          ? activity.images[0] 
                          : activity.images[0].url
                        }
                        alt={activity.name}
                        className="w-24 h-24 object-cover rounded-lg ml-4"
                      />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}