import React from "react";
import type { SVGLogo } from "../../types/svgl";
import { LogoCard } from "./LogoCard";
import { LoadingGrid } from "./LoadingGrid";

interface Props {
  logos: SVGLogo[];
  loading?: boolean;
  selected?: SVGLogo | null;
  onSelect: (l: SVGLogo) => void;
  onImport: (l: SVGLogo) => void;
  batchMode?: boolean;
  batchSelected?: Set<number>;
  onToggleBatch?: (l: SVGLogo) => void;
}

export function LogoGrid({ logos, loading, selected, onSelect, onImport, batchMode, batchSelected, onToggleBatch }: Props) {
  if (loading) return <LoadingGrid />;

  return (
    <div style={s.grid} role="list">
      {logos.map((logo) => (
        <div key={logo.id} role="listitem">
          <LogoCard
            logo={logo}
            selected={selected?.id === logo.id}
            batchMode={batchMode}
            batchSelected={batchSelected?.has(logo.id)}
            onSelect={() => onSelect(logo)}
            onImport={() => onImport(logo)}
            onToggleBatch={() => onToggleBatch?.(logo)}
          />
        </div>
      ))}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 2,
    padding: "4px 0",
    width: "100%",
    overflowX: "hidden",
  },
};
