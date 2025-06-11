'use client';

import { useState } from 'react';
import { MapPin, Clock, DollarSign, Star, Calendar, Globe, Phone, Navigation, X, Plus, ExternalLink, Award, Sparkles, MessageSquare, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Activity } from '@/types/travel';

interface ActivityDetailsModalProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  onAdd: (activity: Activity) => void;
}

export function ActivityDetailsModal({
  activity,
  isOpen,
  onClose,
  onAdd
}: ActivityDetailsModalProps) {
  const [imageError, setImageError] = useState<Record<string, boolean>>({});

  if (!activity) return null;

  const handleAdd = () => {
    console.log('ActivityDetailsModal - Adding activity:', {
      id: activity.id,
      name: activity.name,
      type: activity.type,
      isAccommodation: activity.type === 'accommodation'
    });
    onAdd(activity);
    onClose();
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      sightseeing: '🏛️',
      dining: '🍽️',
      activity: '🎯',
      shopping: '🛍️',
      entertainment: '🎭',
      cultural: '🎨',
      outdoor: '🏞️',
      wellness: '🧘',
      transport: '🚗',
      accommodation: '🏨'
    };
    return icons[type] || '📍';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{activity.name}</DialogTitle>
        </DialogHeader>
        {/* Header with image */}
        <div className="relative h-64 bg-muted">
          {activity.images && activity.images.length > 0 && !imageError[activity.images[0].url] ? (
            <img
              src={activity.images[0].url}
              alt={activity.name}
              className="w-full h-full object-cover"
              onError={() => setImageError({ ...imageError, [activity.images![0].url]: true })}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl">{getActivityIcon(activity.type)}</span>
            </div>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-4 right-4 bg-background/80 backdrop-blur"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="max-h-[calc(90vh-16rem)]">
          <div className="p-6 space-y-6">
            {/* Recommendation info */}
            {activity.isRecommended && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
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
                  <span className="text-sm font-medium">
                    Recommended by {activity.recommendedBy?.name}
                  </span>
                </div>
                
                {activity.recommendationReason && (
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      {activity.recommendationReason}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Title and basic info */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">{activity.name}</h2>
                  {activity.rating && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{activity.rating}</span>
                      </div>
                      {activity.reviewCount && (
                        <span className="text-sm text-muted-foreground">
                          ({activity.reviewCount} reviews)
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <Badge variant="outline" className="shrink-0">
                  {getActivityIcon(activity.type)} {activity.type}
                </Badge>
              </div>

              {/* Tags */}
              {activity.tags && activity.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {activity.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            {activity.description && (
              <div>
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-muted-foreground">{activity.description}</p>
              </div>
            )}

            <Separator />

            {/* Key Information */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Location */}
              {activity.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.location.address || activity.location.name}
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => {
                        const query = encodeURIComponent(activity.location!.address || activity.name);
                        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                      }}
                    >
                      <Navigation className="h-3 w-3 mr-1" />
                      Get directions
                    </Button>
                  </div>
                </div>
              )}

              {/* Duration */}
              {activity.duration && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium">Duration</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.duration < 60 
                        ? `${activity.duration} minutes`
                        : `${Math.floor(activity.duration / 60)} hours`
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* Cost */}
              {activity.cost && (
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium">Price</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.cost.currency} {activity.cost.amount}
                      {activity.cost.perPerson && ' per person'}
                    </p>
                  </div>
                </div>
              )}

              {/* Best time */}
              {activity.startTime && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium">Suggested Time</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.startTime}
                      {activity.endTime && ` - ${activity.endTime}`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Opening hours if available */}
            {activity.openingHours && (
              <div>
                <h3 className="font-semibold mb-2">Opening Hours</h3>
                <div className="space-y-1">
                  {activity.openingHours.map((hours, index) => (
                    <p key={index} className="text-sm text-muted-foreground">{hours}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Expert Tips */}
            {activity.tips && activity.tips.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Expert Tips
                </h3>
                <ul className="space-y-2">
                  {activity.tips.map((tip, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Highlights */}
            {activity.highlights && activity.highlights.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Must-Try Highlights</h3>
                <div className="flex flex-wrap gap-2">
                  {activity.highlights.map((highlight, index) => (
                    <Badge key={index} variant="secondary">
                      {highlight}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Contact info */}
            {(activity.phone || activity.website) && (
              <div>
                <h3 className="font-semibold mb-2">Contact</h3>
                <div className="space-y-2">
                  {activity.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${activity.phone}`} className="text-sm hover:underline">
                        {activity.phone}
                      </a>
                    </div>
                  )}
                  {activity.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={activity.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:underline flex items-center gap-1"
                      >
                        Visit website
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional images */}
            {activity.images && activity.images.length > 1 && (
              <div>
                <h3 className="font-semibold mb-2">Photos</h3>
                <div className="grid grid-cols-3 gap-2">
                  {activity.images.slice(1, 7).map((image, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <img
                        src={image.url}
                        alt={`${activity.name} photo ${index + 2}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer with action button */}
        <div className="border-t p-4">
          <Button onClick={handleAdd} className="w-full" size="lg">
            <Plus className="h-4 w-4 mr-2" />
            {activity.type === 'accommodation' ? 'Add Accommodation' : 'Add to Itinerary'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}