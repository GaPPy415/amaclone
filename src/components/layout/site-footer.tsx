import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-nav text-nav-foreground mt-auto">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold mb-4">Get to Know Us</h3>
            <ul className="space-y-2 text-sm text-nav-foreground/80">
              <li><Link href="#" className="hover:underline">Careers</Link></li>
              <li><Link href="#" className="hover:underline">Blog</Link></li>
              <li><Link href="#" className="hover:underline">About amaclone</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">Make Money with Us</h3>
            <ul className="space-y-2 text-sm text-nav-foreground/80">
              <li><Link href="#" className="hover:underline">Sell products</Link></li>
              <li><Link href="#" className="hover:underline">Become an Affiliate</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">Payment Products</h3>
            <ul className="space-y-2 text-sm text-nav-foreground/80">
              <li><Link href="#" className="hover:underline">Business Card</Link></li>
              <li><Link href="#" className="hover:underline">Shop with Points</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">Let Us Help You</h3>
            <ul className="space-y-2 text-sm text-nav-foreground/80">
              <li><Link href="/account" className="hover:underline">Your Account</Link></li>
              <li><Link href="/orders" className="hover:underline">Your Orders</Link></li>
              <li><Link href="#" className="hover:underline">Help</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-nav-foreground/60">
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:underline">Conditions of Use</Link>
            <Link href="#" className="hover:underline">Privacy Notice</Link>
          </div>
          <p>© {new Date().getFullYear()} amaclone.dev, Inc. or its affiliates</p>
        </div>
      </div>
    </footer>
  );
}
