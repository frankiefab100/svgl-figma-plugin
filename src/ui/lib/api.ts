// NO fetch() calls here.
// The Figma plugin iframe cannot reach external domains directly.
// All network requests go through code.ts (the main thread).
// This file only contains:
//   1. Helpers that work on already-fetched data
//   2. The postMessage bridge to request data from code.ts

import type { SVGLogo } from "../../types/svgl";

/** Resolve a logo's SVG URL for a given variant */
export function resolveLogoUrl(
  route: string | { light: string; dark: string },
  variant: "light" | "dark" = "light"
): string {
  if (typeof route === "string") return route;
  return variant === "dark" ? route.dark : route.light;
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
