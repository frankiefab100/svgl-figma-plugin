import type { DragEvent } from "react";
import { fetchLogoSvg, sendToPlugin } from "./api";

export interface LogoDragPayload {
  id: number;
  svgUrl: string;
  name: string;
  size: number;
  createComponent?: boolean;
  placement?: "cursor" | "new-page";
}

const prefetch = new Map<string, Promise<string>>();

export function prepareLogoDrag(
  e: DragEvent,
  { id, svgUrl, name, size }: Pick<LogoDragPayload, "id" | "svgUrl" | "name" | "size">,
) {
  prefetch.set(svgUrl, fetchLogoSvg(svgUrl));

  e.dataTransfer.effectAllowed = "copyMove";
  e.dataTransfer.dropEffect = "copy";
  e.dataTransfer.setData("text/plain", name);
  e.dataTransfer.setData("text/uri-list", svgUrl);
  e.dataTransfer.setData(
    "application/x-svgl-logo",
    JSON.stringify({ id, svgUrl, name, size }),
  );

  const img = new Image();
  img.src = svgUrl;
  img.width = size;
  img.height = size;
  try {
    e.dataTransfer.setDragImage(img, size / 2, size / 2);
  } catch {
    /* ignore */
  }
}

export async function completeLogoDrag(
  e: DragEvent,
  {
    svgUrl,
    name,
    size,
    createComponent = false,
    placement = "cursor",
  }: LogoDragPayload,
) {
  if ((e.view as unknown as { length: number })?.length === 0) return;

  let svgData: string;
  try {
    svgData = await (prefetch.get(svgUrl) ?? fetchLogoSvg(svgUrl));
  } catch {
    sendToPlugin({
      type: "IMPORT_ERROR",
      name,
      error: "Could not fetch SVG for drag import",
    });
    return;
  } finally {
    prefetch.delete(svgUrl);
  }

  const dropData = {
    pluginDrop: {
      clientX: e.clientX,
      clientY: e.clientY,
      items: [
        {
          type: "image/svg+xml",
          data: svgData,
        },
      ],
      dropMetadata: { name, size, createComponent, placement },
    },
  };

  console.log("[ui] pluginDrop sent items", dropData.pluginDrop);
  parent.postMessage(dropData, "*");
}