import React from "react";
import type { Category } from "../../types/svgl";

const PINNED = ["All", "Tech", "Social", "Brands", "Countries"];

interface Props {
  categories: Category[];
  active: string;
  onChange: (cat: string) => void;
}

export function CategoryTabs({ categories, active, onChange }: Props) {
  const names = categories.map((c) => c.category);
  const pinned = PINNED.filter((p) => p === "All" || names.includes(p));
  const extras = names.filter((n) => !PINNED.includes(n)).sort();
  const tabs = [...pinned, ...extras];

  // Always show "All" even while categories are loading
  const display = tabs.length > 0 ? tabs : ["All"];

  return (
    <div style={s.wrap} role="tablist">
      {display.map((tab) => (
        <button
          key={tab}
          role="tab"
          aria-selected={active === tab}
          onClick={() => onChange(tab)}
          style={{ ...s.tab, ...(active === tab ? s.active : {}) }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    display: "flex", gap: 4, overflowX: "auto", padding: "2px 0",
    scrollbarWidth: "none", flexShrink: 0,
  },
  tab: {
    flexShrink: 0, border: "1px solid var(--border)", borderRadius: 100,
    background: "transparent", color: "var(--text2)", fontSize: 11,
    fontFamily: "var(--font)", padding: "3px 10px", cursor: "pointer",
    whiteSpace: "nowrap", transition: `all var(--dur) var(--ease)`,
  },
  active: {
    background: "var(--accent)", borderColor: "var(--accent)",
    color: "var(--accent-fg)", fontWeight: 600,
  },
};
