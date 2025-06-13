'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  MessageSquare, 
  Bug, 
  Sparkles, 
  Palette, 
  Zap,
  MoreHorizontal,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { FeedbackEntry, FeedbackStatus, FeedbackPriority } from '@/lib/models/feedback-model';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function AdminFeedbackPage() {
  const { user } = useFirebase();
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackEntry | null>(null);
  const [updateForm, setUpdateForm] = useState({
    status: '' as FeedbackStatus,
    priority: '' as FeedbackPriority,
    adminNotes: '',
  });

  useEffect(() => {
    fetchFeedback();
    fetchStats();
  }, [statusFilter, categoryFilter]);

  const fetchFeedback = async () => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);

      const response = await fetch(`/api/admin/feedback?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }

      const data = await response.json();
      setFeedback(data);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/feedback/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleUpdate = async () => {
    if (!user || !selectedFeedback) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/feedback/${selectedFeedback.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateForm),
      });

      if (!response.ok) {
        throw new Error('Failed to update feedback');
      }

      await fetchFeedback();
      await fetchStats();
      setSelectedFeedback(null);
    } catch (error) {
      console.error('Error updating feedback:', error);
      alert('Failed to update feedback');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bug': return Bug;
      case 'feature_request': return Sparkles;
      case 'ui_ux': return Palette;
      case 'performance': return Zap;
      default: return MessageSquare;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return AlertCircle;
      case 'in_review': return Clock;
      case 'planned': return TrendingUp;
      case 'in_progress': return Clock;
      case 'completed': return CheckCircle;
      case 'wont_fix': return XCircle;
      default: return MessageSquare;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in_review': return 'bg-yellow-100 text-yellow-800';
      case 'planned': return 'bg-purple-100 text-purple-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'wont_fix': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Feedback Management</h1>
          <p className="text-muted-foreground">Review and manage user feedback</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Feedback</CardDescription>
              <CardTitle className="text-2xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>New</CardDescription>
              <CardTitle className="text-2xl">{stats.byStatus.new}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>In Progress</CardDescription>
              <CardTitle className="text-2xl">{stats.byStatus.in_progress}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg Rating</CardDescription>
              <CardTitle className="text-2xl">
                {stats.avgRating ? `${stats.avgRating.toFixed(1)} ⭐` : 'N/A'}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="wont_fix">Won't Fix</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="bug">Bug Report</SelectItem>
                <SelectItem value="feature_request">Feature Request</SelectItem>
                <SelectItem value="improvement">Improvement</SelectItem>
                <SelectItem value="ui_ux">UI/UX</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedback.map((entry) => {
                const Icon = getCategoryIcon(entry.category);
                const StatusIcon = getStatusIcon(entry.status);
                
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.userEmail}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {entry.category.replace('_', ' ')}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{entry.title}</TableCell>
                    <TableCell>
                      {entry.rating ? (
                        <div className="flex items-center gap-1">
                          {entry.rating}
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("gap-1", getStatusColor(entry.status))}>
                        <StatusIcon className="h-3 w-3" />
                        {entry.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {entry.priority ? (
                        <Badge className={getPriorityColor(entry.priority)}>
                          {entry.priority}
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(
                        entry.createdAt instanceof Date ? entry.createdAt : new Date(entry.createdAt),
                        'MMM d, yyyy'
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedFeedback(entry);
                          setUpdateForm({
                            status: entry.status,
                            priority: entry.priority || 'medium',
                            adminNotes: entry.adminNotes || '',
                          });
                        }}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Update Dialog */}
      <Dialog open={!!selectedFeedback} onOpenChange={(open) => !open && setSelectedFeedback(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Feedback</DialogTitle>
            <DialogDescription>
              Review and update feedback status
            </DialogDescription>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <div className="p-3 bg-muted rounded-md">{selectedFeedback.title}</div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <div className="p-3 bg-muted rounded-md whitespace-pre-wrap">
                  {selectedFeedback.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={updateForm.status}
                    onValueChange={(value) => setUpdateForm({ ...updateForm, status: value as FeedbackStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="wont_fix">Won't Fix</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={updateForm.priority}
                    onValueChange={(value) => setUpdateForm({ ...updateForm, priority: value as FeedbackPriority })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Admin Notes</Label>
                <Textarea
                  value={updateForm.adminNotes}
                  onChange={(e) => setUpdateForm({ ...updateForm, adminNotes: e.target.value })}
                  placeholder="Internal notes about this feedback..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedFeedback(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate}>
                  Update Feedback
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}