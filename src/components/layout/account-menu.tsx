"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { User } from "lucide-react";

export function AccountMenu() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  if (isPending) {
    return <div className="h-8 w-20 animate-pulse bg-white/10 rounded" />;
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
    <div className="group relative flex items-center gap-2 cursor-pointer py-2">
      <User className="size-5" />
      <span className="text-sm font-medium max-w-[100px] truncate">
        {session.user.name}
      </span>
      
      <div className="absolute right-0 top-full hidden w-48 flex-col rounded-md bg-card text-card-foreground shadow-lg group-hover:flex border border-border z-50">
        <Link href="/account" className="px-4 py-2 text-sm hover:bg-muted">
          Account
        </Link>
        <Link href="/orders" className="px-4 py-2 text-sm hover:bg-muted">
          Orders
        </Link>
        <Link href="/wishlist" className="px-4 py-2 text-sm hover:bg-muted">
          Wishlist
        </Link>
        <button
          onClick={async () => {
            await authClient.signOut();
            router.refresh();
          }}
          className="px-4 py-2 text-sm text-left hover:bg-muted text-destructive"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
