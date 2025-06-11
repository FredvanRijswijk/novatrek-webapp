'use client';

import { useState, useEffect } from 'react';
import { 
  Bookmark, 
  BookmarkCheck, 
  Search, 
  Filter, 
  X, 
  Pin, 
  Lightbulb,
  MapPin,
  Calendar,
  Tag,
  Clock,
  Trash2,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ChatMemory, ChatMemoryModel } from '@/lib/models/chat-memory';
import { format } from 'date-fns';
import { useFirebase } from '@/lib/firebase/context';
import { doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface ChatMemoryPanelProps {
  tripId: string;
  currentDay?: number;
  onSelectMemory?: (memory: ChatMemory) => void;
}

const memoryTypeConfig = {
  recommendation: { icon: Lightbulb, color: 'text-yellow-500', label: 'Recommendation' },
  tip: { icon: Lightbulb, color: 'text-blue-500', label: 'Tip' },
  booking: { icon: Calendar, color: 'text-green-500', label: 'Booking' },
  note: { icon: Bookmark, color: 'text-purple-500', label: 'Note' },
  place: { icon: MapPin, color: 'text-red-500', label: 'Place' }
};

export function ChatMemoryPanel({ tripId, currentDay, onSelectMemory }: ChatMemoryPanelProps) {
  const { user } = useFirebase();
  const [memories, setMemories] = useState<ChatMemory[]>([]);
  const [filteredMemories, setFilteredMemories] = useState<ChatMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ChatMemory['type'] | 'all'>('all');
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newMemory, setNewMemory] = useState({
    type: 'note' as ChatMemory['type'],
    title: '',
    content: '',
    day: currentDay || 1,
    tags: [] as string[]
  });

  // Load memories
  useEffect(() => {
    loadMemories();
  }, [tripId]);

  // Filter memories
  useEffect(() => {
    let filtered = [...memories];

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(m => m.type === selectedType);
    }

    // Day filter
    if (selectedDay !== 'all') {
      filtered = filtered.filter(m => m.metadata.day === selectedDay);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.title.toLowerCase().includes(query) ||
        m.content.toLowerCase().includes(query) ||
        m.metadata.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredMemories(filtered);
  }, [memories, selectedType, selectedDay, searchQuery]);

  const loadMemories = async () => {
    try {
      setLoading(true);
      const tripMemories = await ChatMemoryModel.getTripMemories(tripId);
      setMemories(tripMemories);
    } catch (error) {
      console.error('Error loading memories:', error);
      toast.error('Failed to load memories');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePin = async (memoryId: string) => {
    try {
      const newPinStatus = await ChatMemoryModel.togglePin(memoryId);
      setMemories(prev => prev.map(m => 
        m.id === memoryId ? { ...m, isPinned: newPinStatus } : m
      ));
      toast.success(newPinStatus ? 'Memory pinned' : 'Memory unpinned');
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error('Failed to update memory');
    }
  };

  const handleDelete = async (memoryId: string) => {
    try {
      await ChatMemoryModel.delete(memoryId);
      setMemories(prev => prev.filter(m => m.id !== memoryId));
      toast.success('Memory deleted');
    } catch (error) {
      console.error('Error deleting memory:', error);
      toast.error('Failed to delete memory');
    }
  };

  const handleAddMemory = async () => {
    if (!user || !newMemory.title || !newMemory.content) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const tripRef = doc(db, 'trips', tripId);

      const memory = await ChatMemoryModel.create({
        tripId,
        tripRef,
        userRef,
        type: newMemory.type,
        title: newMemory.title,
        content: newMemory.content,
        metadata: {
          day: newMemory.day,
          tags: newMemory.tags,
          category: newMemory.type
        },
        isPinned: false
      });

      setMemories(prev => [memory, ...prev]);
      setShowAddDialog(false);
      setNewMemory({
        type: 'note',
        title: '',
        content: '',
        day: currentDay || 1,
        tags: []
      });
      toast.success('Memory added');
    } catch (error) {
      console.error('Error adding memory:', error);
      toast.error('Failed to add memory');
    }
  };

  const MemoryCard = ({ memory }: { memory: ChatMemory }) => {
    const config = memoryTypeConfig[memory.type];
    const Icon = config.icon;

    return (
      <Card 
        className="cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => onSelectMemory?.(memory)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${config.color}`} />
              <CardTitle className="text-sm font-medium line-clamp-1">
                {memory.title}
              </CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTogglePin(memory.id);
                }}
              >
                <Pin className={`h-3 w-3 ${memory.isPinned ? 'fill-current' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(memory.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="text-xs line-clamp-2 mb-2">
            {memory.content}
          </CardDescription>
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {memory.metadata.day && (
                <Badge variant="outline" className="text-xs">
                  Day {memory.metadata.day}
                </Badge>
              )}
              {memory.metadata.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {format(memory.createdAt, 'MMM d')}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Saved Memories</h3>
          <Button
            size="sm"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select value={selectedType} onValueChange={(v) => setSelectedType(v as any)}>
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {Object.entries(memoryTypeConfig).map(([type, config]) => (
                <SelectItem key={type} value={type}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(selectedDay)} onValueChange={(v) => setSelectedDay(v === 'all' ? 'all' : Number(v))}>
            <SelectTrigger className="h-8 w-[120px]">
              <SelectValue placeholder="All days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All days</SelectItem>
              {Array.from({ length: 7 }, (_, i) => i + 1).map(day => (
                <SelectItem key={day} value={String(day)}>
                  Day {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Memories List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading memories...
            </div>
          ) : filteredMemories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery || selectedType !== 'all' || selectedDay !== 'all' 
                ? 'No memories match your filters'
                : 'No memories saved yet'}
            </div>
          ) : (
            <>
              {/* Pinned memories */}
              {filteredMemories.filter(m => m.isPinned).length > 0 && (
                <>
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    Pinned
                  </div>
                  {filteredMemories.filter(m => m.isPinned).map(memory => (
                    <MemoryCard key={memory.id} memory={memory} />
                  ))}
                  <Separator className="my-3" />
                </>
              )}

              {/* Regular memories */}
              {filteredMemories.filter(m => !m.isPinned).map(memory => (
                <MemoryCard key={memory.id} memory={memory} />
              ))}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Add Memory Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Memory</DialogTitle>
            <DialogDescription>
              Save important information from your trip planning
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select 
                value={newMemory.type} 
                onValueChange={(v) => setNewMemory(prev => ({ ...prev, type: v as ChatMemory['type'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(memoryTypeConfig).map(([type, config]) => (
                    <SelectItem key={type} value={type}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={newMemory.title}
                onChange={(e) => setNewMemory(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Best sunset spot in Paris"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={newMemory.content}
                onChange={(e) => setNewMemory(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Add details..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Day</label>
              <Select 
                value={String(newMemory.day)} 
                onValueChange={(v) => setNewMemory(prev => ({ ...prev, day: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 7 }, (_, i) => i + 1).map(day => (
                    <SelectItem key={day} value={String(day)}>
                      Day {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddMemory}
              disabled={!newMemory.title || !newMemory.content}
            >
              Save Memory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}