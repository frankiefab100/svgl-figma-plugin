import type { SVGLogo, ImportSettings } from "../../types/svgl";

const RECENT_KEY = "svgl_recent";
const FAVORITES_KEY = "svgl_favorites";
const SETTINGS_KEY = "svgl_settings";
const MAX_RECENT = 12;

// Recent
export function getRecentLogos(): SVGLogo[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); }
  catch { return []; }
}

export function addRecentLogo(logo: SVGLogo) {
  const list = getRecentLogos().filter((r) => r.id !== logo.id);
  list.unshift(logo);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT))); }
  catch { /* storage full */ }
}

export function clearRecentLogos() {
  localStorage.removeItem(RECENT_KEY);
}

// Favorites
export function getFavoriteIds(): number[] {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]"); }
  catch { return []; }
}

export function toggleFavorite(id: number): boolean {
  const favs = getFavoriteIds();
  const idx = favs.indexOf(id);
  if (idx === -1) {
    favs.push(id);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    return true;
  }
  favs.splice(idx, 1);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  return false;
}

export function isFavorite(id: number): boolean {
  return getFavoriteIds().includes(id);
}

// Settings
const DEFAULTS: ImportSettings = {
  defaultSize: 48,
  importMode: "svg",
  placement: "cursor",
  cacheEnabled: true,
};

export function getSettings(): ImportSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch { return DEFAULTS; }
}

export function saveSettings(s: ImportSettings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }
  catch { /* ignore */ }
}
