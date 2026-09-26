import { Star, StarHalf } from "lucide-react";

export function StarRating({ rating, count }: { rating: number; count?: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      <div className="flex items-center text-primary">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} className="size-4 fill-current" />
        ))}
        {hasHalfStar && <StarHalf className="size-4 fill-current" />}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} className="size-4 text-muted-foreground" />
        ))}
      </div>
      <span className="text-sm font-medium text-primary">{rating.toFixed(1)}</span>
      {count !== undefined && (
        <span className="text-sm text-muted-foreground">({count})</span>
      )}
    </div>
  );
}
