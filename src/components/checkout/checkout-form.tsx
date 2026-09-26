"use client";

import { useActionState } from "react";
import { placeOrder, type CheckoutState } from "@/app/actions/checkout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AddressOption = {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  postalCode: string;
};

const initialState: CheckoutState = { ok: true };

export function CheckoutForm({ addresses }: { addresses: AddressOption[] }) {
  const [state, formAction, pending] = useActionState(placeOrder, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {addresses.length > 0 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 font-semibold">Saved addresses</legend>
          {addresses.map((address, index) => (
            <label
              key={address.id}
              className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-accent/40"
            >
              <input
                type="radio"
                name="addressId"
                value={address.id}
                defaultChecked={index === 0}
                className="mt-1"
              />
              <span className="text-sm">
                <span className="font-medium">
                  {address.label ?? "Address"}
                </span>
                <span className="block text-muted-foreground">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}, {address.city},{" "}
                  {address.postalCode}
                </span>
              </span>
            </label>
          ))}
          <label className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-accent/40">
            <input type="radio" name="addressId" value="" className="mt-1" />
            <span className="text-sm font-medium">Use a new address</span>
          </label>
        </fieldset>
      )}

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 font-semibold">
          {addresses.length > 0 ? "New address" : "Delivery address"}
        </legend>
        <div className="flex flex-col gap-2">
          <Label htmlFor="label">Label (optional)</Label>
          <Input id="label" name="label" placeholder="Home, Work..." />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="line1">Street address</Label>
          <Input id="line1" name="line1" autoComplete="address-line1" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="line2">Apartment, suite (optional)</Label>
          <Input id="line2" name="line2" autoComplete="address-line2" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" autoComplete="address-level2" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="postalCode">Postal code</Label>
            <Input
              id="postalCode"
              name="postalCode"
              autoComplete="postal-code"
            />
          </div>
        </div>
      </fieldset>

      {!state.ok && state.message && (
        <p role="alert" aria-live="polite" className="text-sm text-destructive">
          {state.message}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="h-11 w-full cursor-pointer"
        disabled={pending}
      >
        {pending ? "Placing order..." : "Place order"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Demo checkout — no payment is taken.
      </p>
    </form>
  );
}
