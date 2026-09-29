'use client';
// Tiny client-side GET cache — page dobara kholo to data turant dikhe.
// Mutations (save/delete) ke baad bust() call karo taaki fresh data aaye.

const cache = new Map(); // url -> { d, t }
const inflight = new Map(); // url -> promise
const DEFAULT_TTL = 30_000; // 30 seconds

export function cachedGet(url, ttlMs = DEFAULT_TTL) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.t < ttlMs) return Promise.resolve(hit.d);
  if (inflight.has(url)) return inflight.get(url);
  const p = fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error('Request failed');
      return r.json();
    })
    .then((d) => {
      cache.set(url, { d, t: Date.now() });
      inflight.delete(url);
      return d;
    })
    .catch((e) => {
      inflight.delete(url);
      throw e;
    });
  inflight.set(url, p);
  return p;
}

// url aur usse shuru hone wale sabhi cached entries hatao
export function bust(url) {
  for (const k of [...cache.keys()]) {
    if (k === url || k.startsWith(url)) cache.delete(k);
  }
}
