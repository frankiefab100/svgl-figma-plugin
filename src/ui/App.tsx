import React, { useState, useEffect } from "react";
import type { SVGLogo, ImportSettings } from "../types/svgl";
import type { PluginToUIMessage } from "../plugin/messages";
import { resolveLogoUrl, sendToPlugin } from "./lib/api";
import {
  getRecentLogos,
  getFavoriteIds,
  updateFavoritesCache,
  updateRecentCache,
  updateSettingsCache,
  clearRecentLogos,
  DEFAULT_SETTINGS,
} from "./lib/storage";
import { useLogos } from "./hooks/useLogos";

import { SearchBar } from "./components/SearchBar";
import { CategoryTabs } from "./components/CategoryTabs";
import { LogoGrid } from "./components/LogoGrid";
import { LogoPreview } from "./components/LogoPreview";
import { BatchImport } from "./components/BatchImport";
import { SettingsPanel } from "./components/SettingsPanel";
import { EmptyState } from "./components/EmptyState";
import { ToastContainer, showToast } from "./components/Toast";

type View = "main" | "preview" | "batch" | "settings";
type Filter = "all" | "recent" | "favorites";

export default function App() {
  const {
    logos,
    allLogos,
    categories,
    query,
    setQuery,
    activeCategory,
    setActiveCategory,
    isLoading,
    isEmpty,
    error,
    retry,
  } = useLogos();

  const [view, setView] = useState<View>("main");
  const [preview, setPreview] = useState<SVGLogo | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [recent, setRecent] = useState<SVGLogo[]>(() => getRecentLogos());
  const [favIds, setFavIds] = useState<number[]>(() => getFavoriteIds());

  // Request storage from Figma clientStorage on mount
  useEffect(() => {
    sendToPlugin({ type: "GET_STORAGE" });
  }, []);
  const [batchMap, setBatchMap] = useState<Map<number, SVGLogo>>(new Map());
  const [batchMode, setBatchMode] = useState(false);
  const [importing, setImporting] = useState(false);
  // Global theme settings
  const [cfg, setCfg] = useState<ImportSettings>(() => ({
    ...DEFAULT_SETTINGS,
    theme: "light",
  }));
  // Apply theme to document root
  useEffect(() => {
    document.documentElement.dataset.theme = cfg.theme ?? "light";
  }, [cfg.theme]);

  /* listen for replies from code.ts */
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const msg = e.data?.pluginMessage as PluginToUIMessage | undefined;
      if (!msg) return;

      setImporting(false);

      switch (msg.type) {
        case "STORAGE_LOADED":
          if (msg.payload) {
            if (Array.isArray(msg.payload.favorites)) {
              setFavIds(msg.payload.favorites);
              updateFavoritesCache(msg.payload.favorites);
            }
            if (Array.isArray(msg.payload.recent)) {
              setRecent(msg.payload.recent as SVGLogo[]);
              updateRecentCache(msg.payload.recent as SVGLogo[]);
            }
            if (msg.payload.settings) {
              const newSettings = msg.payload.settings as ImportSettings;
              updateSettingsCache(newSettings);
              setCfg((prev) => ({ ...prev, ...newSettings }));
            }
          }
          break;
        case "IMPORT_SUCCESS":
          showToast(`${msg.name} imported`);
          break;
        case "IMPORT_ERROR":
          // Show the real error detail so it's visible in the UI
          showToast(`Failed: ${msg.error || msg.name}`, "error");
          break;
        case "BATCH_SUCCESS":
          showToast(`${msg.count} logos imported`);
          setBatchMap(new Map());
          setBatchMode(false);
          setView("main");
          break;
        case "BATCH_ERROR":
          showToast("Batch import failed", "error");
          break;
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  /* keyboard shortcuts */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (view !== "main") {
          setView("main");
          return;
        }
        if (batchMode) {
          setBatchMode(false);
          setBatchMap(new Map());
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, batchMode]);

  /* storage actions */
  function handleToggleFavorite(id: number) {
    setFavIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((favId) => favId !== id)
        : [...prev, id];
      updateFavoritesCache(next);
      sendToPlugin({ type: "SET_FAVORITES", favorites: next });
      return next;
    });
  }

  function handleAddRecent(logo: SVGLogo) {
    setRecent((prev) => {
      const filtered = prev.filter((l) => l.id !== logo.id);
      const next = [logo, ...filtered].slice(0, 20);
      updateRecentCache(next);
      sendToPlugin({ type: "SET_RECENT", recent: next });
      return next;
    });
  }

  function handleClearRecent() {
    setRecent([]);
    clearRecentLogos();
    sendToPlugin({ type: "SET_RECENT", recent: [] });
  }

  /* actions */
  function openPreview(logo: SVGLogo) {
    if (batchMode) {
      toggleBatch(logo);
      return;
    }
    setPreview(logo);
    setView("preview");
  }

  function quickImport(logo: SVGLogo) {
    handleAddRecent(logo);
    setImporting(true);
    sendToPlugin({
      type: "IMPORT_LOGO",
      payload: {
        svgUrl: resolveLogoUrl(logo.route, "light"),
        name: logo.title,
        size: 48,
        createComponent: false,
        placement: "cursor",
      },
    });
  }

  function importFromPreview(opts: {
    svgUrl: string;
    name: string;
    size: number;
    createComponent: boolean;
    placement: "cursor" | "new-page";
  }) {
    if (preview) {
      handleAddRecent(preview);
    }
    setImporting(true);
    sendToPlugin({ type: "IMPORT_LOGO", payload: opts });
  }

  function importBatch(opts: {
    logos: Array<{ svgUrl: string; name: string }>;
    size: number;
    layout: "grid" | "row";
    columns: number;
    spacing: number;
    placement: "cursor" | "new-page";
  }) {
    setImporting(true);
    Array.from(batchMap.values()).forEach(handleAddRecent);
    sendToPlugin({ type: "IMPORT_LOGOS_BATCH", payload: opts });
  }

  function toggleBatch(logo: SVGLogo) {
    setBatchMap((prev) => {
      const m = new Map(prev);
      m.has(logo.id) ? m.delete(logo.id) : m.set(logo.id, logo);
      return m;
    });
  }

  /* which list to show */
  const displayed: SVGLogo[] = (() => {
    if (filter === "recent") return recent;
    if (filter === "favorites")
      return allLogos.filter((l) => favIds.includes(l.id));
    return logos;
  })();

  /* sub-views */
  if (view === "preview" && preview)
    return (
      <div style={lay.root}>
        <LogoPreview
          logo={preview}
          isFav={favIds.includes(preview.id)}
          onToggleFav={() => handleToggleFavorite(preview.id)}
          onBack={() => setView("main")}
          onImport={importFromPreview}
        />
        <ToastContainer />
      </div>
    );

  if (view === "batch")
    return (
      <div style={lay.root}>
        <BatchImport
          selected={batchMap}
          onImport={importBatch}
          onClear={() => setBatchMap(new Map())}
          onRemove={(id) =>
            setBatchMap((m) => {
              const n = new Map(m);
              n.delete(id);
              return n;
            })
          }
        />
        <ToastContainer />
      </div>
    );

  if (view === "settings")
    return (
      <div style={lay.root}>
        <SettingsPanel onClose={() => setView("main")} />
        <ToastContainer />
      </div>
    );

  /* main view */
  return (
    <div style={lay.root}>
      {/* Header */}
      <div style={lay.header}>
        <div style={lay.brand}>
          <div style={lay.logoBox}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <rect
                x="2"
                y="2"
                width="9"
                height="9"
                rx="2"
                fill="var(--accent)"
              />
              <rect
                x="13"
                y="2"
                width="9"
                height="9"
                rx="2"
                fill="var(--accent)"
                opacity="0.6"
              />
              <rect
                x="2"
                y="13"
                width="9"
                height="9"
                rx="2"
                fill="var(--accent)"
                opacity="0.6"
              />
              <rect
                x="13"
                y="13"
                width="9"
                height="9"
                rx="2"
                fill="var(--accent)"
                opacity="0.3"
              />
            </svg>
          </div>
          <div>
            <div style={lay.brandName}>SVGL</div>
            <div style={lay.brandSub}>Open source logos.</div>
          </div>
        </div>

        <div style={lay.actions}>
          {/* Batch toggle */}
          <IconBtn
            active={batchMode}
            title={
              batchMode
                ? batchMap.size > 0
                  ? `View ${batchMap.size}`
                  : "Exit batch"
                : "Batch import"
            }
            onClick={() =>
              batchMode && batchMap.size > 0
                ? setView("batch")
                : setBatchMode((b) => !b)
            }
          >
            {batchMode && batchMap.size > 0 ? (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--accent)",
                }}
              >
                {batchMap.size}
              </span>
            ) : (
              <MultipleIcon />
            )}
          </IconBtn>

          {/* Settings */}
          <IconBtn title="Settings" onClick={() => setView("settings")}>
            <SettingsIcon />
          </IconBtn>

          {/* Theme toggle */}
          <IconBtn
            title={cfg?.theme === "dark" ? "Light mode" : "Dark mode"}
            onClick={() => {
              const newTheme = cfg?.theme === "dark" ? "light" : "dark";
              setCfg((prev) => ({ ...prev, theme: newTheme }));
              sendToPlugin({
                type: "SET_SETTINGS",
                settings: { theme: newTheme },
              });
            }}
          >
            {cfg?.theme === "dark" ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            ) : (
              <svg
                xmlns="http://w3.org"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="4" fill="none" />
                <line x1="12" y1="2" x2="12" y2="4" />
                <line x1="12" y1="20" x2="12" y2="22" />
                <line x1="2" y1="12" x2="4" y2="12" />
                <line x1="20" y1="12" x2="22" y2="12" />
                <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
                <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
                <line x1="2.00" y1="19.07" x2="4.93" y2="16.14" />
                <line x1="19.07" y1="4.93" x2="16.14" y2="7.86" />
              </svg>
            )}
          </IconBtn>
        </div>
      </div>

      {/* Batch banner */}
      {batchMode && (
        <div style={lay.batchBanner}>
          <span>Select logos to batch import</span>
          {batchMap.size > 0 && (
            <button onClick={() => setView("batch")} style={lay.batchGo}>
              View {batchMap.size} →
            </button>
          )}
          <button
            onClick={() => {
              setBatchMode(false);
              setBatchMap(new Map());
            }}
            style={lay.batchCancel}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Search */}
      <div style={lay.padX}>
        <SearchBar
          value={query}
          onChange={(v) => {
            setQuery(v);
            setFilter("all");
          }}
          autoFocus
        />
      </div>

      {/* Category tabs */}
      <div style={lay.padX}>
        <CategoryTabs
          categories={categories}
          active={activeCategory}
          onChange={(c) => {
            setActiveCategory(c);
            setFilter("all");
            setQuery("");
          }}
        />
      </div>

      {/* Filter row */}
      <div style={lay.filterRow}>
        {(["all", "recent", "favorites"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              if (f !== "all") {
                setQuery("");
                setActiveCategory("All");
              }
            }}
            style={{ ...lay.filterBtn, ...(filter === f ? lay.filterOn : {}) }}
          >
            {f === "all"
              ? "All Logos"
              : f === "recent"
                ? recent.length > 0
                  ? `Recent (${recent.length})`
                  : "Recent"
                : favIds.length > 0
                  ? `Favorites (${favIds.length})`
                  : "Favorites"}
          </button>
        ))}

        {/* refresh favorites badge */}
        {filter === "favorites" && (
          <button
            onClick={() => sendToPlugin({ type: "GET_STORAGE" })}
            style={lay.refreshBtn}
            title="Sync favorites"
          >
            ↻
          </button>
        )}

        {filter === "recent" && recent.length > 0 && (
          <button onClick={handleClearRecent} style={lay.clearBtn}>
            Clear
          </button>
        )}
      </div>

      {/* Count */}
      {!isLoading && !error && filter === "all" && logos.length > 0 && (
        <div style={lay.count}>{logos.length.toLocaleString()} logos</div>
      )}

      {/* Logo grid / states */}
      <div style={lay.scroll}>
        {error ? (
          <EmptyState type="network-error" onRetry={retry} />
        ) : filter === "favorites" && displayed.length === 0 ? (
          <EmptyState type="no-favorites" />
        ) : isEmpty ||
          (filter !== "all" && displayed.length === 0 && !isLoading) ? (
          <EmptyState
            type="no-results"
            query={query}
            onClear={() => setQuery("")}
          />
        ) : (
          <LogoGrid
            logos={displayed}
            loading={isLoading && filter === "all"}
            selected={preview}
            favIds={favIds}
            onToggleFavorite={handleToggleFavorite}
            onSelect={openPreview}
            onImport={quickImport}
            batchMode={batchMode}
            batchSelected={new Set(batchMap.keys())}
            onToggleBatch={toggleBatch}
          />
        )}
      </div>

      {/* Footer */}
      <div style={lay.footer}>
        <span>
          <a href="https://svgl.app" style={lay.fLink}>
            View source
          </a>
          {" · "}
          <a href="https://github.com/pheralb/svgl/issues" style={lay.fLink}>
            Report issue
          </a>
        </span>
        <span>v1.0.0</span>
      </div>

      {/* Importing overlay */}
      {importing && (
        <div style={lay.overlay}>
          <div style={lay.spinner} />
        </div>
      )}

      <ToastContainer />
    </div>
  );
}

/* tiny icon button component */
function IconBtn({
  children,
  onClick,
  title,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
        borderRadius: "var(--radius-sm)",
        background: active ? "rgba(13,153,255,0.10)" : "var(--surface)",
        color: active ? "var(--accent)" : "var(--text2)",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function MultipleIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
      <rect
        x="5"
        y="1"
        width="10"
        height="10"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeDasharray="2 1"
        opacity="0.7"
      />
      <rect
        x="1"
        y="5"
        width="10"
        height="10"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.3"
        fill="none"
      />
      <path
        d="M4 10h4M6 8v4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
    >
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </svg>
  );
}

/* layout styles */
const lay: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    overflow: "hidden",
    background: "var(--bg)",
    color: "var(--text)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px 8px",
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
    gap: 8,
  },
  brand: { display: "flex", alignItems: "center", gap: 8, minWidth: 0 },
  logoBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    flexShrink: 0,
    background: "var(--bg2)",
    border: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    fontSize: 13,
    fontWeight: 700,
    color: "var(--text)",
    lineHeight: "16px",
  },
  brandSub: { fontSize: 10, color: "var(--text3)", lineHeight: "13px" },
  actions: { display: "flex", alignItems: "center", gap: 4, flexShrink: 0 },

  batchBanner: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "5px 12px",
    fontSize: 11,
    background: "rgba(13,153,255,0.08)",
    borderBottom: "1px solid rgba(13,153,255,0.18)",
    color: "var(--accent)",
    flexShrink: 0,
  },
  batchGo: {
    marginLeft: "auto",
    border: "none",
    background: "var(--accent)",
    color: "white",
    fontSize: 10,
    fontWeight: 600,
    fontFamily: "var(--font)",
    padding: "2px 8px",
    borderRadius: 100,
    cursor: "pointer",
  },
  batchCancel: {
    border: "none",
    background: "transparent",
    color: "var(--accent)",
    fontSize: 10,
    fontFamily: "var(--font)",
    cursor: "pointer",
    padding: "2px 4px",
  },

  padX: { padding: "6px 12px 0", flexShrink: 0 },

  filterRow: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    padding: "6px 12px 0",
    flexShrink: 0,
  },
  filterBtn: {
    border: "none",
    background: "transparent",
    color: "var(--text3)",
    fontSize: 11,
    fontFamily: "var(--font)",
    cursor: "pointer",
    padding: "3px 4px",
    borderBottom: "2px solid transparent",
  },
  filterOn: {
    color: "var(--text)",
    borderBottomColor: "var(--accent)",
    fontWeight: 600,
  },
  refreshBtn: {
    border: "none",
    background: "transparent",
    color: "var(--text3)",
    fontSize: 13,
    cursor: "pointer",
    padding: "0 4px",
    lineHeight: 1,
  },
  clearBtn: {
    marginLeft: "auto",
    border: "none",
    background: "transparent",
    color: "var(--text3)",
    fontSize: 10,
    fontFamily: "var(--font)",
    cursor: "pointer",
  },
  count: {
    padding: "4px 12px 0",
    fontSize: 10,
    color: "var(--text3)",
    flexShrink: 0,
  },
  scroll: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    padding: "0 10px",
  },

  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 12px",
    borderTop: "1px solid var(--border)",
    fontSize: 10,
    color: "var(--text3)",
    flexShrink: 0,
  },
  fLink: { color: "var(--accent)", textDecoration: "none" },

  overlay: {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.15)",
    zIndex: 999,
    pointerEvents: "none",
  },
  spinner: {
    width: 20,
    height: 20,
    border: "2.5px solid var(--border)",
    borderTopColor: "var(--accent)",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
};
