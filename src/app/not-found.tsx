import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-muted-foreground mb-8">
        Sorry, we couldn&apos;t find the page you&apos;re looking for.
      </p>
      <Button asChild size="lg">
        <Link href="/">Return to Home</Link>
      </Button>
    </div>
  );
}
