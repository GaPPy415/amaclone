"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE_OPTIONS = [12, 24, 36];

export function PageSizeSelect({ value }: { value: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const change = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (Number(next) === 24) params.delete("pageSize");
    else params.set("pageSize", next);
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `?${qs}` : "?");
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Show</span>
      <Select value={String(value)} onValueChange={change}>
        <SelectTrigger aria-label="Results per page" className="h-8 w-[76px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {PAGE_SIZE_OPTIONS.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <span className="text-muted-foreground">per page</span>
    </div>
  );
}
