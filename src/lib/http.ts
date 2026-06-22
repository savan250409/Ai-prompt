import { NextResponse } from "next/server";

/** Standard JSON success. Catalog responses are public & cacheable-ish. */
export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/** Parse skip/take pagination from a URL with sane caps. */
export function parsePaging(url: string, defaultTake = 24, maxTake = 60) {
  const sp = new URL(url).searchParams;
  const skip = Math.max(0, Number.parseInt(sp.get("skip") ?? "0", 10) || 0);
  const take = Math.min(maxTake, Math.max(1, Number.parseInt(sp.get("take") ?? String(defaultTake), 10) || defaultTake));
  return { skip, take };
}
