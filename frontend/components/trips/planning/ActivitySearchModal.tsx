'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Clock, DollarSign, Star, Filter, X, Loader2, CloudRain, Sun, Cloud, Umbrella, Trees, Home, Baby, Users, ChevronRight, Award, Sparkles, Hotel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import { ActivityDetailsModal } from './ActivityDetailsModal';

interface ActivitySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (activity: Activity) => void;
  destination: string;
  date: Date;
  location?: { lat: number; lng: number };
  tripId?: string;
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
  const [locationPreference, setLocationPreference] = useState<'all' | 'indoor' | 'outdoor'>('all');
  const [familyPreference, setFamilyPreference] = useState<'all' | 'family' | 'adults'>('all');
  const [weather, setWeather] = useState<any>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [hasRecommendations, setHasRecommendations] = useState(false);

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

      // Auto-detect hotel searches
      let activityType = selectedType === 'all' ? undefined : selectedType;
      if (!activityType && searchQuery) {
        const hotelKeywords = ['hotel', 'motel', 'inn', 'resort', 'hostel', 'accommodation', 'lodging', 'stay'];
        const lowerQuery = searchQuery.toLowerCase();
        if (hotelKeywords.some(keyword => lowerQuery.includes(keyword))) {
          activityType = 'accommodation';
        }
      }

      const response = await fetch('/api/activities/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          location,
          activityType,
          searchQuery: searchQuery || undefined,
          budget: getBudgetLimit(),
          date: date.toISOString(),
          timeOfDay: getTimeOfDay(),
          preferIndoorActivities: locationPreference === 'indoor',
          preferOutdoorActivities: locationPreference === 'outdoor',
          familyFriendly: familyPreference === 'family' ? true : familyPreference === 'adults' ? false : null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to search activities');
      }

      const data = await response.json();
      setActivities(data.activities || []);
      setHasRecommendations(data.hasRecommendations || false);
      
      // Set weather data if available
      if (data.weather) {
        setWeather(data.weather);
        
        // Auto-set preference based on weather if not already set
        if (locationPreference === 'all') {
          if (data.weather.recommendation?.preferIndoor && 
              data.weather.recommendation.severity === 'high') {
            setLocationPreference('indoor');
            toast.info(`${data.weather.recommendation.reason} - showing indoor activities first`);
          } else if (!data.weather.recommendation?.preferIndoor && 
                     data.weather.condition === 'clear') {
            // Suggest outdoor activities on nice days
            toast.info('Perfect weather for outdoor activities!');
          }
        }
      }

      if (data.activities.length === 0) {
        toast.info('No activities found. Try adjusting your filters.');
      } else if (data.hasRecommendations) {
        toast.success('Showing expert and NovaTrek recommendations first!');
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
  }, [selectedType, priceRange, locationPreference, familyPreference]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedType('all');
      setPriceRange('all');
      setActivities([]);
      setHasSearched(false);
      setLocationPreference('all');
      setFamilyPreference('all');
      setWeather(null);
      setSelectedActivity(null);
    }
  }, [isOpen]);

  const getActivityIcon = (type: ActivityType | string) => {
    switch (type) {
      case 'sightseeing':
        return '🏛️';
      case 'dining':
        return '🍽️';
      case 'activity':
        return '🎯';
      case 'accommodation':
        return '🏨';
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
      case 'transport':
        return '🚗';
      default:
        return '📍';
    }
  };

  const getWeatherIcon = () => {
    if (!weather) return null;
    
    switch (weather.condition) {
      case 'rain':
      case 'drizzle':
        return <CloudRain className="h-4 w-4" />;
      case 'thunderstorm':
        return <Umbrella className="h-4 w-4" />;
      case 'clear':
        return <Sun className="h-4 w-4" />;
      default:
        return <Cloud className="h-4 w-4" />;
    }
  };

  const getLocationIcon = (pref: string) => {
    switch (pref) {
      case 'indoor':
        return <Home className="h-4 w-4" />;
      case 'outdoor':
        return <Trees className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getWeatherBasedSuggestion = () => {
    if (!weather) return null;
    
    if (weather.recommendation?.preferIndoor && weather.recommendation.severity === 'high') {
      return 'indoor';
    } else if (weather.condition === 'clear' || weather.condition === 'clouds') {
      return 'outdoor';
    }
    return null;
  };

  const handleActivitySelect = (activity: Activity) => {
    setSelectedActivity(activity);
  };

  const handleAddActivity = (activity: Activity) => {
    onSelect(activity);
    setSelectedActivity(null);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-hidden flex flex-col p-0">
          <SheetHeader className="px-6 pt-6 pb-4">
            <SheetTitle>Add Activity</SheetTitle>
            <SheetDescription>
              Search and add activities for {destination} on {date.toLocaleDateString()}
            </SheetDescription>
          </SheetHeader>

          {/* Fixed search and filters section */}
          <div className="px-6 space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search hotels, activities, attractions, restaurants..."
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
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </div>
              <div className="flex flex-wrap gap-2">
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
                    setLocationPreference('all');
                    setFamilyPreference('all');
                    if (hasSearched) {
                      searchActivities();
                    }
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Family Preference */}
            <div className="bg-muted/50 p-3 rounded-lg">
              <Label className="text-sm font-medium mb-2 block">Suitable For</Label>
              <RadioGroup value={familyPreference} onValueChange={(value: any) => setFamilyPreference(value)} className="grid grid-cols-3 gap-2">
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="all" id="all-ages" />
                  <Label htmlFor="all-ages" className="font-normal cursor-pointer text-sm">
                    All Ages
                  </Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="family" id="family" />
                  <Label htmlFor="family" className="font-normal cursor-pointer flex items-center gap-1 text-sm">
                    <Baby className="h-3 w-3" />
                    Family
                  </Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="adults" id="adults" />
                  <Label htmlFor="adults" className="font-normal cursor-pointer flex items-center gap-1 text-sm">
                    <Users className="h-3 w-3" />
                    Adults Only
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Weather Alert and Location Preference */}
            {weather && (
              <div className="space-y-3">
                <Alert className={cn(
                  "py-2",
                  weather.recommendation?.preferIndoor ? "border-amber-200 bg-amber-50 dark:bg-amber-950/20" : "border-blue-200 bg-blue-50 dark:bg-blue-950/20"
                )}>
                  <div className="flex items-center gap-2">
                    {getWeatherIcon()}
                    <AlertDescription className="flex-1">
                      <span className="font-medium">{weather.temperature}°C</span> - {weather.description}
                      {weather.recommendation?.reason && (
                        <span className="ml-2 text-muted-foreground">
                          ({weather.recommendation.reason})
                        </span>
                      )}
                    </AlertDescription>
                  </div>
                </Alert>

                <div className="bg-muted/50 p-3 rounded-lg">
                  <Label className="text-sm font-medium mb-2 block">Activity Location Preference</Label>
                  <RadioGroup value={locationPreference} onValueChange={(value: any) => setLocationPreference(value)} className="grid grid-cols-3 gap-2">
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="all" id="all" />
                      <Label htmlFor="all" className="font-normal cursor-pointer text-sm">
                        All Activities
                      </Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="indoor" id="indoor" />
                      <Label htmlFor="indoor" className="font-normal cursor-pointer flex items-center gap-1 text-sm">
                        <Home className="h-3 w-3" />
                        Indoor
                        {getWeatherBasedSuggestion() === 'indoor' && (
                          <Badge variant="secondary" className="text-xs ml-1">Rec</Badge>
                        )}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="outdoor" id="outdoor" />
                      <Label htmlFor="outdoor" className="font-normal cursor-pointer flex items-center gap-1 text-sm">
                        <Trees className="h-3 w-3" />
                        Outdoor
                        {getWeatherBasedSuggestion() === 'outdoor' && (
                          <Badge variant="secondary" className="text-xs ml-1">Rec</Badge>
                        )}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          {/* Results */}
          <ScrollArea className="flex-1">
            <div className="px-6 space-y-3 pb-6">
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
                    className={cn(
                      "border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer",
                      activity.isRecommended && "border-primary/50 bg-primary/5"
                    )}
                    onClick={() => handleActivitySelect(activity)}
                  >
                  {/* Recommendation banner */}
                  {activity.isRecommended && (
                    <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                      {activity.recommendedBy?.type === 'expert' ? (
                        <Badge className="bg-purple-500 hover:bg-purple-600">
                          <Award className="h-3 w-3 mr-1" />
                          Expert Pick
                        </Badge>
                      ) : activity.recommendedBy?.type === 'novatrek' ? (
                        <Badge className="bg-blue-500 hover:bg-blue-600">
                          <Sparkles className="h-3 w-3 mr-1" />
                          NovaTrek Pick
                        </Badge>
                      ) : null}
                      <span className="text-xs text-muted-foreground">
                        {activity.recommendedBy?.name}
                      </span>
                    </div>
                  )}
                  
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
                        {/* Indoor/Outdoor indicator */}
                        {activity.tags?.some(tag => tag.includes('indoor')) && (
                          <Badge variant="outline" className="text-xs">
                            <Home className="h-3 w-3 mr-1" />
                            Indoor
                          </Badge>
                        )}
                        {(activity.type === 'outdoor' || activity.tags?.some(tag => 
                          ['park', 'beach', 'hiking', 'trail', 'garden'].some(outdoor => tag.includes(outdoor))
                        )) && (
                          <Badge variant="outline" className="text-xs">
                            <Trees className="h-3 w-3 mr-1" />
                            Outdoor
                          </Badge>
                        )}
                        {/* Family friendly indicator */}
                        {activity.tags?.some(tag => 
                          ['family', 'kids', 'children', 'playground', 'family-friendly'].some(family => 
                            tag.toLowerCase().includes(family)
                          )
                        ) && (
                          <Badge variant="outline" className="text-xs">
                            <Baby className="h-3 w-3 mr-1" />
                            Family
                          </Badge>
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
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <DollarSign className="h-3 w-3" />
                            <span>
                              {activity.cost.currency} {activity.cost.amount}
                              {activity.cost.perPerson && ' per person'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        </SheetContent>
      </Sheet>
      
      {/* Activity Details Modal */}
      <ActivityDetailsModal
        activity={selectedActivity}
        isOpen={!!selectedActivity}
        onClose={() => setSelectedActivity(null)}
        onAdd={handleAddActivity}
      />
    </>
  );
}