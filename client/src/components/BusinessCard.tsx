import { useState } from 'react';
import { Star, MapPin, Phone, Clock, ExternalLink, Heart, Share2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Business } from '@shared/schema';
import { BUSINESS_CATEGORIES, getCategoryLabel, getCategoryIcon } from '@shared/constants';
import { CategoryIcon } from '@/utils/icons';

interface BusinessCardProps {
  business: Business & {
    averageRating?: number;
    totalRatings?: number;
  };
  showActions?: boolean;
  onViewDetails?: (business: Business) => void;
}

export function BusinessCard({ business, showActions = true, onViewDetails }: BusinessCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const categoryLabel = getCategoryLabel(business.category);
  const categoryIcon = getCategoryIcon(business.category);
  const rating = business.averageRating || 0;
  const ratingCount = business.totalRatings || 0;

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/businesses/${business.id}/favorite`, {
        method: isFavorite ? 'DELETE' : 'POST',
      });
    },
    onSuccess: () => {
      setIsFavorite(!isFavorite);
      toast({
        title: isFavorite ? 'Removed from favorites' : 'Added to favorites',
        description: `${business.businessName} ${isFavorite ? 'removed from' : 'added to'} your favorites`,
      });
    },
  });

  const handleShare = async () => {
    try {
      await navigator.share({
        title: business.businessName,
        text: `Check out ${business.businessName} on Baartal!`,
        url: window.location.href,
      });
    } catch {
      // Fallback to clipboard
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied',
        description: 'Business link copied to clipboard',
      });
    }
  };

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-200 overflow-hidden"
      data-testid={`card-business-${business.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg group-hover:text-orange-600 transition-colors">
              <CategoryIcon iconName={categoryIcon} className="w-5 h-5 text-orange-600" />
              <span className="truncate">{business.businessName}</span>
              {business.isVerified && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                  ✓ Verified
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{business.address}</span>
            </CardDescription>
          </div>
          
          {showActions && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => favoriteMutation.mutate()}
                disabled={favoriteMutation.isPending}
                data-testid={`button-favorite-${business.id}`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                data-testid={`button-share-${business.id}`}
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Rating and B-Coin Rate */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {rating > 0 ? `${rating.toFixed(1)} (${ratingCount})` : 'No ratings'}
              </span>
            </div>
            
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              {business.bCoinRate}% B-Coins
            </Badge>
          </div>

          {/* Category and Contact */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className="flex items-center gap-1">
                <CategoryIcon iconName={categoryIcon} className="w-3 h-3" />
                {categoryLabel}
              </Badge>
            </div>
            
            {business.phone && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Phone className="w-3 h-3" />
                <span className="text-xs">{business.phone}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {business.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {business.description}
            </p>
          )}

          {/* Action Buttons */}
          {showActions && (
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => onViewDetails?.(business)}
                data-testid={`button-view-details-${business.id}`}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                View Details
              </Button>
              <Button 
                size="sm" 
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                data-testid={`button-visit-business-${business.id}`}
              >
                Visit & Earn
              </Button>
            </div>
          )}

          {/* Business Hours */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Open Now • Closes 9:00 PM</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}