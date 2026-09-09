// Helper functions and message bridge for UI <-> Plugin sandbox communication.
import type { SVGLogo } from "../../types/svgl";

export const API = "https://api.svgl.app";

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

export function toRawGithubUrl(url: string): string {
  const filename = url.split("/").pop()?.replace(/\?.*$/, "");
  if (filename && filename.endsWith(".svg")) {
    return `https://raw.githubusercontent.com/pheralb/svgl/main/static/library/${filename}`;
  }
  return url;
}

// SVG sanitization
export function sanitizeSVG(raw: string): string {
  let svg = raw
    .replace(/<\?xml[^>]*\?>/gi, "")
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/@import[^;]+;/gi, "")
    .replace(/url\(['"]?https?:\/\/[^'")\s]+['"]?\)/gi, "none")
    .trim();

  const vbMatch = svg.match(/viewBox=["']\s*([\d.-]+)[\s,]+([\d.-]+)[\s,]+([\d.-]+)[\s,]+([\d.-]+)\s*["']/i);
  const vbW = vbMatch ? parseFloat(vbMatch[3]) : 0;
  const vbH = vbMatch ? parseFloat(vbMatch[4]) : 0;

  const wMatch = svg.match(/\bwidth=["']([0-9.]+)(px)?["']/i);
  const hMatch = svg.match(/\bheight=["']([0-9.]+)(px)?["']/i);

  const finalW = wMatch ? parseFloat(wMatch[1]) : (vbW > 0 ? vbW : 100);
  const finalH = hMatch ? parseFloat(hMatch[1]) : (vbH > 0 ? vbH : 100);

  const hasValidW = /\bwidth=["'][0-9.]+(px)?["']/i.test(svg);
  const hasValidH = /\bheight=["'][0-9.]+(px)?["']/i.test(svg);

  if (!hasValidW || !hasValidH) {
    svg = svg.replace(/\s*\bwidth=["'][^"']*["']/gi, "");
    svg = svg.replace(/\s*\bheight=["'][^"']*["']/gi, "");
    svg = svg.replace(/<svg/i, `<svg width="${finalW}" height="${finalH}"`);
  }

  if (!vbMatch && finalW > 0 && finalH > 0) {
    svg = svg.replace(/<svg/i, `<svg viewBox="0 0 ${finalW} ${finalH}"`);
  }

  return svg;
}

// SVG dimension helpers
export function getSVGDimensions(svg: string): { w: number; h: number } {
  const vbMatch = svg.match(/viewBox=["']\s*([\d.-]+)[\s,]+([\d.-]+)[\s,]+([\d.-]+)[\s,]+([\d.-]+)\s*["']/i);
  if (vbMatch) {
    const w = parseFloat(vbMatch[3]);
    const h = parseFloat(vbMatch[4]);
    if (w > 0 && h > 0) return { w, h };
  }
  const wMatch = svg.match(/\bwidth=["']([0-9.]+)["']/i);
  const hMatch = svg.match(/\bheight=["']([0-9.]+)["']/i);
  const w = wMatch ? parseFloat(wMatch[1]) : 100;
  const h = hMatch ? parseFloat(hMatch[1]) : 100;
  return { w: w > 0 ? w : 100, h: h > 0 ? h : 100 };
}

// Placement helper
export function placeNode(node: SceneNode & { width: number; height: number }, placement: "cursor" | "new-page") {
  const sel = figma.currentPage.selection;

  if (sel.length === 1 && sel[0].type === "FRAME") {
    const frame = sel[0] as FrameNode;
    (node as FrameNode).x = (frame.width - node.width) / 2;
    (node as FrameNode).y = (frame.height - node.height) / 2;
    frame.appendChild(node);
    return;
  }

  figma.currentPage.appendChild(node);
  if (placement === "cursor") {
    (node as FrameNode).x = figma.viewport.center.x - node.width / 2;
    (node as FrameNode).y = figma.viewport.center.y - node.height / 2;
  } else {
    (node as FrameNode).x = 100;
    (node as FrameNode).y = 100;
  }
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

// Utility
export function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try { return JSON.stringify(e); } catch { return "Unknown error"; }
}
