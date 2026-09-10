// UI → Plugin
export type UIToPluginMessage =
  | { type: "FETCH_LOGOS" }
  | { type: "FETCH_CATEGORIES" }
  | { type: "SEARCH_LOGOS"; query: string }
  | { type: "FETCH_CATEGORY"; category: string }
  | {
    type: "IMPORT_LOGO";
    payload: {
      svgUrl: string;
      name: string;
      size: number;
      createComponent: boolean;
      placement: "cursor" | "new-page";
    };
  }
  | { type: "IMPORT_LOGO_DROP"; payload: { svgUrl: string; name: string; size: number; createComponent: boolean; placement: "cursor" | "new-page"; x?: number; y?: number; }; }
  | {
    type: "IMPORT_LOGOS_BATCH";
    payload: {
      logos: Array<{ svgUrl: string; name: string }>;
      size: number;
      layout: "grid" | "row";
      columns: number;
      spacing: number;
      placement: "cursor" | "new-page";
    };
  }
  | { type: "GET_STORAGE" }
  | { type: "SET_FAVORITES"; favorites: number[] }
  | { type: "SET_RECENT"; recent: unknown[] }
  | { type: "SET_SETTINGS"; settings: unknown }
  | { type: "CLOSE" };

// Plugin → UI
export type PluginToUIMessage =
  | { type: "LOGOS_DATA"; logos: unknown[] }
  | { type: "CATEGORIES_DATA"; categories: unknown[] }
  | { type: "LOGOS_ERROR"; error: string }
  | { type: "IMPORT_SUCCESS"; name: string }
  | { type: "IMPORT_ERROR"; name: string; error: string }
  | { type: "BATCH_SUCCESS"; count: number }
  | { type: "BATCH_ERROR"; error: string }
  | {
    type: "STORAGE_LOADED";
    payload: {
      favorites: number[];
      recent: unknown[];
      settings: unknown;
    };
  }
