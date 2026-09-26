import Link from "next/link";
import { ShoppingCart, Heart } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchBar } from "./search-bar";
import { RegionSelector } from "./region-selector";
import { CurrencySelector } from "./currency-selector";
import { AccountMenu } from "./account-menu";
import { getRegions, getFxRates, getActiveRegion, getActiveCurrency } from "@/lib/prefs";
import { getCartCount } from "@/lib/cart";
import { getWishlistCount } from "@/lib/wishlist";

export async function SiteHeader() {
  const [regions, rates, cartCount, wishlistCount] = await Promise.all([
    getRegions(),
    getFxRates(),
    getCartCount(),
    getWishlistCount(),
  ]);
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

            <Link
              href="/wishlist"
              className="relative flex items-center gap-1 hover:text-primary transition-colors"
              aria-label={`Wishlist (${wishlistCount} items)`}
            >
              <Heart className="size-5" />
              {wishlistCount > 0 && (
                <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              className="relative flex items-center gap-1 hover:text-primary transition-colors"
              aria-label={`Cart (${cartCount} items)`}
            >
              <ShoppingCart className="size-5" />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {cartCount}
                </span>
              )}
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
