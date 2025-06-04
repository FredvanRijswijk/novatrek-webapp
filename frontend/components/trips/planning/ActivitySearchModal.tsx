'use client';

import { useState } from 'react';
import { Search, MapPin, Clock, DollarSign, Star, Filter, X } from 'lucide-react';
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

interface ActivitySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (activity: Activity) => void;
  destination: string;
  date: Date;
}

// Mock activities data - will be replaced with API calls
const mockActivities: Activity[] = [
  {
    id: 'act_1',
    name: 'Eiffel Tower Visit',
    type: 'sightseeing',
    description: 'Iconic iron lattice tower with stunning city views',
    location: {
      name: 'Eiffel Tower',
      address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris',
      coordinates: { lat: 48.8584, lng: 2.2945 }
    },
    duration: 120,
    cost: { amount: 25, currency: 'EUR', perPerson: true },
    rating: 4.8,
    images: ['https://images.unsplash.com/photo-1511739001486-6bfe10ce785f'],
    tags: ['landmark', 'views', 'photography']
  },
  {
    id: 'act_2',
    name: 'Seine River Cruise',
    type: 'activity',
    description: 'Romantic cruise along the Seine with commentary',
    location: {
      name: 'Port de la Bourdonnais',
      address: 'Port de la Bourdonnais, 75007 Paris',
      coordinates: { lat: 48.8608, lng: 2.2926 }
    },
    duration: 60,
    cost: { amount: 15, currency: 'EUR', perPerson: true },
    rating: 4.5,
    tags: ['cruise', 'romantic', 'sightseeing']
  },
  {
    id: 'act_3',
    name: 'Le Marais Food Tour',
    type: 'dining',
    description: 'Guided food tour through the historic Marais district',
    location: {
      name: 'Le Marais',
      address: 'Le Marais, Paris',
      coordinates: { lat: 48.8566, lng: 2.3522 }
    },
    duration: 180,
    cost: { amount: 85, currency: 'EUR', perPerson: true },
    rating: 4.9,
    tags: ['food', 'walking', 'cultural']
  }
];

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
  date
}: ActivitySearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ActivityType | 'all'>('all');
  const [priceRange, setPriceRange] = useState<'all' | 'budget' | 'moderate' | 'expensive'>('all');
  const [filteredActivities, setFilteredActivities] = useState(mockActivities);

  const handleSearch = () => {
    let filtered = mockActivities;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(activity =>
        activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(activity => activity.type === selectedType);
    }

    // Filter by price range
    if (priceRange !== 'all' && filtered.length > 0) {
      filtered = filtered.filter(activity => {
        if (!activity.cost) return true;
        const price = activity.cost.amount;
        switch (priceRange) {
          case 'budget':
            return price <= 30;
          case 'moderate':
            return price > 30 && price <= 100;
          case 'expensive':
            return price > 100;
          default:
            return true;
        }
      });
    }

    setFilteredActivities(filtered);
  };

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
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch}>Search</Button>
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
                <SelectItem value="budget">💵 Budget (&lt; €30)</SelectItem>
                <SelectItem value="moderate">💵💵 Moderate (€30-100)</SelectItem>
                <SelectItem value="expensive">💵💵💵 Expensive (&gt; €100)</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedType('all');
                setPriceRange('all');
                setFilteredActivities(mockActivities);
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
            {filteredActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No activities found</p>
                <p className="text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredActivities.map((activity) => (
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
                              {activity.cost.currency} {activity.cost.amount}
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
                        src={activity.images[0]}
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