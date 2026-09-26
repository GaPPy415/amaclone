import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRegions } from "@/lib/prefs";
import {
  addAddressForm,
  removeAddressForm,
  setDefaultAddressForm,
} from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SignOutButton } from "@/components/account/sign-out-button";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-4 px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold">Your account</h1>
        <p className="text-muted-foreground">
          Sign in to view your profile and addresses.
        </p>
        <Button asChild size="lg" className="h-11 cursor-pointer">
          <Link href="/sign-in?next=/account">Sign in</Link>
        </Button>
      </div>
    );
  }

  const [addresses, regions] = await Promise.all([
    prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      include: { region: true },
    }),
    getRegions(),
  ]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold">Your account</h1>

      <Card className="mb-8">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {user.role === "admin" && (
              <Badge className="mt-2">Administrator</Badge>
            )}
          </div>
          <SignOutButton />
        </CardContent>
      </Card>

      <section className="mb-8 flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Addresses</h2>
        {addresses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No saved addresses yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {addresses.map((address) => (
              <li
                key={address.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"
              >
                <div className="text-sm">
                  <span className="font-medium">
                    {address.label ?? "Address"}
                    {address.isDefault && (
                      <Badge variant="secondary" className="ml-2">
                        Default
                      </Badge>
                    )}
                  </span>
                  <p className="text-muted-foreground">
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}, {address.city},{" "}
                    {address.postalCode} · {address.region.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!address.isDefault && (
                    <form action={setDefaultAddressForm}>
                      <input type="hidden" name="id" value={address.id} />
                      <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                      >
                        Make default
                      </Button>
                    </form>
                  )}
                  <form action={removeAddressForm}>
                    <input type="hidden" name="id" value={address.id} />
                    <Button
                      type="submit"
                      variant="destructive"
                      size="sm"
                      className="cursor-pointer"
                    >
                      Remove
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Add an address</h2>
        <form action={addAddressForm} className="flex max-w-2xl flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="label">Label</Label>
              <Input id="label" name="label" placeholder="Home, Work..." />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="regionId">Region</Label>
              <select
                id="regionId"
                name="regionId"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="line1">Street address</Label>
            <Input id="line1" name="line1" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="line2">Apartment, suite (optional)</Label>
            <Input id="line2" name="line2" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="postalCode">Postal code</Label>
              <Input id="postalCode" name="postalCode" required />
            </div>
          </div>
          <Button type="submit" className="h-11 w-fit cursor-pointer">
            Save address
          </Button>
        </form>
      </section>
    </div>
  );
}
