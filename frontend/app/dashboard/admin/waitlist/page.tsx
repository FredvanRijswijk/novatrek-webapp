'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirebase } from '@/lib/firebase/context';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Users, 
  Mail, 
  Check, 
  Clock, 
  UserCheck,
  Search,
  Download,
  Send
} from 'lucide-react';
import { format } from 'date-fns';
import { WaitlistEntry } from '@/lib/models/waitlist-model';

export default function AdminWaitlistPage() {
  const { user } = useFirebase();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    invited: 0,
    joined: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null);
  const [inviteCount, setInviteCount] = useState('10');

  useEffect(() => {
    fetchWaitlistData();
  }, [statusFilter]);

  const fetchWaitlistData = async () => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      const [entriesRes, statsRes] = await Promise.all([
        fetch(`/api/admin/waitlist?status=${statusFilter}`, { headers }),
        fetch('/api/admin/waitlist/stats', { headers }),
      ]);

      if (!entriesRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch waitlist data');
      }

      const entriesData = await entriesRes.json();
      const statsData = await statsRes.json();

      setEntries(entriesData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching waitlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/waitlist/${id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to approve user');
      }

      await fetchWaitlistData();
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Failed to approve user');
    }
  };

  const handleInvite = async (id: string) => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/waitlist/${id}/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to invite user');
      }

      await fetchWaitlistData();
      alert('Invitation sent successfully!');
    } catch (error) {
      console.error('Error inviting user:', error);
      alert('Failed to send invitation');
    }
  };

  const handleBulkInvite = async () => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/waitlist/bulk-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ count: parseInt(inviteCount) }),
      });

      if (!response.ok) {
        throw new Error('Failed to send bulk invitations');
      }

      const result = await response.json();
      alert(`Sent ${result.invited} invitations!`);
      await fetchWaitlistData();
    } catch (error) {
      console.error('Error sending bulk invites:', error);
      alert('Failed to send bulk invitations');
    }
  };

  const exportCSV = async () => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/waitlist/export', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `waitlist-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export waitlist');
    }
  };

  const filteredEntries = entries.filter(entry =>
    entry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: WaitlistEntry['status']) => {
    const variants: Record<WaitlistEntry['status'], { variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: any }> = {
      pending: { variant: 'secondary', icon: Clock },
      approved: { variant: 'outline', icon: Check },
      invited: { variant: 'default', icon: Mail },
      joined: { variant: 'default', icon: UserCheck },
    };

    const { variant, icon: Icon } = variants[status];
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading waitlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Waitlist Management</h1>
          <p className="text-muted-foreground">Manage early access signups</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setSelectedEntry(null)}>
            <Send className="h-4 w-4 mr-2" />
            Bulk Invite
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Signups</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-2xl">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="text-2xl">{stats.approved}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Invited</CardDescription>
            <CardTitle className="text-2xl">{stats.invited}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Joined</CardDescription>
            <CardTitle className="text-2xl">{stats.joined}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Waitlist Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="invited">Invited</SelectItem>
                <SelectItem value="joined">Joined</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Position</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Interests</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>#{entry.position}</TableCell>
                  <TableCell className="font-medium">{entry.email}</TableCell>
                  <TableCell>{entry.name || '-'}</TableCell>
                  <TableCell>{getStatusBadge(entry.status)}</TableCell>
                  <TableCell>
                    {entry.interests?.length ? (
                      <div className="flex gap-1 flex-wrap">
                        {entry.interests.map(interest => (
                          <Badge key={interest} variant="outline" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(
                      entry.createdAt && typeof entry.createdAt === 'object' && 'toDate' in entry.createdAt
                        ? entry.createdAt.toDate()
                        : new Date(entry.createdAt as any),
                      'MMM d, yyyy'
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {entry.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(entry.id)}
                        >
                          Approve
                        </Button>
                      )}
                      {entry.status === 'approved' && (
                        <Button
                          size="sm"
                          onClick={() => handleInvite(entry.id)}
                        >
                          Send Invite
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bulk Invite Dialog */}
      <Dialog open={selectedEntry === null} onOpenChange={(open) => !open && setSelectedEntry(undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Bulk Invitations</DialogTitle>
            <DialogDescription>
              Automatically invite the next approved users in line
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="count">Number of invites to send</Label>
              <Input
                id="count"
                type="number"
                value={inviteCount}
                onChange={(e) => setInviteCount(e.target.value)}
                min="1"
                max="100"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Will invite the next {inviteCount} approved users
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedEntry(undefined)}>
                Cancel
              </Button>
              <Button onClick={handleBulkInvite}>
                Send {inviteCount} Invites
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}