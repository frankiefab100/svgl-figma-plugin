import React from "react";

export function LoadingGrid({ count = 12 }: { count?: number }) {
  return (
    <div style={style.grid} aria-busy aria-label="Loading logos">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={style.card}>
          <div className="skeleton" style={style.img} />
          <div className="skeleton" style={style.lbl} />
        </div>
      ))}
    </div>
  );
}

const style: Record<string, React.CSSProperties> = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 2,
    padding: "4px 0",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    padding: "10px 4px 8px",
  },
  img: { width: 40, height: 40, borderRadius: 6 },
  lbl: { width: "68%", height: 10, borderRadius: 3 },
};
