"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleWishlist } from "@/app/actions/wishlist";

export function WishlistButton({
  productId,
  initiallyWishlisted,
  nextPath,
}: {
  productId: string;
  initiallyWishlisted: boolean;
  nextPath?: string;
}) {
  const [wishlisted, setWishlisted] = useState(initiallyWishlisted);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleClick = () => {
    startTransition(async () => {
      const result = await toggleWishlist(productId);
      if (result.requiresAuth) {
        router.push(`/sign-in?next=${encodeURIComponent(nextPath ?? "/")}`);
        return;
      }
      if (result.ok) {
        setWishlisted(Boolean(result.wishlisted));
        toast.success(
          result.wishlisted ? "Added to wishlist" : "Removed from wishlist",
        );
        router.refresh();
      }
    });
  };

  return (
    <Button
      variant="secondary"
      size="lg"
      className="h-11 w-full cursor-pointer"
      disabled={pending}
      onClick={handleClick}
    >
      <Heart className={wishlisted ? "size-4 fill-current" : "size-4"} />
      {wishlisted ? "In wishlist" : "Add to wishlist"}
    </Button>
  );
}
