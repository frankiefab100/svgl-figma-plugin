import React from "react";

interface HeaderProps {
  title?: string;
  onBack: () => void;
  rightAction?: React.ReactNode;
}

export function PanelHeader({ title, onBack, rightAction }: HeaderProps) {
  return (
    <div style={style.header}>
      <button onClick={onBack} style={style.backBtn} type="button">
        <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
          <path
            d="M10 3L5 8l5 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Back</span>
      </button>

      {title && <span style={style.title}>{title}</span>}

      <div style={style.rightContainer}>
        {rightAction || <div style={style.spacer} />}
      </div>
    </div>
  );
}

const style: Record<string, React.CSSProperties> = {
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
    height: 38,
    boxSizing: "border-box",
  },
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    border: "none",
    background: "transparent",
    color: "var(--text2)",
    fontSize: 12,
    fontWeight: 500,
    fontFamily: "var(--font)",
    cursor: "pointer",
    padding: "2px 4px",
    borderRadius: 4,
    marginLeft: -4,
    lineHeight: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text)",
    textAlign: "center",
  },
  rightContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    minWidth: 48,
  },
  spacer: {
    width: 48,
  },
};
