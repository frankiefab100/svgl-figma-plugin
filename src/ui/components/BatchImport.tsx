import React, { useState } from "react";
import type { SVGLogo } from "../../types/svgl";
import { resolveLogoUrl } from "../lib/api";
import { getSettings } from "../lib/storage";

interface BatchOpts {
  logos: Array<{ svgUrl: string; name: string }>;
  size: number; layout: "grid" | "row"; columns: number;
  spacing: number; placement: "cursor" | "new-page";
}

interface Props {
  selected: Map<number, SVGLogo>;
  onImport: (opts: BatchOpts) => void;
  onClear: () => void;
  onRemove: (id: number) => void;
}

export function BatchImport({ selected, onImport, onClear, onRemove }: Props) {
  const cfg = getSettings();
  const [layout, setLayout] = useState<"grid" | "row">("grid");
  const [cols, setCols] = useState(3);
  const [spacing, setSpacing] = useState(24);
  const [size, setSize] = useState(cfg.defaultSize);
  const [placement, setPlacement] = useState(cfg.placement);

  const logos = Array.from(selected.values());

  function go() {
    onImport({
      logos: logos.map((l) => ({ svgUrl: resolveLogoUrl(l.route, "light"), name: l.title })),
      size, layout, columns: cols, spacing, placement,
    });
  }

  return (
    <div style={s.wrap} className="animate-in">
      <div style={s.header}>
        <span style={s.title}>Batch Import</span>
        <span style={s.sub}>Select multiple logos and import at once.</span>
      </div>

      {/* Count + clear */}
      <div style={s.countRow}>
        <span style={s.badge}>{logos.length} selected</span>
        <button onClick={onClear} style={s.clearBtn}>Clear</button>
      </div>

      {/* Selected chips */}
      <div style={s.chips}>
        {logos.map((l) => (
          <div key={l.id} style={s.chip}>
            <img src={resolveLogoUrl(l.route, "light")} alt={l.title} style={s.chipImg} />
            <span style={s.chipName}>{l.title}</span>
            <button onClick={() => onRemove(l.id)} style={s.chipX}>
              <svg viewBox="0 0 10 10" width="8" height="8" fill="none">
                <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div style={s.divider} />

      {/* Settings */}
      <div style={s.section}>
        <span style={s.sLabel}>Import Settings</span>

        <Row label="Layout">
          <Toggle opts={[["grid","Grid"],["row","Row"]]} value={layout} onChange={setLayout as any} />
        </Row>

        {layout === "grid" && (
          <Row label="Columns">
            <select value={cols} onChange={(e) => setCols(+e.target.value)} style={s.select}>
              {[2,3,4,5,6].map((n) => <option key={n}>{n}</option>)}
            </select>
          </Row>
        )}

        <Row label="Spacing / Logo size">
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <input type="number" value={spacing} min={0} max={200}
              onChange={(e) => setSpacing(+e.target.value)} style={s.num} />
            <span style={s.unit}>px</span>
            <input type="number" value={size} min={16} max={256}
              onChange={(e) => setSize(+e.target.value)} style={s.num} />
            <span style={s.unit}>px</span>
          </div>
        </Row>

        <Row label="Placement">
          <Toggle opts={[["cursor","At cursor"],["new-page","New page"]]} value={placement} onChange={setPlacement as any} />
        </Row>
      </div>

      <button onClick={go} disabled={!logos.length}
        style={{ ...s.importBtn, ...(logos.length === 0 ? { opacity: 0.4, cursor: "not-allowed" } : {}) }}>
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
          <path d="M8 2v9M4 8l4 4 4-4M2 14h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Import Selected ({logos.length})
      </button>

      <p style={s.disclaimer}>
        Logos are imported as editable SVGs.<br />Please verify usage rights before commercial use.
      </p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <span style={{ fontSize: 11, color: "var(--text2)", flexShrink: 0 }}>{label}</span>
      {children}
    </div>
  );
}

function Toggle<T extends string>({ opts, value, onChange }: {
  opts: [T, string][]; value: T; onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
      {opts.map(([v, label]) => (
        <button key={v} onClick={() => onChange(v)}
          style={{
            border: "none", background: value === v ? "var(--accent)" : "transparent",
            color: value === v ? "white" : "var(--text2)",
            fontSize: 11, fontFamily: "var(--font)", padding: "4px 10px", cursor: "pointer",
            fontWeight: value === v ? 600 : 400,
          }}>
          {label}
        </button>
      ))}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" },
  header: { padding: "12px 12px 8px", borderBottom: "1px solid var(--border)", flexShrink: 0 },
  title: { display: "block", fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 2 },
  sub: { display: "block", fontSize: 11, color: "var(--text3)" },
  countRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "8px 12px", flexShrink: 0,
  },
  badge: {
    fontSize: 11, fontWeight: 600, color: "var(--accent)",
    background: "rgba(13,153,255,0.12)", padding: "2px 8px", borderRadius: 100,
  },
  clearBtn: {
    border: "none", background: "transparent", color: "var(--text2)",
    fontSize: 11, fontFamily: "var(--font)", cursor: "pointer",
  },
  chips: {
    display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6,
    padding: "0 12px 8px", flexShrink: 0,
  },
  chip: {
    position: "relative", display: "flex", flexDirection: "column",
    alignItems: "center", gap: 4, padding: "8px 4px 6px",
    border: "1px solid var(--border)", borderRadius: "var(--radius)",
    background: "var(--surface)",
  },
  chipImg: { width: 36, height: 36, objectFit: "contain" },
  chipName: {
    fontSize: 10, color: "var(--text2)", textAlign: "center",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%",
  },
  chipX: {
    position: "absolute", top: 2, right: 2, border: "none",
    background: "transparent", cursor: "pointer", color: "var(--text3)",
    display: "flex", padding: 2, borderRadius: 3,
  },
  divider: { height: 1, background: "var(--border)", flexShrink: 0 },
  section: { padding: "10px 12px", display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 },
  sLabel: { fontSize: 11, fontWeight: 600, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.05em" },
  select: {
    border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
    background: "var(--surface)", color: "var(--text)", fontSize: 11,
    fontFamily: "var(--font)", padding: "3px 6px",
  },
  num: {
    width: 44, border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
    background: "var(--surface)", color: "var(--text)", fontSize: 11,
    fontFamily: "var(--font)", padding: "3px 6px", textAlign: "center",
  },
  unit: { fontSize: 11, color: "var(--text3)" },
  importBtn: {
    margin: "6px 12px 8px", padding: 9, background: "var(--accent)", color: "white",
    border: "none", borderRadius: "var(--radius)", fontSize: 13, fontWeight: 600,
    fontFamily: "var(--font)", cursor: "pointer", display: "flex",
    alignItems: "center", justifyContent: "center", gap: 6, flexShrink: 0,
  },
  disclaimer: {
    padding: "0 12px 14px", fontSize: 10, color: "var(--text3)",
    lineHeight: "16px", textAlign: "center", flexShrink: 0,
  },
};
