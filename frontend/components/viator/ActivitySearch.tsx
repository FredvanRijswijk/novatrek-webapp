'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Loader2, 
  MapPin, 
  Clock, 
  DollarSign, 
  Star,
  ExternalLink,
  Filter,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { ProductSummary, ProductSearchParams } from '@/lib/viator/types/product';
import { viatorProductToActivity } from '@/lib/viator/utils/mappers';
import Image from 'next/image';

interface ViatorActivitySearchProps {
  open: boolean;
  onClose: () => void;
  destination: string;
  destId?: string;
  startDate?: Date;
  endDate?: Date;
  onSelectActivity: (activity: any) => void;
  dayId: string;
  tripId: string;
}

export function ViatorActivitySearch({
  open,
  onClose,
  destination,
  destId,
  startDate,
  endDate,
  onSelectActivity,
  dayId,
  tripId,
}: ViatorActivitySearchProps) {
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<ProductSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  
  // Filters
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [durationRange, setDurationRange] = useState([0, 480]); // 0-8 hours in minutes
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<ProductSearchParams['sorting']>('TOP_SELLERS');
  
  const pageSize = 20;
  
  // Search when dialog opens or filters change
  useEffect(() => {
    if (open) {
      performSearch();
    }
  }, [open, sortBy, currentPage]);
  
  const performSearch = async () => {
    setSearching(true);
    
    try {
      const params: ProductSearchParams = {
        destination: searchQuery || destination,
        destId,
        startDate: startDate?.toISOString().split('T')[0],
        endDate: endDate?.toISOString().split('T')[0],
        sorting: sortBy,
        filtering: {
          priceRange: {
            min: priceRange[0],
            max: priceRange[1],
            currencyCode: 'USD',
          },
          duration: {
            min: durationRange[0],
            max: durationRange[1],
          },
          rating: minRating > 0 ? minRating : undefined,
        },
        pagination: {
          offset: currentPage * pageSize,
          limit: pageSize,
        },
      };
      
      const response = await fetch('/api/viator/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      setResults(data.products || []);
      setTotalCount(data.totalCount || 0);
      
    } catch (error) {
      console.error('Error searching Viator activities:', error);
      toast.error('Failed to search activities. Please try again.');
    } finally {
      setSearching(false);
    }
  };
  
  const handleSelectActivity = (product: ProductSummary) => {
    // Convert to NovaTrek activity format
    const activity = viatorProductToActivity(product, dayId, tripId);
    onSelectActivity(activity);
    onClose();
    
    toast.success(`Added "${product.productName}" to your itinerary`, {
      description: 'Click "Book on Viator" when ready to purchase',
    });
  };
  
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };
  
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Find Activities in {destination}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search and filters */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search activities in ${destination}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
            <Button onClick={performSearch} disabled={searching}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </div>
          
          {/* Filters panel */}
          {showFilters && (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price Range (USD)</Label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    min={0}
                    max={1000}
                    step={10}
                    className="pt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}+</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Slider
                    value={durationRange}
                    onValueChange={setDurationRange}
                    min={0}
                    max={720}
                    step={30}
                    className="pt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatDuration(durationRange[0])}</span>
                    <span>{formatDuration(durationRange[1])}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Minimum Rating</Label>
                  <Select value={minRating.toString()} onValueChange={(v) => setMinRating(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Any rating</SelectItem>
                      <SelectItem value="3">3+ stars</SelectItem>
                      <SelectItem value="4">4+ stars</SelectItem>
                      <SelectItem value="4.5">4.5+ stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TOP_SELLERS">Top Sellers</SelectItem>
                      <SelectItem value="REVIEW_RATING">Highest Rated</SelectItem>
                      <SelectItem value="PRICE_LOW_TO_HIGH">Price: Low to High</SelectItem>
                      <SelectItem value="PRICE_HIGH_TO_LOW">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => {
                  setPriceRange([0, 500]);
                  setDurationRange([0, 480]);
                  setMinRating(0);
                  setSortBy('TOP_SELLERS');
                  performSearch();
                }}
              >
                Reset Filters
              </Button>
            </div>
          )}
          
          {/* Results */}
          <ScrollArea className="h-[400px]">
            {searching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
            
            {!searching && results.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No activities found. Try adjusting your search or filters.
              </div>
            )}
            
            {!searching && results.length > 0 && (
              <div className="space-y-4">
                {results.map((product) => (
                  <div
                    key={product.productCode}
                    className="border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleSelectActivity(product)}
                  >
                    <div className="flex gap-4">
                      {/* Image */}
                      {product.images[0] && (
                        <div className="relative w-32 h-24 rounded-md overflow-hidden flex-shrink-0">
                          <Image
                            src={product.images[0].variants[0].url}
                            alt={product.productName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      
                      {/* Content */}
                      <div className="flex-1 space-y-2">
                        <h4 className="font-medium line-clamp-2">{product.productName}</h4>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(
                              product.duration.fixedDuration 
                                ? product.duration.fixedDuration.hours * 60 + product.duration.fixedDuration.minutes
                                : 120
                            )}
                          </span>
                          {product.reviews.totalReviewCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {product.reviews.combinedAverageRating.toFixed(1)}
                              <span className="text-xs">({product.reviews.totalReviewCount})</span>
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold">
                              {formatPrice(
                                product.pricing.summary.fromPrice,
                                product.pricing.summary.currencyCode
                              )}
                            </span>
                            <span className="text-sm text-muted-foreground">per person</span>
                          </div>
                          
                          <div className="flex gap-1">
                            {product.flags.includes('FREE_CANCELLATION') && (
                              <Badge variant="secondary" className="text-xs">
                                Free Cancellation
                              </Badge>
                            )}
                            {product.flags.includes('BEST_SELLER') && (
                              <Badge variant="default" className="text-xs">
                                Best Seller
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Pagination */}
                {totalCount > pageSize && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage + 1} of {Math.ceil(totalCount / pageSize)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={(currentPage + 1) * pageSize >= totalCount}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
        
        <div className="text-xs text-muted-foreground text-center pt-2">
          <span>Powered by </span>
          <a 
            href="https://www.viator.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-foreground inline-flex items-center gap-1"
          >
            Viator
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}