import { NextResponse, type NextRequest } from "next/server";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;
const MAX_TRACKED_CLIENTS = 5000;

type Counter = { count: number; reset: number };

const counters = new Map<string, Counter>();

export function middleware(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "local";
  const now = Date.now();

  if (counters.size > MAX_TRACKED_CLIENTS) {
    counters.clear();
  }

  const entry = counters.get(ip);
  if (!entry || entry.reset < now) {
    counters.set(ip, { count: 1, reset: now + WINDOW_MS });
    return NextResponse.next();
  }

  entry.count += 1;
  if (entry.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.reset - now) / 1000);
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
