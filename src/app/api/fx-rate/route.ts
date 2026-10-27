import { NextResponse } from 'next/server';

let cachedRate = 58.85;
let lastFetched = 0;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour cache

export async function GET() {
  const now = Date.now();
  if (now - lastFetched < CACHE_DURATION_MS) {
    return NextResponse.json({
      rate: cachedRate,
      base: 'USD',
      target: 'PHP',
      source: 'cache',
      updatedAt: new Date(lastFetched).toISOString(),
    });
  }

  try {
    // Free open exchange API for live USD to PHP conversion
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates && data.rates.PHP) {
        cachedRate = Number(data.rates.PHP.toFixed(2));
        lastFetched = now;
      }
    }
  } catch (err) {
    console.warn('Live FX rate fetch failed, using reliable fallback:', err);
  }

  return NextResponse.json({
    rate: cachedRate,
    base: 'USD',
    target: 'PHP',
    source: lastFetched === now ? 'live' : 'fallback',
    updatedAt: new Date(lastFetched || now).toISOString(),
  });
}
