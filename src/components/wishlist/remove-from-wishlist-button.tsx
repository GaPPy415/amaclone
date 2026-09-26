"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleWishlist } from "@/app/actions/wishlist";

export function RemoveFromWishlistButton({ productId }: { productId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const remove = () => {
    startTransition(async () => {
      const result = await toggleWishlist(productId);
      if (!result.ok) {
        toast.error("Could not update your wishlist");
        return;
      }
      toast.success("Removed from wishlist");
      router.refresh();
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={pending}
      onClick={remove}
    >
      <Trash2 className="size-4" />
      {pending ? "Removing..." : "Remove"}
    </Button>
  );
}
