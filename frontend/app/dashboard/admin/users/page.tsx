'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Shield, Mail, Calendar, Activity, Search, Filter, ChevronLeft, ChevronRight, CheckCircle, XCircle, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { useFirebase } from '@/lib/firebase/context';
import logger from '@/lib/logging/logger';
import { formatDistanceToNow } from 'date-fns';

type UserData = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
  lastActiveAt: string | null;
  disabled: boolean;
  emailVerified: boolean;
  isAdmin: boolean;
  profile?: {
    location?: string;
    bio?: string;
    preferences?: any;
  };
  subscription?: {
    status: string;
    plan: string;
  };
  stats?: {
    tripCount: number;
    lastTripDate: string | null;
  };
};

type UserStats = {
  total: number;
  active: number;
  verified: number;
  subscribed: number;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { user } = useFirebase();
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<UserStats>({ total: 0, active: 0, verified: 0, subscribed: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [orderBy, setOrderBy] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    disabled: false,
    emailVerified: false,
    location: '',
    bio: ''
  });

  useEffect(() => {
    fetchUsers();
  }, [page, orderBy, order, search]);

  const fetchUsers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const token = await user.getIdToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        orderBy,
        order,
        ...(search && { search })
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
      setStats(data.stats);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      logger.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: UserData) => {
    setSelectedUser(user);
    setEditForm({
      disabled: user.disabled,
      emailVerified: user.emailVerified,
      location: user.profile?.location || '',
      bio: user.profile?.bio || ''
    });
    setEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!user || !selectedUser) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uid: selectedUser.uid,
          updates: {
            disabled: editForm.disabled,
            emailVerified: editForm.emailVerified,
            profile: {
              location: editForm.location,
              bio: editForm.bio
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      setEditDialogOpen(false);
      fetchUsers();
    } catch (error) {
      logger.error('Error updating user:', error);
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
      default:
        return <Badge variant="secondary">Free</Badge>;
    }
  };

  return (
    <AdminRoute requiredPermissions={['users']}>
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">Manage and monitor all platform users</p>
          </div>
          <Button onClick={() => router.push('/dashboard/admin/marketplace')}>
            Back to Dashboard
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All registered users</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Not disabled accounts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.verified.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Email verified accounts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscribed Users</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.subscribed.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Active subscriptions</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Search and manage all registered users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email or name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={orderBy} onValueChange={setOrderBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Registration Date</SelectItem>
                  <SelectItem value="lastActiveAt">Last Active</SelectItem>
                  <SelectItem value="lastSignInAt">Last Sign In</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="displayName">Name</SelectItem>
                  <SelectItem value="tripCount">Trip Count</SelectItem>
                </SelectContent>
              </Select>
              <Select value={order} onValueChange={(v) => setOrder(v as 'asc' | 'desc')}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Trips</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.uid}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {user.photoURL ? (
                              <img
                                src={user.photoURL}
                                alt=""
                                className="h-8 w-8 rounded-full"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-4 w-4" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">
                                {user.displayName || 'No name'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {user.emailVerified ? (
                              <Badge variant="outline" className="w-fit">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="w-fit text-orange-600">
                                <XCircle className="mr-1 h-3 w-3" />
                                Unverified
                              </Badge>
                            )}
                            {user.isAdmin && (
                              <Badge className="w-fit bg-purple-100 text-purple-800">
                                Admin
                              </Badge>
                            )}
                            {user.disabled && (
                              <Badge variant="destructive" className="w-fit">
                                Disabled
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getSubscriptionBadge(user.subscription?.status || 'free')}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{user.stats?.tripCount || 0} trips</div>
                            {user.stats?.lastTripDate && (
                              <div className="text-muted-foreground">
                                Last: {formatDistanceToNow(new Date(user.stats.lastTripDate), { addSuffix: true })}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {user.createdAt ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }) : 'Unknown'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {user.lastActiveAt ? formatDistanceToNow(new Date(user.lastActiveAt), { addSuffix: true }) : 
                             user.lastSignInAt ? formatDistanceToNow(new Date(user.lastSignInAt), { addSuffix: true }) : 'Never'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEdit(user)}>
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/admin/users/${user.uid}`)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => router.push(`/dashboard/admin/users/${user.uid}/trips`)}
                                disabled={!user.stats?.tripCount}
                              >
                                View Trips
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and account status
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={selectedUser.email || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input value={selectedUser.displayName || ''} disabled />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="disabled"
                    checked={editForm.disabled}
                    onCheckedChange={(checked) => setEditForm({ ...editForm, disabled: checked })}
                  />
                  <Label htmlFor="disabled">Account Disabled</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="emailVerified"
                    checked={editForm.emailVerified}
                    onCheckedChange={(checked) => setEditForm({ ...editForm, emailVerified: checked })}
                  />
                  <Label htmlFor="emailVerified">Email Verified</Label>
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    placeholder="User location"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="User bio"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateUser}>
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminRoute>
  );
}