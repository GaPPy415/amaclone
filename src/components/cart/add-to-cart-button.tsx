"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/app/actions/cart";

export function AddToCartButton({
  productId,
  disabled,
}: {
  productId: string;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    startTransition(async () => {
      const result = await addToCart(productId, 1);
      if (result.ok) {
        setAdded(true);
        toast.success("Added to cart");
        router.refresh();
        window.setTimeout(() => setAdded(false), 1500);
      } else {
        toast.error(result.message ?? "Could not add to cart");
      }
    });
  };

  return (
    <Button
      size="lg"
      className="h-11 w-full cursor-pointer"
      disabled={disabled || pending}
      onClick={handleClick}
    >
      <ShoppingCart className="size-4" />
      {pending ? "Adding..." : added ? "Added" : "Add to Cart"}
    </Button>
  );
}
