import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { FxRateRow } from "@/lib/money";

export const REGION_COOKIE = "amaclone_region";
export const CURRENCY_COOKIE = "amaclone_currency";
export const DEFAULT_REGION_CODE = "US";

export type ActiveRegion = {
  id: string;
  code: string;
  name: string;
  currencyCode: string;
};

export async function getRegions(): Promise<ActiveRegion[]> {
  return prisma.region.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, code: true, name: true, currencyCode: true },
  });
}

export async function getFxRates(): Promise<FxRateRow[]> {
  return prisma.fxRate.findMany({
    select: { currencyCode: true, rateFromUsd: true, symbol: true },
  });
}

export async function getActiveRegion(
  regions?: ActiveRegion[],
): Promise<ActiveRegion> {
  const list = regions ?? (await getRegions());
  const store = await cookies();
  const code = store.get(REGION_COOKIE)?.value;
  return (
    list.find((region) => region.code === code) ??
    list.find((region) => region.code === DEFAULT_REGION_CODE) ??
    list[0]
  );
}

export async function getActiveCurrency(
  fallback: string,
): Promise<string> {
  const store = await cookies();
  return store.get(CURRENCY_COOKIE)?.value ?? fallback;
}
