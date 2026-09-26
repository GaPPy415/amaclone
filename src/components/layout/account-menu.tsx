"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AccountMenu() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  if (isPending) {
    return <div className="h-8 w-24 animate-pulse rounded bg-white/10" />;
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-4 text-sm font-medium">
        <Link href="/sign-in" className="hover:underline">
          Sign in
        </Link>
        <Link href="/sign-up" className="hover:underline">
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 cursor-pointer gap-2 px-2 text-nav-foreground hover:bg-white/10 hover:text-nav-foreground"
          aria-label="Account menu"
        >
          <User className="size-5" />
          <span className="hidden max-w-[120px] truncate text-sm font-medium sm:inline">
            {session.user.name}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="truncate">
          {session.user.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">Account</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/orders">Orders</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/wishlist">Wishlist</Link>
        </DropdownMenuItem>
        {session.user.role === "admin" && (
          <DropdownMenuItem asChild>
            <Link href="/admin">Admin</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={async () => {
            await authClient.signOut();
            router.push("/");
            router.refresh();
          }}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
