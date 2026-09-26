"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitReview } from "@/app/actions/reviews";

export function ReviewForm({
  productId,
  nextPath,
}: {
  productId: string;
  nextPath: string;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await submitReview({ productId, rating, title, comment });
      if (result.requiresAuth) {
        router.push(`/sign-in?next=${encodeURIComponent(nextPath)}`);
        return;
      }
      if (!result.ok) {
        setError(result.message ?? "Could not submit your review.");
        return;
      }
      toast.success("Review submitted");
      setRating(0);
      setTitle("");
      setComment("");
      router.refresh();
    });
  };

  const active = hover || rating;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6"
    >
      <h3 className="font-semibold">Write a review</h3>

      <div className="flex flex-col gap-1.5">
        <span id="rating-label" className="text-sm font-medium">
          Your rating
        </span>
        <div
          className="flex items-center gap-1"
          role="radiogroup"
          aria-labelledby="rating-label"
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} star${value > 1 ? "s" : ""}`}
              onMouseEnter={() => setHover(value)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(value)}
              className="cursor-pointer p-0.5"
            >
              <Star
                className={
                  active >= value
                    ? "size-6 fill-primary text-primary"
                    : "size-6 text-muted-foreground"
                }
              />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="review-title">Title (optional)</Label>
        <Input
          id="review-title"
          value={title}
          maxLength={120}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="review-comment">Your review</Label>
        <Textarea
          id="review-comment"
          value={comment}
          required
          minLength={3}
          maxLength={2000}
          rows={4}
          onChange={(event) => setComment(event.target.value)}
        />
      </div>

      {error && (
        <p role="alert" aria-live="polite" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="h-11 w-full cursor-pointer"
        disabled={pending || rating === 0}
      >
        {pending ? "Submitting..." : "Submit review"}
      </Button>
    </form>
  );
}
