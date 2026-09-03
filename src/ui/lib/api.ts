// Helper functions and message bridge for UI <-> Plugin sandbox communication.

import type { SVGLogo } from "../../types/svgl";

/** Normalize svgl.app URLs to jsDelivr CDN with proper CORS and caching */
export function toCdnUrl(url: string): string {
  if (!url) return url;
  const clean = url.trim();
  if (clean.includes("svgl.app")) {
    const filename = clean.split("/").pop()?.replace(/\?.*$/, "");
    if (filename && filename.endsWith(".svg")) {
      return `https://cdn.jsdelivr.net/gh/pheralb/svgl@main/static/library/${filename}`;
    }
  }
  return clean;
}

/** Resolve a logo's SVG URL for a given variant, routed through CORS-enabled CDN */
export function resolveLogoUrl(
  route: string | { light: string; dark: string },
  variant: "light" | "dark" = "light"
): string {
  const raw = typeof route === "string" ? route : (variant === "dark" ? route.dark : route.light);
  return toCdnUrl(raw);
}

/** Check if a logo has separate light/dark variants */
export function hasVariants(
  route: string | { light: string; dark: string }
): route is { light: string; dark: string } {
  return typeof route === "object" && "light" in route && "dark" in route;
}

/** Filter logos client-side (used after data arrives from code.ts) */
export function filterByCategory(logos: SVGLogo[], category: string): SVGLogo[] {
  if (category === "All") return logos;
  return logos.filter((l) => {
    const cats = Array.isArray(l.category) ? l.category : [l.category];
    return cats.some((c) => c.toLowerCase() === category.toLowerCase());
  });
}

/** Filter logos client-side by search query */
export function filterByQuery(logos: SVGLogo[], query: string): SVGLogo[] {
  if (!query.trim()) return logos;
  const q = query.toLowerCase();
  return logos.filter((l) => l.title.toLowerCase().includes(q));
}

// Message bridge helpers
export function sendToPlugin(msg: object) {
  parent.postMessage({ pluginMessage: msg }, "*");
}
