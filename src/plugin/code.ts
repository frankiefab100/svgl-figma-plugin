/// <reference types="@figma/plugin-typings" />

import type { UIToPluginMessage } from "./messages";

const API = "https://api.svgl.app";

figma.showUI(__html__, {
  width: 340,
  height: 560,
  themeColors: true,
  title: "SVGL - Logo Library",
});

// Message handler
figma.ui.onmessage = async (msg: UIToPluginMessage) => {
  switch (msg.type) {
    case "FETCH_LOGOS":
      await proxyJSON(API, "LOGOS_DATA");
      break;
    case "FETCH_CATEGORIES":
      await proxyJSON(`${API}/categories`, "CATEGORIES_DATA");
      break;
    case "SEARCH_LOGOS":
      await proxyJSON(`${API}?search=${encodeURIComponent(msg.query)}`, "LOGOS_DATA");
      break;
    case "FETCH_CATEGORY":
      await proxyJSON(`${API}/category/${encodeURIComponent(msg.category)}`, "LOGOS_DATA");
      break;
    case "IMPORT_LOGO":
      await importSingle(msg.payload);
      break;
    case "IMPORT_LOGOS_BATCH":
      await importBatch(msg.payload);
      break;
    case "CLOSE":
      figma.closePlugin();
      break;
  }
};

// Proxy JSON → UI
async function proxyJSON(url: string, successType: "LOGOS_DATA" | "CATEGORIES_DATA") {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (successType === "CATEGORIES_DATA") {
      figma.ui.postMessage({ type: "CATEGORIES_DATA", categories: data });
    } else {
      figma.ui.postMessage({ type: "LOGOS_DATA", logos: data });
    }
  } catch (err) {
    figma.ui.postMessage({
      type: "LOGOS_ERROR",
      error: errMsg(err),
    });
  }
}

// Sanitise SVG text for Figma
function sanitizeSVG(raw: string): string {
  let svg = raw
    .replace(/<\?xml[^>]*\?>/gi, "")
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/@import[^;]+;/gi, "")
    .replace(/url\(['"]?https?:\/\/[^'")\s]+['"]?\)/gi, "none")
    .trim();

  // Ensure explicit pixel dimensions so Figma can size the node
  const hasW = /width=["']\d/.test(svg);
  const hasH = /height=["']\d/.test(svg);

  if (!hasW || !hasH) {
    const vbMatch = svg.match(/viewBox=["']\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*["']/);
    if (vbMatch) {
      const vw = parseFloat(vbMatch[3]);
      const vh = parseFloat(vbMatch[4]);
      if (vw > 0 && vh > 0) {
        if (!hasW) svg = svg.replace(/<svg/, `<svg width="${vw}"`);
        if (!hasH) svg = svg.replace(/<svg/, `<svg height="${vh}"`);
      }
    } else {
      if (!hasW) svg = svg.replace(/<svg/, '<svg width="100"');
      if (!hasH) svg = svg.replace(/<svg/, '<svg height="100"');
    }
  }

  return svg;
}

// Fetch raw bytes from a URL
async function fetchBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

// Fetch SVG text
async function fetchSVGText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return sanitizeSVG(await res.text());
}

// Parse viewBox / width / height to get natural aspect ratio
function getSVGDimensions(svg: string): { w: number; h: number } {
  const vbMatch = svg.match(/viewBox=["']\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*["']/);
  if (vbMatch) return { w: parseFloat(vbMatch[3]), h: parseFloat(vbMatch[4]) };

  const wMatch = svg.match(/width=["']([\d.]+)["']/);
  const hMatch = svg.match(/height=["']([\d.]+)["']/);
  const w = wMatch ? parseFloat(wMatch[1]) : 100;
  const h = hMatch ? parseFloat(hMatch[1]) : 100;
  return { w: w > 0 ? w : 100, h: h > 0 ? h : 100 };
}

// Strategy 1: createNodeFromSvg
async function tryCreateNodeFromSvg(svgText: string, name: string, size: number): Promise<FrameNode> {
  // createNodeFromSvg throws a plain object on failure (not an Error)
  // so we catch everything and re-throw with a useful message
  let node: FrameNode;
  try {
    node = figma.createNodeFromSvg(svgText);
  } catch (e) {
    throw new Error(`SVG parse error: ${errMsg(e)}`);
  }

  node.name = name;

  const w = node.width  > 0 ? node.width  : getSVGDimensions(svgText).w;
  const h = node.height > 0 ? node.height : getSVGDimensions(svgText).h;
  const scale = size / Math.max(w, h);
  const tw = Math.max(1, Math.round(w * scale));
  const th = Math.max(1, Math.round(h * scale));
  node.resize(tw, th);
  return node;
}

// ─── Strategy 2: SVG as image fill (fallback for complex SVGs) ────────────────
// Figma can render any SVG perfectly as an image — gradients, masks, filters all work.
// The trade-off is it becomes a raster-like image fill rather than editable vectors.
async function tryCreateImageFromSvg(svgUrl: string, name: string, size: number, svgText: string): Promise<RectangleNode> {
  const dims = getSVGDimensions(svgText);
  const scale = size / Math.max(dims.w, dims.h);
  const tw = Math.max(1, Math.round(dims.w * scale));
  const th = Math.max(1, Math.round(dims.h * scale));

  // Fetch as raw bytes for figma.createImage
  const bytes = await fetchBytes(svgUrl);
  const image = figma.createImage(bytes);

  const rect = figma.createRectangle();
  rect.name = name;
  rect.resize(tw, th);
  rect.fills = [{
    type: "IMAGE",
    scaleMode: "FIT",
    imageHash: image.hash,
  }];
  return rect;
}

// Main import: try vector first, fall back to image
async function createLogoNode(
  svgUrl: string,
  name: string,
  size: number
): Promise<FrameNode | RectangleNode> {
  const svgText = await fetchSVGText(svgUrl);

  // First try: editable vectors via createNodeFromSvg
  try {
    return await tryCreateNodeFromSvg(svgText, name, size);
  } catch (e1) {
    console.warn(`[SVGL] createNodeFromSvg failed for "${name}", falling back to image: ${errMsg(e1)}`);
  }

  // Second try: SVG as image fill — works for ALL SVGs including gradients
  try {
    return await tryCreateImageFromSvg(svgUrl, name, size, svgText);
  } catch (e2) {
    throw new Error(`Both import methods failed. Last error: ${errMsg(e2)}`);
  }
}

// Place a node on the page
function placeNode(node: SceneNode & { width: number; height: number }, placement: "cursor" | "new-page") {
  const sel = figma.currentPage.selection;

  if (sel.length === 1 && sel[0].type === "FRAME") {
    const frame = sel[0] as FrameNode;
    (node as FrameNode).x = (frame.width  - node.width)  / 2;
    (node as FrameNode).y = (frame.height - node.height) / 2;
    frame.appendChild(node);
    return;
  }

  figma.currentPage.appendChild(node);
  if (placement === "cursor") {
    (node as FrameNode).x = figma.viewport.center.x - node.width  / 2;
    (node as FrameNode).y = figma.viewport.center.y - node.height / 2;
  } else {
    (node as FrameNode).x = 100;
    (node as FrameNode).y = 100;
  }
}

// Single import
async function importSingle(payload: {
  svgUrl: string;
  name: string;
  size: number;
  createComponent: boolean;
  placement: "cursor" | "new-page";
}) {
  const { svgUrl, name, size, createComponent, placement } = payload;

  try {
    const node = await createLogoNode(svgUrl, name, size);

    if (createComponent) {
      const comp = figma.createComponent();
      comp.name = name;
      comp.resize(node.width, node.height);
      figma.currentPage.appendChild(comp);

      if (placement === "cursor") {
        comp.x = figma.viewport.center.x - comp.width  / 2;
        comp.y = figma.viewport.center.y - comp.height / 2;
      } else {
        comp.x = 100; comp.y = 100;
      }
      node.x = 0; node.y = 0;
      comp.appendChild(node);
      figma.currentPage.selection = [comp];
      figma.viewport.scrollAndZoomIntoView([comp]);
    } else {
      placeNode(node, placement);
      figma.currentPage.selection = [node];
      figma.viewport.scrollAndZoomIntoView([node]);
    }

    figma.ui.postMessage({ type: "IMPORT_SUCCESS", name });
    figma.notify(`✓ ${name} imported`);

  } catch (err) {
    const detail = errMsg(err);
    figma.ui.postMessage({ type: "IMPORT_ERROR", name, error: detail });
    figma.notify(`Failed: ${name}`, { error: true });
    console.error(`[SVGL] "${name}": ${detail}`);
  }
}

// Batch import
async function importBatch(payload: {
  logos: Array<{ svgUrl: string; name: string }>;
  size: number;
  layout: "grid" | "row";
  columns: number;
  spacing: number;
  placement: "cursor" | "new-page";
}) {
  const { logos, size, layout, columns, spacing, placement } = payload;
  const nodes: (FrameNode | RectangleNode)[] = [];
  const failed: string[] = [];

  for (const logo of logos) {
    try {
      const node = await createLogoNode(logo.svgUrl, logo.name, size);
      nodes.push(node);
    } catch (err) {
      failed.push(logo.name);
      console.error(`[SVGL] batch "${logo.name}": ${errMsg(err)}`);
    }
  }

  if (nodes.length === 0) {
    figma.ui.postMessage({ type: "BATCH_ERROR", error: "All imports failed" });
    figma.notify("Batch import failed", { error: true });
    return;
  }

  const cols  = layout === "row" ? nodes.length : columns;
  const gridW = cols  * (size + spacing) - spacing;
  const gridH = Math.ceil(nodes.length / cols) * (size + spacing) - spacing;
  const baseX = (placement === "cursor" ? figma.viewport.center.x : 100 + gridW / 2) - gridW / 2;
  const baseY = (placement === "cursor" ? figma.viewport.center.y : 100 + gridH / 2) - gridH / 2;

  nodes.forEach((node, i) => {
    const col = layout === "row" ? i : i % cols;
    const row = layout === "row" ? 0 : Math.floor(i / cols);
    node.x = baseX + col * (size + spacing);
    node.y = baseY + row * (size + spacing);
    figma.currentPage.appendChild(node);
  });

  figma.currentPage.selection = nodes;
  figma.viewport.scrollAndZoomIntoView(nodes);
  figma.ui.postMessage({ type: "BATCH_SUCCESS", count: nodes.length });
  figma.notify(
    failed.length > 0
      ? `${nodes.length} imported, ${failed.length} failed`
      : `${nodes.length} logos imported`
  );
}

// Safe error message extraction
function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try { return JSON.stringify(e); } catch { return "Unknown error"; }
}
