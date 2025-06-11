'use client';

import { useEffect, useState } from 'react';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Filter, 
  Search,
  Plane,
  Car,
  Hotel,
  Utensils,
  ShoppingBag,
  Camera,
  Users,
  Ticket,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/lib/firebase/context';
import { TripModelEnhanced as TripModel } from '@/lib/models/trip-enhanced';
import { Trip, Activity } from '@/types/travel';
import { format, parseISO, isAfter, isBefore, isToday, isTomorrow, addDays } from 'date-fns';

interface ActivityWithTrip extends Activity {
  tripId: string;
  tripTitle: string;
  dayNumber: number;
  date: Date | string;
  destination: string;
}

export default function ActivitiesPage() {
  const router = useRouter();
  const { user } = useFirebase();
  const [activities, setActivities] = useState<ActivityWithTrip[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityWithTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterTime, setFilterTime] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');

  useEffect(() => {
    if (!user) return;

    const loadActivities = async () => {
      try {
        const userTrips = await TripModel.getUserTrips(user.uid);
        const allActivities: ActivityWithTrip[] = [];

        // Extract all activities from all trips
        userTrips.forEach(trip => {
          if (trip.itinerary && trip.itinerary.length > 0) {
            trip.itinerary.forEach(day => {
              if (day.activities && day.activities.length > 0) {
                day.activities.forEach(activity => {
                  // Determine destination name
                  let destinationName = trip.destination?.name || 'Unknown';
                  if (trip.destinations && trip.destinations.length > 0) {
                    const dest = trip.destinations.find(d => d.destination?.id === day.destinationId);
                    if (dest) {
                      destinationName = dest.destination.name;
                    }
                  }

                  allActivities.push({
                    ...activity,
                    tripId: trip.id,
                    tripTitle: trip.title || `Trip to ${destinationName}`,
                    dayNumber: day.dayNumber,
                    date: day.date || '',
                    destination: destinationName
                  });
                });
              }
            });
          }
        });

        setActivities(allActivities);
        setFilteredActivities(allActivities);
      } catch (error) {
        console.error('Failed to load activities:', error);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, [user]);

  useEffect(() => {
    filterAndSortActivities();
  }, [searchQuery, filterType, filterTime, sortBy, activities]);

  const filterAndSortActivities = () => {
    let filtered = [...activities];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(activity =>
        activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.tripTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (activity.location?.name && activity.location.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(activity => activity.type === filterType);
    }

    // Time filter
    if (filterTime !== 'all') {
      const today = new Date();
      filtered = filtered.filter(activity => {
        const activityDate = typeof activity.date === 'string' ? parseISO(activity.date) : activity.date;
        
        switch (filterTime) {
          case 'today':
            return isToday(activityDate);
          case 'tomorrow':
            return isTomorrow(activityDate);
          case 'week':
            return isAfter(activityDate, today) && isBefore(activityDate, addDays(today, 7));
          case 'upcoming':
            return isAfter(activityDate, today);
          case 'past':
            return isBefore(activityDate, today);
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          const dateA = typeof a.date === 'string' ? parseISO(a.date) : a.date;
          const dateB = typeof b.date === 'string' ? parseISO(b.date) : b.date;
          return dateA.getTime() - dateB.getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'destination':
          return a.destination.localeCompare(b.destination);
        case 'time':
          return (a.startTime || '').localeCompare(b.startTime || '');
        default:
          return 0;
      }
    });

    setFilteredActivities(filtered);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'flight':
        return <Plane className="h-4 w-4" />;
      case 'transport':
        return <Car className="h-4 w-4" />;
      case 'accommodation':
        return <Hotel className="h-4 w-4" />;
      case 'restaurant':
        return <Utensils className="h-4 w-4" />;
      case 'shopping':
        return <ShoppingBag className="h-4 w-4" />;
      case 'sightseeing':
        return <Camera className="h-4 w-4" />;
      case 'tour':
        return <Users className="h-4 w-4" />;
      case 'attraction':
        return <Ticket className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getActivityTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      flight: 'bg-blue-100 text-blue-800',
      transport: 'bg-purple-100 text-purple-800',
      accommodation: 'bg-green-100 text-green-800',
      restaurant: 'bg-orange-100 text-orange-800',
      shopping: 'bg-pink-100 text-pink-800',
      sightseeing: 'bg-indigo-100 text-indigo-800',
      tour: 'bg-teal-100 text-teal-800',
      attraction: 'bg-yellow-100 text-yellow-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatActivityDate = (date: Date | string) => {
    const activityDate = typeof date === 'string' ? parseISO(date) : date;
    
    if (isToday(activityDate)) {
      return 'Today';
    } else if (isTomorrow(activityDate)) {
      return 'Tomorrow';
    } else {
      return format(activityDate, 'EEE, MMM d');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">All Activities</h1>
          <p className="text-muted-foreground mt-1">
            Loading your activities...
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-5/6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">All Activities</h1>
        <p className="text-muted-foreground mt-1">
          View and manage all your planned activities across all trips
        </p>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search activities, destinations, or trips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full md:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Activity type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="flight">Flights</SelectItem>
            <SelectItem value="transport">Transport</SelectItem>
            <SelectItem value="accommodation">Accommodation</SelectItem>
            <SelectItem value="restaurant">Restaurants</SelectItem>
            <SelectItem value="shopping">Shopping</SelectItem>
            <SelectItem value="sightseeing">Sightseeing</SelectItem>
            <SelectItem value="tour">Tours</SelectItem>
            <SelectItem value="attraction">Attractions</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterTime} onValueChange={setFilterTime}>
          <SelectTrigger className="w-full md:w-[150px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Time filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="tomorrow">Tomorrow</SelectItem>
            <SelectItem value="week">Next 7 Days</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="past">Past</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="destination">Destination</SelectItem>
            <SelectItem value="time">Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activities.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activities.filter(a => {
                const date = typeof a.date === 'string' ? parseISO(a.date) : a.date;
                return isAfter(date, new Date());
              }).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Destinations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(activities.map(a => a.destination)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Next Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {(() => {
                const upcoming = activities
                  .filter(a => {
                    const date = typeof a.date === 'string' ? parseISO(a.date) : a.date;
                    return isAfter(date, new Date());
                  })
                  .sort((a, b) => {
                    const dateA = typeof a.date === 'string' ? parseISO(a.date) : a.date;
                    const dateB = typeof b.date === 'string' ? parseISO(b.date) : b.date;
                    return dateA.getTime() - dateB.getTime();
                  });
                
                if (upcoming.length > 0) {
                  const next = upcoming[0];
                  const date = typeof next.date === 'string' ? parseISO(next.date) : next.date;
                  return formatActivityDate(date);
                }
                return 'None';
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activities List */}
      {filteredActivities.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium mb-2">No activities found</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery || filterType !== 'all' || filterTime !== 'all'
                ? 'Try adjusting your filters'
                : 'Start planning your trips to add activities'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredActivities.map((activity, index) => (
            <Card
              key={`${activity.tripId}-${activity.id || index}`}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/dashboard/trips/${activity.tripId}/plan`)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base flex items-center gap-2">
                      {getActivityIcon(activity.type)}
                      <span className="truncate">{activity.name}</span>
                    </CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {activity.tripTitle}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getActivityTypeBadgeColor(activity.type)}`}
                  >
                    {activity.type}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">
                    {formatActivityDate(activity.date)}
                  </span>
                  {activity.startTime && (
                    <>
                      <Clock className="h-3 w-3 text-muted-foreground ml-2" />
                      <span>{activity.startTime}</span>
                      {activity.duration && (
                        <span className="text-muted-foreground">
                          ({activity.duration})
                        </span>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground truncate">
                    {activity.destination} - Day {activity.dayNumber}
                  </span>
                </div>

                {activity.location && (
                  <div className="text-sm text-muted-foreground">
                    <p className="truncate">
                      {activity.location.name || activity.location.address}
                    </p>
                  </div>
                )}

                {activity.price && (
                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground">Cost</span>
                    <span className="font-medium">
                      {activity.price.currency} {activity.price.amount}
                      {activity.price.perPerson && ' per person'}
                    </span>
                  </div>
                )}

                {activity.rating && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{activity.rating}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}