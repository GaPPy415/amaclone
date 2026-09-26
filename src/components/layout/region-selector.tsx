"use client";

import { useRouter } from "next/navigation";
import { setRegion } from "@/app/actions/prefs";
import { ActiveRegion } from "@/lib/prefs";

export function RegionSelector({
  regions,
  currentCode,
}: {
  regions: ActiveRegion[];
  currentCode: string;
}) {
  const router = useRouter();

  return (
    <select
      className="bg-transparent text-nav-foreground border-none outline-none cursor-pointer text-sm font-medium"
      value={currentCode}
      onChange={async (e) => {
        await setRegion(e.target.value);
        router.refresh();
      }}
      aria-label="Select region"
    >
      {regions.map((r) => (
        <option key={r.code} value={r.code} className="text-foreground bg-background">
          {r.code}
        </option>
      ))}
    </select>
  );
}
