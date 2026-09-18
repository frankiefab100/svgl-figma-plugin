import React from "react";
import type { SVGLogo } from "../../types/svgl";
import { resolveLogoUrl, sendToPlugin } from "../lib/api";
import { LogoCard } from "./LogoCard";
import { LoadingGrid } from "./LoadingGrid";

interface Props {
  logos: SVGLogo[];
  loading?: boolean;
  selected?: SVGLogo | null;
  favIds?: Set<number> | number[];
  onToggleFavorite?: (id: number) => void;
  onSelect: (l: SVGLogo) => void;
  onImport: (l: SVGLogo) => void;
  onDragDrop?: (l: SVGLogo) => void;
  batchMode?: boolean;
  batchSelected?: Set<number>;
  onToggleBatch?: (l: SVGLogo) => void;
}

export function LogoGrid({
  logos,
  loading,
  selected,
  favIds,
  onToggleFavorite,
  onSelect,
  onImport,
  onDragDrop,
  batchMode,
  batchSelected,
  onToggleBatch,
}: Props) {
  if (loading) return <LoadingGrid />;

  const favSet = favIds instanceof Set ? favIds : new Set(favIds || []);

  return (
    <div style={style.grid} role="list">
      {logos.map((logo) => (
        <div key={logo.id} role="listitem">
          <LogoCard
            logo={logo}
            selected={selected?.id === logo.id}
            isFav={favSet.has(logo.id)}
            onToggleFav={() => onToggleFavorite?.(logo.id)}
            batchMode={batchMode}
            batchSelected={batchSelected?.has(logo.id)}
            onSelect={() => onSelect(logo)}
            onImport={() => onImport(logo)}
            onDragDrop={() => onDragDrop?.(logo)}
            onToggleBatch={() => onToggleBatch?.(logo)}
          />
        </div>
      ))}
    </div>
  );
}

const style: Record<string, React.CSSProperties> = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 2,
    padding: "4px 0",
    width: "100%",
    overflowX: "hidden",
  },
};
