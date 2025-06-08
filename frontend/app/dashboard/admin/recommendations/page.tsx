'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, MapPin, Star, Edit, Trash2, Eye, EyeOff, Sparkles, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';
import { useAdmin } from '@/hooks/use-admin';
import { RecommendationModel, PlaceRecommendation } from '@/lib/models/recommendations';
import { useGooglePlaces } from '@/hooks/use-google-places';

interface CreateRecommendationDialogProps {
  place: any;
  isOpen: boolean;
  onClose: () => void;
  onPublish: () => void;
}

function CreateNovaTrekRecommendationDialog({ place, isOpen, onClose, onPublish }: CreateRecommendationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [tips, setTips] = useState('');
  const [highlights, setHighlights] = useState('');
  const [featured, setFeatured] = useState(false);

  const handleCreate = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for the recommendation');
      return;
    }

    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/admin/recommendations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          googlePlaceId: place.place_id,
          name: place.name,
          location: {
            address: place.formatted_address || place.vicinity,
            coordinates: {
              lat: typeof place.geometry.location.lat === 'function' 
                ? place.geometry.location.lat() 
                : place.geometry.location.lat,
              lng: typeof place.geometry.location.lng === 'function'
                ? place.geometry.location.lng()
                : place.geometry.location.lng
            },
            city: place.address_components?.find((c: any) => 
              c.types.includes('locality')
            )?.long_name
          },
          type: place.types?.[0] || 'place',
          reason: reason.trim(),
          description: description.trim() || undefined,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          tips: tips.split('\n').map(t => t.trim()).filter(Boolean),
          highlights: highlights.split('\n').map(t => t.trim()).filter(Boolean),
          rating: place.rating,
          priceLevel: place.price_level,
          featured
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create recommendation');
      }
      
      toast.success('NovaTrek recommendation created successfully!');
      onPublish();
      onClose();
    } catch (error) {
      console.error('Error creating recommendation:', error);
      toast.error('Failed to create recommendation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Create NovaTrek Recommendation</DialogTitle>
          <DialogDescription>
            Add an official NovaTrek recommendation for {place?.name}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Why do you recommend this place? *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Award-winning restaurant with exceptional service and authentic cuisine"
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="description">Detailed Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide more context about what makes this place special..."
                className="mt-1"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="must-visit, authentic, award-winning, romantic, family-friendly"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="tips">Tips (one per line)</Label>
              <Textarea
                id="tips"
                value={tips}
                onChange={(e) => setTips(e.target.value)}
                placeholder="Make reservations 2 weeks in advance&#10;Request the chef's tasting menu&#10;Best sunset views from the terrace"
                className="mt-1"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="highlights">Must-Try Highlights (one per line)</Label>
              <Textarea
                id="highlights"
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                placeholder="Signature seafood paella&#10;House-made sangria&#10;Chocolate lava cake"
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="featured"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="featured" className="cursor-pointer">
                Feature this recommendation (shows prominently in search)
              </Label>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating...' : 'Create NovaTrek Recommendation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminRecommendationsPage() {
  const router = useRouter();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<PlaceRecommendation[]>([]);
  const [expertRecommendations, setExpertRecommendations] = useState<PlaceRecommendation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('novatrek');
  
  const { searchPlaces, loading: searchLoading } = useGooglePlaces();
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push('/dashboard');
      return;
    }
    if (isAdmin) {
      loadRecommendations();
    }
  }, [isAdmin, adminLoading, router]);

  const loadRecommendations = async () => {
    try {
      const [novatrekRecs, allRecs] = await Promise.all([
        RecommendationModel.getNovaTrekRecommendations(),
        RecommendationModel.getRecommendationsByCity('', '', 100) // Get all recommendations
      ]);

      setRecommendations(novatrekRecs);
      setExpertRecommendations(allRecs.filter(r => r.recommendedBy.type === 'expert'));
    } catch (error) {
      console.error('Error loading recommendations:', error);
      toast.error('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const results = await searchPlaces(searchQuery, {
        types: selectedType === 'all' ? undefined : [selectedType]
      });
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search places');
    }
  };

  const handleToggleRecommendationStatus = async (recommendationId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await RecommendationModel.updateRecommendationStatus(recommendationId, newStatus);
      toast.success(`Recommendation ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      loadRecommendations();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update recommendation');
    }
  };

  const handleToggleFeatured = async (recommendationId: string, currentFeatured: boolean) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/admin/recommendations/${recommendationId}/featured`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ featured: !currentFeatured })
      });

      if (!response.ok) {
        throw new Error('Failed to update featured status');
      }

      toast.success(`Recommendation ${!currentFeatured ? 'featured' : 'unfeatured'}`);
      loadRecommendations();
    } catch (error) {
      console.error('Error toggling featured:', error);
      toast.error('Failed to update featured status');
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Manage Recommendations</h1>
        <p className="text-muted-foreground">
          Create and manage NovaTrek official recommendations and view expert recommendations
        </p>
      </div>

      <Alert className="mb-6">
        <Sparkles className="h-4 w-4" />
        <AlertTitle>Admin Recommendations</AlertTitle>
        <AlertDescription>
          As an admin, you can create official NovaTrek recommendations that appear alongside expert picks.
          These recommendations are marked with the "NovaTrek Pick" badge.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search">
            <Search className="h-4 w-4 mr-2" />
            Search & Create
          </TabsTrigger>
          <TabsTrigger value="novatrek">
            <Sparkles className="h-4 w-4 mr-2" />
            NovaTrek ({recommendations.length})
          </TabsTrigger>
          <TabsTrigger value="experts">
            <Star className="h-4 w-4 mr-2" />
            Expert Reviews ({expertRecommendations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create NovaTrek Recommendations</CardTitle>
              <CardDescription>
                Search for places to add as official NovaTrek recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search restaurants, attractions, hotels..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="restaurant">Restaurants</SelectItem>
                    <SelectItem value="lodging">Hotels</SelectItem>
                    <SelectItem value="tourist_attraction">Attractions</SelectItem>
                    <SelectItem value="cafe">Cafes</SelectItem>
                    <SelectItem value="bar">Bars</SelectItem>
                    <SelectItem value="museum">Museums</SelectItem>
                    <SelectItem value="park">Parks</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleSearch} disabled={searchLoading}>
                  {searchLoading ? 'Searching...' : 'Search'}
                </Button>
              </div>

              {showSearchResults && (
                <div className="border rounded-lg p-4 space-y-3 max-h-[400px] overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No results found</p>
                  ) : (
                    searchResults.map((place) => (
                      <div key={place.place_id} className="flex items-start justify-between gap-4 p-3 hover:bg-accent rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{place.name}</h4>
                          <p className="text-sm text-muted-foreground">{place.formatted_address || place.vicinity}</p>
                          {place.rating && (
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">{place.rating}</span>
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedPlace(place);
                            setShowCreateDialog(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Create
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="novatrek" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>NovaTrek Recommendations</CardTitle>
              <CardDescription>
                Official recommendations curated by NovaTrek
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recommendations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No NovaTrek recommendations yet</p>
                  <p className="text-sm mt-1">Search and create official recommendations</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{rec.name}</h4>
                            <Badge className={rec.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                              {rec.status}
                            </Badge>
                            {rec.featured && (
                              <Badge className="bg-purple-500">
                                Featured
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{rec.location.address}</p>
                          <p className="text-sm">{rec.reason}</p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {rec.stats.viewCount} views
                            </span>
                            <span className="flex items-center gap-1">
                              <Save className="h-3 w-3" />
                              {rec.stats.saveCount} saves
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {rec.stats.usedInTrips} trips
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleFeatured(rec.id, rec.featured)}
                          >
                            <Star className={`h-4 w-4 ${rec.featured ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleRecommendationStatus(rec.id, rec.status)}
                          >
                            {rec.status === 'active' ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/dashboard/admin/recommendations/${rec.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="experts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expert Recommendations</CardTitle>
              <CardDescription>
                View all recommendations from approved experts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {expertRecommendations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No expert recommendations yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expertRecommendations.map((rec) => (
                    <div key={rec.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{rec.name}</h4>
                            <Badge variant="outline">
                              By {rec.recommendedBy.name}
                            </Badge>
                            <Badge className={rec.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                              {rec.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{rec.location.address}</p>
                          <p className="text-sm">{rec.reason}</p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {rec.stats.viewCount} views
                            </span>
                            <span className="flex items-center gap-1">
                              <Save className="h-3 w-3" />
                              {rec.stats.saveCount} saves
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {rec.stats.usedInTrips} trips
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleRecommendationStatus(rec.id, rec.status)}
                          >
                            {rec.status === 'active' ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedPlace && (
        <CreateNovaTrekRecommendationDialog
          place={selectedPlace}
          isOpen={showCreateDialog}
          onClose={() => {
            setShowCreateDialog(false);
            setSelectedPlace(null);
          }}
          onPublish={loadRecommendations}
        />
      )}
    </div>
  );
}