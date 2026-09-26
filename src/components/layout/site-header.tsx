import Link from "next/link";
import { ShoppingCart, Heart } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchBar } from "./search-bar";
import { RegionSelector } from "./region-selector";
import { CurrencySelector } from "./currency-selector";
import { AccountMenu } from "./account-menu";
import { getRegions, getFxRates, getActiveRegion, getActiveCurrency } from "@/lib/prefs";

export async function SiteHeader() {
  const [regions, rates] = await Promise.all([getRegions(), getFxRates()]);
  const activeRegion = await getActiveRegion(regions);
  const activeCurrency = await getActiveCurrency(activeRegion.currencyCode);

  return (
    <header className="sticky top-0 z-40 w-full bg-nav text-nav-foreground shadow-md">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-bold tracking-tight">amaclone</span>
          </Link>

          <div className="hidden flex-1 md:flex justify-center px-4">
            <SearchBar />
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden lg:flex items-center gap-4 mr-2">
              <RegionSelector regions={regions} currentCode={activeRegion.code} />
              <CurrencySelector rates={rates} currentCode={activeCurrency} />
            </div>

            <AccountMenu />

            <Link href="/wishlist" className="flex items-center gap-1 hover:text-primary transition-colors" aria-label="Wishlist">
              <Heart className="size-5" />
            </Link>

            <Link href="/cart" className="flex items-center gap-1 hover:text-primary transition-colors" aria-label="Cart">
              <ShoppingCart className="size-5" />
            </Link>

            <ThemeToggle />
          </div>
        </div>
        
        <div className="pb-3 md:hidden">
          <SearchBar />
        </div>
      </div>
    </header>
  );
}
