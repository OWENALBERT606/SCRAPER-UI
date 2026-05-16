import type { ScrapeResponse } from "./types";

const BASE = "http://localhost:3000/api";

export async function scrapeUrl(
  url: string,
  selectors: Record<string, string>,
  waitFor: string
): Promise<ScrapeResponse> {
  const body: Record<string, unknown> = { url };
  if (Object.keys(selectors).length > 0) body.selectors = selectors;
  if (waitFor.trim()) body.waitFor = waitFor.trim();

  const res = await fetch(`${BASE}/scrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function getCachedUrls(): Promise<{ count: number; urls: string[] }> {
  const res = await fetch(`${BASE}/cache`);
  return res.json();
}

export async function getCachedData(url: string): Promise<ScrapeResponse> {
  const res = await fetch(`${BASE}/data?url=${encodeURIComponent(url)}`);
  return res.json();
}

export async function clearCache(url?: string): Promise<void> {
  const query = url ? `?url=${encodeURIComponent(url)}` : "";
  await fetch(`${BASE}/cache${query}`, { method: "DELETE" });
}
