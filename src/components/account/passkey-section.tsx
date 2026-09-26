"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Fingerprint } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export type PasskeySummary = {
  id: string;
  name: string | null;
  createdAt: string | null;
};

export function PasskeySection({
  passkeys,
}: {
  passkeys: PasskeySummary[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const addPasskey = async () => {
    setBusy(true);
    try {
      const { error } = await authClient.passkey.addPasskey({
        name: `Passkey ${new Date().toLocaleDateString()}`,
      });
      if (error) {
        toast.error(error.message ?? "Could not create a passkey.");
        return;
      }
      toast.success("Passkey created");
      router.refresh();
    } catch {
      toast.error("Your browser could not create a passkey on this device.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Passkeys</h2>
          <p className="text-sm text-muted-foreground">
            Sign in without a password using your device fingerprint, face or PIN.
          </p>
        </div>
        <Button onClick={addPasskey} disabled={busy} className="h-10">
          <Fingerprint className="size-4" />
          {passkeys.length === 0 ? "Generate passkey" : "Add another passkey"}
        </Button>
      </div>

      {passkeys.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          No passkey is set up for this account yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {passkeys.map((passkey) => (
            <li
              key={passkey.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 text-sm"
            >
              <span className="flex items-center gap-2">
                <Fingerprint className="size-4 text-primary" />
                <span className="font-medium">{passkey.name ?? "Passkey"}</span>
              </span>
              {passkey.createdAt && (
                <span className="text-muted-foreground">
                  added {new Date(passkey.createdAt).toLocaleDateString()}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
