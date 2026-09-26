"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { REGION_COOKIE, CURRENCY_COOKIE } from "@/lib/prefs";

export async function setRegion(code: string) {
  const store = await cookies();
  store.set(REGION_COOKIE, code, { path: "/" });
  revalidatePath("/");
}

export async function setCurrency(code: string) {
  const store = await cookies();
  store.set(CURRENCY_COOKIE, code, { path: "/" });
  revalidatePath("/");
}
