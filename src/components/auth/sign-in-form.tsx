"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { mergeGuestCart } from "@/app/actions/cart";
import { Button } from "@/components/ui/button";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message || "Failed to sign in");
      setLoading(false);
    } else {
      await mergeGuestCart();
      router.push(nextPath);
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm mx-auto p-6 bg-card rounded-lg border border-border shadow-sm">
      <h1 className="text-2xl font-bold mb-2">Sign in</h1>
      
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md" aria-live="polite">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-10 w-full px-3 pr-10 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" size="lg" className="h-11 w-full mt-2" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </Button>

      <div className="mt-4 text-center text-sm">
        <span className="text-muted-foreground">New to amaclone? </span>
        <Link href="/sign-up" className="text-primary hover:underline font-medium">
          Create your account
        </Link>
      </div>
    </form>
  );
}
