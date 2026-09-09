/// <reference types="@figma/plugin-typings" />

import { API, errMsg, getSVGDimensions, placeNode, sanitizeSVG, toCdnUrl, toRawGithubUrl } from "../ui/lib/api";
import type { UIToPluginMessage } from "./messages";

figma.showUI(__html__, {
  width: 340,
  height: 560,
  themeColors: true,
  title: "SVGL Logos for Figma",
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
    case "IMPORT_LOGO_DROP":
      await importByCoord(msg.payload);
      break;
    case "IMPORT_LOGOS_BATCH":
      await importBatch(msg.payload);
      break;
    case "GET_STORAGE":
      await loadStorage();
      break;
    case "SET_FAVORITES":
      try {
        await figma.clientStorage.setAsync("svgl_favorites", msg.favorites);
      } catch (e) {
        console.warn("Failed to save favorites:", e);
      }
      break;
    case "SET_RECENT":
      try {
        await figma.clientStorage.setAsync("svgl_recent", msg.recent);
      } catch (e) {
        console.warn("Failed to save recent:", e);
      }
      break;
    case "SET_SETTINGS":
      try {
        await figma.clientStorage.setAsync("svgl_settings", msg.settings);
      } catch (e) {
        console.warn("Failed to save settings:", e);
      }
      break;
    case "CLOSE":
      figma.closePlugin();
      break;
  }
};

// Drop handler (drag from plugin UI → Figma canvas)
// Accepts drops via three paths, ordered by reliability:
//   1. dropMetadata.svgUrl via official pluginDrop bridge  → create via CDN fetch
//   2. items[].data  ('image/svg+xml') via hosted UI bridge → createNodeFromSvg directly
//   3. files[0]      ('image/svg+xml') via icon-drag-and-drop → getTextAsync + createNodeFromSvg
// If any path succeeds, we finalize placement at absoluteX/absoluteY.
figma.on('drop', (event: DropEvent) => {
  const { dropMetadata, absoluteX, absoluteY, items, files } = event;

  //  Path 1: structured drop metadata (main approach) 
  if (dropMetadata && typeof dropMetadata === 'object') {
    const meta = dropMetadata as { svgUrl?: string; name?: string; size?: number };
    if (meta.svgUrl && meta.name) {
      const size = meta.size || 48;
      createLogoNode(meta.svgUrl, meta.name, size)
        .then((node) => {
          node.x = absoluteX - node.width / 2;
          node.y = absoluteY - node.height / 2;
          figma.currentPage.appendChild(node);
          figma.currentPage.selection = [node];
          figma.viewport.scrollAndZoomIntoView([node]);
          figma.ui.postMessage({ type: "IMPORT_SUCCESS", name: meta.name! });
          figma.notify(`✓ ${meta.name} imported`);
        })
        .catch((err) => {
          const detail = errMsg(err);
          figma.ui.postMessage({ type: "IMPORT_ERROR", name: meta.name!, error: detail });
          figma.notify(`Failed: ${meta.name}`, { error: true });
        });
      return false;
    }
  }

  //  Path 2: DataTransferItem SVG string (hosted-iframe bridge) 
  if (items && items.length > 0) {
    for (const it of items) {
      if (it.type === 'image/svg+xml' && typeof it.data === 'string' && it.data.includes('<svg')) {
        try {
          const node = figma.createNodeFromSvg(it.data);
          node.name = (dropMetadata as any)?.name || "SVG Logo";
          const w = node.width || 48;
          const h = node.height || 48;
          const scale = 48 / Math.max(w, h);
          if (scale < 1) node.resize(Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale)));
          node.x = absoluteX - node.width / 2;
          node.y = absoluteY - node.height / 2;
          figma.currentPage.appendChild(node);
          figma.currentPage.selection = [node];
          figma.viewport.scrollAndZoomIntoView([node]);
          figma.notify(`✓ ${node.name} imported`);
          return false;
        } catch (_) { /* continue to next path */ }
      }
    }
  }

  //  Path 3: File SVG (icon-drag-and-drop approach) 
  if (files && files.length > 0 && files[0].type === 'image/svg+xml') {
    files[0].getTextAsync().then((text) => {
      if (!text || !text.includes("<svg")) return;
      try {
        const node = figma.createNodeFromSvg(text);
        node.name = (dropMetadata as any)?.name || "SVG Logo";
        const w = node.width || 48;
        const h = node.height || 48;
        const scale = 48 / Math.max(w, h);
        if (scale < 1) node.resize(Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale)));
        node.x = absoluteX - node.width / 2;
        node.y = absoluteY - node.height / 2;
        figma.currentPage.appendChild(node);
        figma.currentPage.selection = [node];
        figma.viewport.scrollAndZoomIntoView([node]);
        figma.notify(`✓ ${node.name} imported`);
      } catch (err) {
        const detail = errMsg(err);
        figma.notify(`Failed to import SVG`, { error: true });
        console.error("file drop:", detail);
      }
    });
    return false;
  }
  return false;
});

// Storage
async function loadStorage() {
  try {
    const [recent, favorites, settings] = await Promise.all([
      figma.clientStorage.getAsync("svgl_recent"),
      figma.clientStorage.getAsync("svgl_favorites"),
      figma.clientStorage.getAsync("svgl_settings"),
    ]);
    figma.ui.postMessage({
      type: "STORAGE_LOADED",
      payload: {
        recent: Array.isArray(recent) ? recent : [],
        favorites: Array.isArray(favorites) ? favorites : [],
        settings: settings || null,
      },
    });
  } catch (err) {
    console.warn("Failed to load clientStorage:", err);
  }
}

loadStorage();

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

// Fetch SVG with fallbacks
async function fetchSVGText(url: string): Promise<string> {
  const cdnUrl = toCdnUrl(url);

  try {
    const res = await fetch(cdnUrl);
    if (res.ok) {
      const text = await res.text();
      if (text && text.includes("<svg")) return sanitizeSVG(text);
    }
  } catch (err) {
    console.warn(`jsDelivr CDN fetch failed for ${cdnUrl}: ${errMsg(err)}`);
  }

  try {
    const rawUrl = toRawGithubUrl(url);
    const res = await fetch(rawUrl);
    if (res.ok) {
      const text = await res.text();
      if (text && text.includes("<svg")) return sanitizeSVG(text);
    }
  } catch (err) {
    console.warn(`GitHub Raw fetch failed for ${url}: ${errMsg(err)}`);
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (!text || !text.includes("<svg")) throw new Error("Invalid SVG content");
    return sanitizeSVG(text);
  } catch (err) {
    throw new Error(`Failed to fetch SVG: ${errMsg(err)}`);
  }
}

// Node creation
async function tryCreateNodeFromSvg(svgText: string, name: string, size: number): Promise<FrameNode> {
  let node: FrameNode;
  try {
    node = figma.createNodeFromSvg(svgText);
  } catch (e) {
    throw new Error(`SVG parse error: ${errMsg(e)}`);
  }

  node.name = name;

  for (const child of node.children) {
    if ("constraints" in child) {
      child.constraints = { horizontal: "SCALE", vertical: "SCALE" };
    }
  }

  const w = node.width > 0 ? node.width : getSVGDimensions(svgText).w;
  const h = node.height > 0 ? node.height : getSVGDimensions(svgText).h;
  const scale = size / Math.max(w, h);
  const tw = Math.max(1, Math.round(w * scale));
  const th = Math.max(1, Math.round(h * scale));
  node.resize(tw, th);
  return node;
}

async function createLogoNode(svgUrl: string, name: string, size: number): Promise<FrameNode> {
  const svgText = await fetchSVGText(svgUrl);
  return await tryCreateNodeFromSvg(svgText, name, size);
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
    finalizeNode(node, { svgUrl, name, size, createComponent, placement });
    figma.ui.postMessage({ type: "IMPORT_SUCCESS", name });
    figma.notify(`✓ ${name} imported`);
  } catch (err) {
    const detail = errMsg(err);
    figma.ui.postMessage({ type: "IMPORT_ERROR", name, error: detail });
    figma.notify(`Failed: ${name}`, { error: true });
    console.error(`"${name}": ${detail}`);
  }
}

// Place / wrap in component & finish (shared logic)
function finalizeNode(
  node: FrameNode,
  opts: {
    svgUrl: string;
    name: string;
    size: number;
    createComponent: boolean;
    placement: "cursor" | "new-page";
    absX?: number;
    absY?: number;
  },
) {
  const { createComponent, placement } = opts;

  if (createComponent) {
    const comp = figma.createComponent();
    comp.name = node.name;
    comp.resize(node.width, node.height);
    figma.currentPage.appendChild(comp);

    if (opts.absX !== undefined && opts.absY !== undefined) {
      comp.x = opts.absX - comp.width / 2;
      comp.y = opts.absY - comp.height / 2;
    } else if (placement === "cursor") {
      comp.x = figma.viewport.center.x - comp.width / 2;
      comp.y = figma.viewport.center.y - comp.height / 2;
    } else {
      comp.x = 100;
      comp.y = 100;
    }
    node.x = 0;
    node.y = 0;
    comp.appendChild(node);
    figma.currentPage.selection = [comp];
    figma.viewport.scrollAndZoomIntoView([comp]);
    return;
  }

  if (opts.absX !== undefined && opts.absY !== undefined) {
    figma.currentPage.appendChild(node);
    node.x = opts.absX - node.width / 2;
    node.y = opts.absY - node.height / 2;
  } else {
    placeNode(node, placement);
  }
  figma.currentPage.selection = [node];
  figma.viewport.scrollAndZoomIntoView([node]);
}

// Drag-and-drop import using coordinate conversion
async function importByCoord(payload: {
  svgUrl: string;
  name: string;
  size: number;
  createComponent: boolean;
  placement: "cursor" | "new-page";
  x?: number;
  y?: number;
}) {
  const { svgUrl, name, size, createComponent } = payload;
  try {
    const node = await createLogoNode(svgUrl, name, size);

    let absX: number | undefined;
    let absY: number | undefined;

    if (payload.x !== undefined && payload.y !== undefined) {
      // Convert plugin-iframe screen-space coords → Figma canvas coords
      const bounds = figma.viewport.bounds;
      const zoom = figma.viewport.zoom;

      // Try to query window outer size from UI via bounds*zoom estimation
      const canvasPxW = bounds.width * zoom;
      const canvasPxH = bounds.height * zoom;
      // Plugin UI is a 340×560 floating panel hosted inside the Figma window.
      // The drag clientX/Y is relative to the top-left of the iframe. To estimate
      // canvas-space drop, treat the iframe origin as centered horizontally in the
      // window, and offset vertically by the toolbar (~40px) when the UI is docked.
      // Since we don't know the window size precisely, use viewport center as a
      // best effort fallback when the estimate is obviously offscreen.
      const estWinW = Math.max(canvasPxW, 1024);
      const estWinH = Math.max(canvasPxH + 40, 768);
      const uiLeft = Math.round((estWinW - 340) / 2);
      const uiTop = 40 + Math.round(Math.max(0, (estWinH - 40 - 560) / 2));

      const pxFromCanvasLeft = payload.x + uiLeft;
      const pxFromCanvasTop = payload.y + uiTop;

      const cx = bounds.x + pxFromCanvasLeft / zoom;
      const cy = bounds.y + pxFromCanvasTop / zoom;

      // If computed position is wildly inside the visible canvas, use it; otherwise
      // fall back to the viewport center.
      if (
        cx >= bounds.x - 2000 &&
        cx <= bounds.x + bounds.width + 2000 &&
        cy >= bounds.y - 2000 &&
        cy <= bounds.y + bounds.height + 2000
      ) {
        absX = cx;
        absY = cy;
      }
    }

    finalizeNode(node, {
      svgUrl,
      name,
      size,
      createComponent,
      placement: payload.placement,
      absX,
      absY,
    });

    figma.ui.postMessage({ type: "IMPORT_SUCCESS", name });
    figma.notify(`✓ ${name} imported`);
  } catch (err) {
    const detail = errMsg(err);
    figma.ui.postMessage({ type: "IMPORT_ERROR", name, error: detail });
    figma.notify(`Failed: ${name}`, { error: true });
    console.error(`dnd "${name}": ${detail}`);
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
  const nodes: FrameNode[] = [];
  const failed: string[] = [];

  for (const logo of logos) {
    try {
      const node = await createLogoNode(logo.svgUrl, logo.name, size);
      nodes.push(node);
    } catch (err) {
      failed.push(logo.name);
      console.error(`batch "${logo.name}": ${errMsg(err)}`);
    }
  }

  if (nodes.length === 0) {
    figma.ui.postMessage({ type: "BATCH_ERROR", error: "All imports failed" });
    figma.notify("Batch import failed", { error: true });
    return;
  }

  const cols = layout === "row" ? nodes.length : columns;
  const gridW = cols * (size + spacing) - spacing;
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
