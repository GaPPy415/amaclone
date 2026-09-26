"use client";

import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { setRegion } from "@/app/actions/prefs";
import { ActiveRegion } from "@/lib/prefs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function RegionSelector({
  regions,
  currentCode,
}: {
  regions: ActiveRegion[];
  currentCode: string;
}) {
  const router = useRouter();

  return (
    <Select
      value={currentCode}
      onValueChange={async (value) => {
        await setRegion(value);
        router.refresh();
      }}
    >
      <SelectTrigger
        aria-label="Delivery region"
        className="h-9 w-auto gap-2 border-none bg-transparent px-2 text-nav-foreground shadow-none hover:bg-white/10 focus-visible:ring-0 dark:bg-transparent dark:hover:bg-white/10"
      >
        <MapPin className="size-4 shrink-0" />
        <span className="text-xs font-medium uppercase tracking-wide text-nav-foreground/60">
          Region
        </span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectGroup>
          <SelectLabel>Deliver to</SelectLabel>
          {regions.map((region) => (
            <SelectItem key={region.code} value={region.code}>
              {region.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
