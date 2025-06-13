'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, MapPin, Calendar, DollarSign, Users, Filter, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { useFirebase } from '@/lib/firebase/context';
import logger from '@/lib/logging/logger';
import { format, formatDistanceToNow } from 'date-fns';

type TripData = {
  id: string;
  title: string;
  destination: string;
  destinations?: Array<{
    name: string;
    arrivalDate: string;
    departureDate: string;
  }>;
  startDate: string;
  endDate: string;
  status: 'planning' | 'booked' | 'ongoing' | 'completed' | 'cancelled';
  budget: {
    total: number;
    currency: string;
    breakdown?: {
      accommodation: number;
      transportation: number;
      food: number;
      activities: number;
      miscellaneous: number;
    };
  };
  travelers: Array<{
    name: string;
    relationship: string;
  }>;
  createdAt: string;
  updatedAt: string;
  activities?: number;
  accommodations?: number;
};

type UserInfo = {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
};

export default function UserTripsPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const { user } = useFirebase();
  const [trips, setTrips] = useState<TripData[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (userId) {
      fetchUserTrips();
    }
  }, [userId, user]);

  const fetchUserTrips = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const token = await user.getIdToken();
      
      // Fetch user info
      const userResponse = await fetch(`/api/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUserInfo({
          displayName: userData.displayName,
          email: userData.email,
          photoURL: userData.photoURL
        });
      }

      // Fetch trips
      const response = await fetch(`/api/admin/users/${userId}/trips`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user trips');
      }

      const data = await response.json();
      setTrips(data.trips);
    } catch (error) {
      logger.error('Error fetching user trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTripStatusBadge = (status: string) => {
    switch (status) {
      case 'planning':
        return <Badge variant="outline">Planning</Badge>;
      case 'booked':
        return <Badge className="bg-blue-100 text-blue-800">Booked</Badge>;
      case 'ongoing':
        return <Badge className="bg-green-100 text-green-800">Ongoing</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${days} day${days > 1 ? 's' : ''}`;
  };

  // Filter and sort trips
  const filteredTrips = trips
    .filter(trip => {
      const matchesSearch = search === '' || 
        trip.title.toLowerCase().includes(search.toLowerCase()) ||
        trip.destination.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortBy) {
        case 'title':
          aVal = a.title;
          bVal = b.title;
          break;
        case 'startDate':
          aVal = new Date(a.startDate);
          bVal = new Date(b.startDate);
          break;
        case 'budget':
          aVal = a.budget.total;
          bVal = b.budget.total;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'createdAt':
        default:
          aVal = new Date(a.createdAt);
          bVal = new Date(b.createdAt);
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  // Calculate stats
  const totalTrips = trips.length;
  const totalBudget = trips.reduce((sum, trip) => sum + trip.budget.total, 0);
  const avgBudget = totalTrips > 0 ? totalBudget / totalTrips : 0;
  const statusCounts = trips.reduce((acc, trip) => {
    acc[trip.status] = (acc[trip.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <AdminRoute requiredPermissions={['users']}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading trips...</p>
          </div>
        </div>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute requiredPermissions={['users']}>
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={() => router.push(`/dashboard/admin/users/${userId}`)} variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Trips</h1>
              <p className="text-muted-foreground">
                {userInfo?.displayName || userInfo?.email || 'Unknown User'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTrips}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalBudget.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Across all trips</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${Math.round(avgBudget).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Per trip</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Trips</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(statusCounts.planning || 0) + (statusCounts.booked || 0) + (statusCounts.ongoing || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Planning, booked, or ongoing</p>
            </CardContent>
          </Card>
        </div>

        {/* Trips Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Trips</CardTitle>
            <CardDescription>Complete list of trips created by this user</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search trips..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="startDate">Start Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'asc' | 'desc')}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trip</TableHead>
                    <TableHead>Destination(s)</TableHead>
                    <TableHead>Travel Dates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Travelers</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrips.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        {search || statusFilter !== 'all' ? 'No trips match your filters' : 'No trips found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTrips.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{trip.title}</p>
                            <p className="text-sm text-muted-foreground">ID: {trip.id}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {trip.destinations && trip.destinations.length > 0 ? (
                            <div>
                              <p className="text-sm">{trip.destinations.map(d => d.name).join(' → ')}</p>
                              <p className="text-xs text-muted-foreground">
                                {trip.destinations.length} destination{trip.destinations.length > 1 ? 's' : ''}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm">{trip.destination}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">
                              {format(new Date(trip.startDate), 'MMM d')} - {format(new Date(trip.endDate), 'MMM d, yyyy')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {calculateDuration(trip.startDate, trip.endDate)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getTripStatusBadge(trip.status)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              ${trip.budget.total.toLocaleString()} {trip.budget.currency}
                            </p>
                            {trip.budget.breakdown && (
                              <p className="text-xs text-muted-foreground">
                                A: ${trip.budget.breakdown.accommodation} • 
                                T: ${trip.budget.breakdown.transportation}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span className="text-sm">{trip.travelers.length}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDistanceToNow(new Date(trip.createdAt), { addSuffix: true })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/trips/${trip.id}/plan`)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminRoute>
  );
}