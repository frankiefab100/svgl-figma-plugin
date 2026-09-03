import React, { useRef, useEffect } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({ value, onChange, placeholder = "Search logos…", autoFocus }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) setTimeout(() => ref.current?.focus(), 80);
  }, [autoFocus]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        ref.current?.focus();
        ref.current?.select();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  return (
    <div style={s.wrap}>
      {/* Search icon */}
      <svg style={s.icon} viewBox="0 0 16 16" fill="none">
        <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={s.input}
        aria-label="Search logos"
      />

      {value && (
        <button onClick={() => onChange("")} style={s.clear} aria-label="Clear" tabIndex={-1}>
          <svg viewBox="0 0 10 10" width="10" height="10" fill="none">
            <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}

      <kbd style={s.kbd}>⌘K</kbd>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    display: "flex", alignItems: "center", gap: 6,
    background: "var(--bg2)", border: "1px solid var(--border)",
    borderRadius: "var(--radius)", padding: "0 8px",
  },
  icon: { width: 14, height: 14, color: "var(--text3)", flexShrink: 0 },
  input: {
    flex: 1, border: "none", background: "transparent",
    color: "var(--text)", fontSize: 12, lineHeight: "30px",
    outline: "none", fontFamily: "var(--font)",
    minWidth: 0,
  },
  clear: {
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "none", background: "transparent", color: "var(--text3)",
    cursor: "pointer", padding: 2, borderRadius: 3, flexShrink: 0,
  },
  kbd: {
    fontSize: 10, color: "var(--text3)", background: "var(--surface)",
    border: "1px solid var(--border)", borderRadius: 3,
    padding: "1px 4px", whiteSpace: "nowrap", flexShrink: 0,
    pointerEvents: "none", fontFamily: "var(--font)",
  },
};
