"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signUpError } = await authClient.signUp.email({
      name,
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message || "Failed to sign up");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm mx-auto p-6 bg-card rounded-lg border border-border shadow-sm">
      <h1 className="text-2xl font-bold mb-2">Create account</h1>
      
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md" aria-live="polite">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Your name
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none"
        />
      </div>

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
            minLength={8}
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
        <p className="text-xs text-muted-foreground">Passwords must be at least 8 characters.</p>
      </div>

      <Button type="submit" size="lg" className="h-11 w-full mt-2" disabled={loading}>
        {loading ? "Creating account..." : "Create account"}
      </Button>

      <div className="mt-4 text-center text-sm">
        <span className="text-muted-foreground">Already have an account? </span>
        <Link href="/sign-in" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </div>
    </form>
  );
}
