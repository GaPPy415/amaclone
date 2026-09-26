"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setCartItemQuantity, removeCartItem } from "@/app/actions/cart";
import { formatMoney } from "@/lib/money";

export type CartLine = {
  id: string;
  slug: string;
  title: string;
  imageUrl: string;
  unitPriceCents: number;
  quantity: number;
};

export function CartItems({
  lines,
  currencyCode,
  rateFromUsd,
}: {
  lines: CartLine[];
  currencyCode: string;
  rateFromUsd: number;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const changeQuantity = (id: string, quantity: number) => {
    startTransition(async () => {
      const result = await setCartItemQuantity(id, quantity);
      if (!result.ok) {
        toast.error(result.message ?? "Could not update quantity");
        return;
      }
      router.refresh();
    });
  };

  const remove = (id: string) => {
    startTransition(async () => {
      const result = await removeCartItem(id);
      if (!result.ok) {
        toast.error(result.message ?? "Could not remove item");
        return;
      }
      toast.success("Removed from cart");
      router.refresh();
    });
  };

  return (
    <ul className="flex flex-col divide-y divide-border">
      {lines.map((line) => (
        <li key={line.id} className="flex gap-4 py-6 first:pt-0">
          <Link
            href={`/product/${line.slug}`}
            className="relative size-24 shrink-0 overflow-hidden rounded-md border border-border bg-muted"
          >
            <Image
              src={line.imageUrl}
              alt={line.title}
              fill
              className="object-cover"
              sizes="96px"
            />
          </Link>

          <div className="flex flex-1 flex-col gap-2">
            <Link
              href={`/product/${line.slug}`}
              className="font-medium leading-snug hover:text-primary"
            >
              {line.title}
            </Link>
            <span className="text-lg font-semibold text-price tabular-nums">
              {formatMoney(line.unitPriceCents, currencyCode, rateFromUsd)}
            </span>

            <div className="mt-1 flex items-center gap-3">
              <div className="flex items-center rounded-md border border-border">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="cursor-pointer"
                  aria-label={`Decrease quantity of ${line.title}`}
                  disabled={pending}
                  onClick={() => changeQuantity(line.id, line.quantity - 1)}
                >
                  <Minus className="size-3.5" />
                </Button>
                <span className="w-8 text-center text-sm tabular-nums">
                  {line.quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="cursor-pointer"
                  aria-label={`Increase quantity of ${line.title}`}
                  disabled={pending}
                  onClick={() => changeQuantity(line.id, line.quantity + 1)}
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="cursor-pointer text-destructive hover:text-destructive"
                disabled={pending}
                onClick={() => remove(line.id)}
              >
                <Trash2 className="size-4" />
                Remove
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
