/// <reference types="@figma/plugin-typings" />

import { API, errMsg, toCdnUrl, toRawGithubUrl, sanitizeSVG, getSVGDimensions } from "../ui/lib/api";
import type { UIToPluginMessage } from "./messages";

figma.showUI(__html__, {
  width: 340,
  height: 560,
  themeColors: true,
  title: "SVGL Logos for Figma",
});

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

figma.on("drop", handleLogoDrop);

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

interface DropMeta {
  name?: string;
  size?: number;
  createComponent?: boolean;
  placement?: "cursor" | "new-page";
}

async function fetchSVGText(url: string): Promise<string> {
  const candidates = [toCdnUrl(url), toRawGithubUrl(url), url];

  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate);
      if (!res.ok) continue;
      const text = await res.text();
      if (text && text.includes("<svg")) return sanitizeSVG(text);
    } catch {
      /* try next source */
    }
  }

  throw new Error(`Failed to fetch SVG from ${url}`);
}

function createNodeFromSvgText(svgText: string, name: string, size: number): FrameNode {
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
  node.resize(Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale)));
  return node;
}

async function createLogoNode(svgUrl: string, name: string, size: number): Promise<FrameNode> {
  const svgText = await fetchSVGText(svgUrl);
  return createNodeFromSvgText(svgText, name, size);
}

function placeNode(node: FrameNode | ComponentNode, placement: "cursor" | "new-page", absX?: number, absY?: number): void {
  if (absX !== undefined && absY !== undefined) {
    figma.currentPage.appendChild(node);
    node.x = absX - node.width / 2;
    node.y = absY - node.height / 2;
  } else {
    const sel = figma.currentPage.selection;

    if (sel.length === 1 && sel[0].type === "FRAME") {
      const frame = sel[0] as FrameNode;
      node.x = (frame.width - node.width) / 2;
      node.y = (frame.height - node.height) / 2;
      frame.appendChild(node);
      return;
    }

    figma.currentPage.appendChild(node);
    if (placement === "cursor") {
      node.x = figma.viewport.center.x - node.width / 2;
      node.y = figma.viewport.center.y - node.height / 2;
    } else {
      node.x = 100;
      node.y = 100;
    }
  }
  figma.currentPage.selection = [node];
  figma.viewport.scrollAndZoomIntoView([node]);
}

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
      comp.name = node.name;
      comp.resize(node.width, node.height);
      figma.currentPage.appendChild(comp);
      placeNode(comp, placement);
      node.x = 0;
      node.y = 0;
      comp.appendChild(node);
      figma.currentPage.selection = [comp];
      figma.viewport.scrollAndZoomIntoView([comp]);
    } else {
      placeNode(node, placement);
    }

    figma.ui.postMessage({ type: "IMPORT_SUCCESS", name });
    figma.notify(`✓ ${name} imported`);
  } catch (err) {
    const detail = errMsg(err);
    figma.ui.postMessage({ type: "IMPORT_ERROR", name, error: detail });
    figma.notify(`Failed: ${name}`, { error: true });
    console.error(`"${name}": ${detail}`);
  }
}

function handleLogoDrop(event: DropEvent): boolean {
  const { dropMetadata, absoluteX, absoluteY, items } = event;
  const meta = (dropMetadata ?? {}) as DropMeta;

  const item = items?.find(
    (it) =>
      it.type === "image/svg+xml" &&
      typeof it.data === "string" &&
      it.data.includes("<svg"),
  );

  if (!item) return false;

  const name = meta.name ?? "SVG Logo";
  const size = meta.size ?? 48;
  const createComponent = meta.createComponent ?? false;

  // async IIFE
  (async () => {
    try {
      const node = figma.createNodeFromSvg(item.data);
      node.name = name;

      for (const child of node.children) {
        if ("constraints" in child) {
          child.constraints = { horizontal: "SCALE", vertical: "SCALE" };
        }
      }

      const w = node.width > 0 ? node.width : getSVGDimensions(item.data).w;
      const h = node.height > 0 ? node.height : getSVGDimensions(item.data).h;
      const scale = size / Math.max(w, h);
      node.resize(Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale)));

      if (createComponent) {
        const comp = figma.createComponent();
        comp.name = node.name;
        comp.resize(node.width, node.height);
        figma.currentPage.appendChild(comp);

        comp.x = absoluteX - comp.width / 2;
        comp.y = absoluteY - comp.height / 2;

        node.x = 0;
        node.y = 0;
        comp.appendChild(node);

        figma.currentPage.selection = [comp];
      } else {
        figma.currentPage.appendChild(node);
        node.x = absoluteX - node.width / 2;
        node.y = absoluteY - node.height / 2;
        figma.currentPage.selection = [node];
      }

      figma.ui.postMessage({ type: "IMPORT_SUCCESS", name });
      figma.notify(`✓ ${name} imported`);

    } catch (err) {
      const detail = errMsg(err);
      figma.ui.postMessage({ type: "IMPORT_ERROR", name, error: detail });
      figma.notify(`Failed: ${name}`, { error: true });
      console.error(`"${name}": ${detail}`);
    }
  })();

  return true;
}


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
      : `${nodes.length} logos imported`,
  );
}