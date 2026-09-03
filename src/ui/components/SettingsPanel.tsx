import React, { useState } from "react";
import type { ImportSettings } from "../../types/svgl";
import { getSettings, saveSettings } from "../lib/storage";

interface Props { onClose: () => void; }

export function SettingsPanel({ onClose }: Props) {
  const [cfg, setCfg] = useState<ImportSettings>(getSettings);
  const [cleared, setCleared] = useState(false);

  function set<K extends keyof ImportSettings>(k: K, v: ImportSettings[K]) {
    const next = { ...cfg, [k]: v };
    setCfg(next);
    saveSettings(next);
  }

  function clearCache() {
    try { localStorage.removeItem("svgl_logo_cache"); } catch { /* */ }
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  }

  return (
    <div style={s.wrap} className="animate-in">
      {/* Header */}
      <div style={s.header}>
        <span style={s.title}>Settings</span>
        <button onClick={onClose} style={s.closeBtn} aria-label="Close">
          <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div style={s.body}>
        {/* Default size */}
        <Group label="Default Size">
          <div style={s.row}>
            <input type="number" value={cfg.defaultSize} min={16} max={256}
              onChange={(e) => set("defaultSize", +e.target.value)} style={s.numInput} />
            <span style={s.unit}>px</span>
          </div>
        </Group>

        <Divider />

        {/* Import mode */}
        <Group label="Default Import Mode">
          <Radio name="mode" label="Import as SVG (single layer)"
            checked={cfg.importMode === "svg"} onChange={() => set("importMode", "svg")} />
          <Radio name="mode" label="Import as Component"
            checked={cfg.importMode === "component"} onChange={() => set("importMode", "component")} />
        </Group>

        <Divider />

        {/* Placement */}
        <Group label="Default Placement">
          <Radio name="placement" label="At cursor"
            checked={cfg.placement === "cursor"} onChange={() => set("placement", "cursor")} />
          <Radio name="placement" label="On new page"
            checked={cfg.placement === "new-page"} onChange={() => set("placement", "new-page")} />
        </Group>

        <Divider />

        {/* Cache */}
        <Group label="Data & Cache">
          <div style={s.cacheRow}>
            <span style={s.cacheLabel}>Cache logos for faster search</span>
            <ToggleSwitch on={cfg.cacheEnabled} onChange={(v) => set("cacheEnabled", v)} />
          </div>
          <div style={s.cacheRow}>
            <span style={s.cacheLabel}>Clear cache</span>
            <button onClick={clearCache} style={s.actionBtn}>
              {cleared ? "✓ Cleared" : "Refresh Cache"}
            </button>
          </div>
        </Group>

        <Divider />

        {/* About */}
        <Group label="About">
          <div style={s.aboutRow}>
            <span style={s.aboutName}>SVGL</span>
            <span style={s.version}>v1.0.0</span>
          </div>
          <p style={s.aboutText}>
            Powered by{" "}
            <a href="https://svgl.app" style={s.link} target="_blank" rel="noopener noreferrer">
              svgl.app
            </a>
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <a href="https://github.com/pheralb/svgl" style={s.link}>View on GitHub</a>
            <a href="https://github.com/pheralb/svgl/issues" style={s.link}>Report an issue</a>
            <a href="https://svgl.app" style={s.link}>Suggest a logo</a>
          </div>
        </Group>

        <p style={s.footer}>Made with ♥ for the design community.</p>
      </div>
    </div>
  );
}

// helpers 
function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text)" }}>{label}</span>
      {children}
    </div>
  );
}
function Divider() {
  return <div style={{ height: 1, background: "var(--border)" }} />;
}
function Radio({ name, label, checked, onChange }: { name: string; label: string; checked: boolean; onChange: () => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text)", cursor: "pointer" }}>
      <input type="radio" name={name} checked={checked} onChange={onChange}
        style={{ accentColor: "var(--accent)", cursor: "pointer" }} />
      {label}
    </label>
  );
}
function ToggleSwitch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch" aria-checked={on} onClick={() => onChange(!on)}
      style={{
        width: 34, height: 18, borderRadius: 100, border: "none", cursor: "pointer",
        background: on ? "var(--accent)" : "var(--border-strong)",
        position: "relative", flexShrink: 0, padding: 0,
        transition: "background 120ms ease",
      }}>
      <div style={{
        width: 14, height: 14, borderRadius: "50%", background: "white",
        position: "absolute", top: 2,
        left: on ? 18 : 2,
        transition: "left 120ms ease",
        boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
      }} />
    </button>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: "flex", flexDirection: "column", height: "100%" },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "10px 12px", borderBottom: "1px solid var(--border)", flexShrink: 0,
  },
  title: { fontSize: 13, fontWeight: 600, color: "var(--text)" },
  closeBtn: {
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "none", background: "transparent", cursor: "pointer",
    color: "var(--text2)", padding: 4, borderRadius: 4,
  },
  body: { flex: 1, overflowY: "auto" },
  row: { display: "flex", alignItems: "center", gap: 8 },
  numInput: {
    width: 60, border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
    background: "var(--bg2)", color: "var(--text)", fontSize: 12,
    fontFamily: "var(--font)", padding: "4px 8px", outline: "none",
  },
  unit: { fontSize: 11, color: "var(--text3)" },
  cacheRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  cacheLabel: { fontSize: 12, color: "var(--text)" },
  actionBtn: {
    border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)",
    fontSize: 11, fontFamily: "var(--font)", padding: "4px 10px",
    borderRadius: "var(--radius-sm)", cursor: "pointer",
  },
  aboutRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  aboutName: { fontSize: 12, fontWeight: 600, color: "var(--text)" },
  version: { fontSize: 11, color: "var(--text3)" },
  aboutText: { fontSize: 11, color: "var(--text2)" },
  link: { fontSize: 11, color: "var(--accent)", textDecoration: "none" },
  footer: { textAlign: "center", fontSize: 10, color: "var(--text3)", padding: "10px 12px 16px" },
};
