import React from "react";

interface Props {
  type: "no-results" | "network-error" | "no-favorites";
  query?: string;
  onRetry?: () => void;
  onClear?: () => void;
}

export function EmptyState({ type, query, onRetry, onClear }: Props) {
  const content = {
    "no-results": {
      icon: (
        <svg viewBox="0 0 40 40" width="36" height="36" fill="none">
          <circle cx="18" cy="18" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M25 25L34 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M15 15l6 6M21 15l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      title: "No logos found",
      hint: query ? `No results for "${query}"` : "Try a different search term.",
      action: onClear && <button onClick={onClear} style={s.btn}>Clear search</button>,
    },
    "network-error": {
      icon: (
        <svg viewBox="0 0 40 40" width="36" height="36" fill="none">
          <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="2" />
          <path d="M20 12v10M20 28v2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ),
      title: "Couldn't load logos",
      hint: "Check your connection and try again.",
      action: onRetry && <button onClick={onRetry} style={s.btn}>Retry</button>,
    },
    "no-favorites": {
      icon: (
        <svg viewBox="0 0 40 40" width="36" height="36" fill="none">
          <path d="M20 32s-14-9-14-18a8 8 0 0116 0 8 8 0 0116 0c0 9-14 18-14 18z"
            stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
      title: "No favourites yet",
      hint: "Click the heart on any logo to save it here.",
      action: null,
    },
  }[type];

  return (
    <div style={s.wrap}>
      <div style={s.icon}>{content.icon}</div>
      <p style={s.title}>{content.title}</p>
      <p style={s.hint}>{content.hint}</p>
      {content.action}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", gap: 8, padding: "40px 24px", textAlign: "center",
  },
  icon: { color: "var(--text3)", marginBottom: 2 },
  title: { fontSize: 13, fontWeight: 600, color: "var(--text)" },
  hint: { fontSize: 11, color: "var(--text3)" },
  btn: {
    marginTop: 6, padding: "6px 16px", borderRadius: "var(--radius)",
    border: "1px solid var(--border)", background: "var(--surface)",
    color: "var(--text)", fontSize: 12, fontFamily: "var(--font)", cursor: "pointer",
  },
};
