import type { SVGLogo, ImportSettings } from "../../types/svgl";

const RECENT_KEY = "svgl_recent";
const FAVORITES_KEY = "svgl_favorites";
const SETTINGS_KEY = "svgl_settings";
const MAX_RECENT = 20;

// Defaults
export const DEFAULT_SETTINGS: ImportSettings = {
  defaultSize: 48,
  importMode: "svg",
  placement: "cursor",
  cacheEnabled: true,
};

// In-memory caches to guarantee synchronous reads never throw or block
let _recentCache: SVGLogo[] = [];
let _favoritesCache: number[] = [];
let _settingsCache: ImportSettings = { ...DEFAULT_SETTINGS };

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // Figma iframe or sandboxed security restriction
  }
  return null;
}

function safeSetItem(key: string, val: string): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, val);
    }
  } catch {
    // Figma iframe or sandboxed security restriction
  }
}

// Initial bootstrap attempt from localStorage if accessible
try {
  const r = safeGetItem(RECENT_KEY);
  if (r) _recentCache = JSON.parse(r);
  const f = safeGetItem(FAVORITES_KEY);
  if (f) _favoritesCache = JSON.parse(f);
  const s = safeGetItem(SETTINGS_KEY);
  if (s) _settingsCache = { ...DEFAULT_SETTINGS, ...JSON.parse(s) };
} catch { }

// Initialize caches from Figma clientStorage
export function initStorage(data: {
  recent?: SVGLogo[];
  favorites?: number[];
  settings?: ImportSettings | null;
}) {
  if (Array.isArray(data.recent)) {
    _recentCache = data.recent;
    safeSetItem(RECENT_KEY, JSON.stringify(_recentCache));
  }
  if (Array.isArray(data.favorites)) {
    _favoritesCache = data.favorites;
    safeSetItem(FAVORITES_KEY, JSON.stringify(_favoritesCache));
  }
  if (data.settings) {
    _settingsCache = { ...DEFAULT_SETTINGS, ...data.settings };
    safeSetItem(SETTINGS_KEY, JSON.stringify(_settingsCache));
  }
}

// Recent
export function getRecentLogos(): SVGLogo[] {
  return _recentCache;
}

export function updateRecentCache(list: SVGLogo[]): SVGLogo[] {
  _recentCache = list.slice(0, MAX_RECENT);
  safeSetItem(RECENT_KEY, JSON.stringify(_recentCache));
  return _recentCache;
}

export function addRecentLogo(logo: SVGLogo): SVGLogo[] {
  const list = _recentCache.filter((r) => r.id !== logo.id);
  list.unshift(logo);
  return updateRecentCache(list);
}

export function clearRecentLogos(): void {
  _recentCache = [];
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(RECENT_KEY);
    }
  } catch { }
}

// Favorites
export function getFavoriteIds(): number[] {
  return _favoritesCache;
}

export function updateFavoritesCache(ids: number[]): number[] {
  _favoritesCache = ids;
  safeSetItem(FAVORITES_KEY, JSON.stringify(_favoritesCache));
  return _favoritesCache;
}

export function isFavorite(id: number): boolean {
  return _favoritesCache.includes(id);
}

export function toggleFavorite(id: number): boolean {
  const idx = _favoritesCache.indexOf(id);
  const next = [..._favoritesCache];
  if (idx === -1) {
    next.push(id);
    updateFavoritesCache(next);
    return true;
  }
  next.splice(idx, 1);
  updateFavoritesCache(next);
  return false;
}

// Settings
export function getSettings(): ImportSettings {
  return _settingsCache;
}

export function updateSettingsCache(s: ImportSettings): ImportSettings {
  _settingsCache = { ...DEFAULT_SETTINGS, ...s };
  safeSetItem(SETTINGS_KEY, JSON.stringify(_settingsCache));
  return _settingsCache;
}

export function saveSettings(s: ImportSettings): void {
  updateSettingsCache(s);
}
