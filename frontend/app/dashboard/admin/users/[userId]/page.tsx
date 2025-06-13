'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, User, Mail, Calendar, Shield, Activity, MapPin, Globe, CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { useFirebase } from '@/lib/firebase/context';
import logger from '@/lib/logging/logger';
import { formatDistanceToNow, format } from 'date-fns';

type UserDetails = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
  lastActiveAt: string | null;
  disabled: boolean;
  emailVerified: boolean;
  isAdmin: boolean;
  providers: string[];
  profile?: {
    location?: string;
    bio?: string;
    preferences?: {
      travelStyle?: string;
      interests?: string[];
      dietaryRestrictions?: string[];
      accommodationPreferences?: string[];
    };
  };
  subscription?: {
    subscriptionId: string;
    status: string;
    planId: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  };
  stats?: {
    tripCount: number;
    lastTripDate: string | null;
    totalSpent: number;
    favoriteDestinations: string[];
  };
  trips?: Array<{
    id: string;
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    status: string;
    budget: number;
  }>;
};

export default function UserDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const { user } = useFirebase();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId, user]);

  const fetchUserDetails = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }

      const data = await response.json();
      setUserDetails(data);
    } catch (error) {
      logger.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-100 text-blue-800">Trial</Badge>;
      case 'canceled':
        return <Badge className="bg-red-100 text-red-800">Canceled</Badge>;
      case 'past_due':
        return <Badge className="bg-orange-100 text-orange-800">Past Due</Badge>;
      default:
        return <Badge variant="secondary">Free</Badge>;
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
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <AdminRoute requiredPermissions={['users']}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading user details...</p>
          </div>
        </div>
      </AdminRoute>
    );
  }

  if (!userDetails) {
    return (
      <AdminRoute requiredPermissions={['users']}>
        <div className="flex-1 space-y-6">
          <Button onClick={() => router.push('/dashboard/admin/users')} variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
          <div className="text-center py-12">
            <p className="text-muted-foreground">User not found</p>
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
            <Button onClick={() => router.push('/dashboard/admin/users')} variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
              <p className="text-muted-foreground">{userDetails.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {userDetails.stats?.tripCount ? (
              <Button onClick={() => router.push(`/dashboard/admin/users/${userId}/trips`)}>
                View Trips ({userDetails.stats.tripCount})
              </Button>
            ) : null}
          </div>
        </div>

        {/* User Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              {userDetails.photoURL ? (
                <img
                  src={userDetails.photoURL}
                  alt=""
                  className="h-16 w-16 rounded-full"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-8 w-8" />
                </div>
              )}
              <div className="flex-1">
                <CardTitle>{userDetails.displayName || 'No name'}</CardTitle>
                <CardDescription>{userDetails.email}</CardDescription>
                <div className="flex gap-2 mt-2">
                  {userDetails.emailVerified && (
                    <Badge variant="outline">
                      <Mail className="mr-1 h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                  {userDetails.isAdmin && (
                    <Badge className="bg-purple-100 text-purple-800">
                      <Shield className="mr-1 h-3 w-3" />
                      Admin
                    </Badge>
                  )}
                  {userDetails.disabled && (
                    <Badge variant="destructive">Disabled</Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                {getSubscriptionBadge(userDetails.subscription?.status || 'free')}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Account Age</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {userDetails.createdAt ? formatDistanceToNow(new Date(userDetails.createdAt)) : 'Unknown'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Joined {userDetails.createdAt ? format(new Date(userDetails.createdAt), 'MMM d, yyyy') : 'Unknown'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Last Active</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {userDetails.lastActiveAt ? formatDistanceToNow(new Date(userDetails.lastActiveAt), { addSuffix: true }) :
                     userDetails.lastSignInAt ? formatDistanceToNow(new Date(userDetails.lastSignInAt), { addSuffix: true }) : 'Never'}
                  </div>
                  <p className="text-xs text-muted-foreground">Last sign-in activity</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userDetails.stats?.tripCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {userDetails.stats?.lastTripDate 
                      ? `Last trip ${formatDistanceToNow(new Date(userDetails.stats.lastTripDate), { addSuffix: true })}`
                      : 'No trips yet'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${userDetails.stats?.totalSpent || 0}</div>
                  <p className="text-xs text-muted-foreground">Lifetime value</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Trips */}
            {userDetails.trips && userDetails.trips.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Trips</CardTitle>
                  <CardDescription>Last 5 trips created by this user</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userDetails.trips.slice(0, 5).map((trip) => (
                      <div key={trip.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{trip.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {trip.destination} • {format(new Date(trip.startDate), 'MMM d')} - {format(new Date(trip.endDate), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getTripStatusBadge(trip.status)}
                          <span className="text-sm font-medium">${trip.budget}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Display Name</p>
                    <p>{userDetails.displayName || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p>{userDetails.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p>{userDetails.phoneNumber || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Location</p>
                    <p>{userDetails.profile?.location || 'Not set'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Bio</p>
                    <p>{userDetails.profile?.bio || 'No bio provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {userDetails.profile?.preferences && (
              <Card>
                <CardHeader>
                  <CardTitle>Travel Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Travel Style</p>
                    <p className="capitalize">{userDetails.profile.preferences.travelStyle || 'Not specified'}</p>
                  </div>
                  {userDetails.profile.preferences.interests && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Interests</p>
                      <div className="flex flex-wrap gap-2">
                        {userDetails.profile.preferences.interests.map((interest) => (
                          <Badge key={interest} variant="secondary">{interest}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {userDetails.profile.preferences.dietaryRestrictions && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Dietary Restrictions</p>
                      <div className="flex flex-wrap gap-2">
                        {userDetails.profile.preferences.dietaryRestrictions.map((diet) => (
                          <Badge key={diet} variant="outline">{diet}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Details</CardTitle>
              </CardHeader>
              <CardContent>
                {userDetails.subscription ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                        <div className="mt-1">{getSubscriptionBadge(userDetails.subscription.status)}</div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Plan ID</p>
                        <p className="font-mono text-sm">{userDetails.subscription.planId}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Current Period End</p>
                        <p>{format(new Date(userDetails.subscription.currentPeriodEnd), 'MMM d, yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Auto-Renew</p>
                        <p>{userDetails.subscription.cancelAtPeriodEnd ? 'No' : 'Yes'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Subscription ID</p>
                      <p className="font-mono text-sm">{userDetails.subscription.subscriptionId}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No active subscription</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Account Created</p>
                    <p>{userDetails.createdAt ? format(new Date(userDetails.createdAt), 'PPpp') : 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Sign In</p>
                    <p>{userDetails.lastSignInAt ? format(new Date(userDetails.lastSignInAt), 'PPpp') : 'Never'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Active</p>
                    <p>{userDetails.lastActiveAt ? format(new Date(userDetails.lastActiveAt), 'PPpp') : 
                       userDetails.lastSignInAt ? format(new Date(userDetails.lastSignInAt), 'PPpp') : 'Never'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sign In Providers</p>
                    <div className="flex gap-2 mt-1">
                      {userDetails.providers.map((provider) => (
                        <Badge key={provider} variant="secondary">
                          {provider === 'google.com' ? <Globe className="mr-1 h-3 w-3" /> : null}
                          {provider}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {userDetails.stats?.favoriteDestinations && userDetails.stats.favoriteDestinations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Favorite Destinations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {userDetails.stats.favoriteDestinations.map((destination) => (
                      <Badge key={destination} variant="outline">
                        <MapPin className="mr-1 h-3 w-3" />
                        {destination}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminRoute>
  );
}