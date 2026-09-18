import React, { useState } from "react";
import type { SVGLogo } from "../../types/svgl";
import { resolveLogoUrl, hasVariants } from "../lib/api";
import { prepareLogoDrag, completeLogoDrag } from "../lib/logoDrag";

interface Props {
  logo: SVGLogo;
  selected?: boolean;
  batchMode?: boolean;
  batchSelected?: boolean;
  isFav?: boolean;
  onToggleFav?: () => void;
  onSelect: () => void;
  onImport: () => void;
  onDragDrop?: () => void;
  onToggleBatch: () => void;
}

export function LogoCard({
  logo,
  selected,
  batchMode,
  batchSelected,
  isFav,
  onToggleFav,
  onSelect,
  onImport,
  onDragDrop,
  onToggleBatch,
}: Props) {
  const [hovered, setHovered] = useState(false);
  const [imgErr, setImgErr] = useState(false);

  const fav = Boolean(isFav);
  const url = resolveLogoUrl(logo.route, "light");

  function handleClick() {
    if (batchMode) {
      onToggleBatch();
      return;
    }
    onSelect();
  }

  function handleFav(e: React.MouseEvent) {
    e.stopPropagation();
    onToggleFav?.();
  }

  const cardStyle: React.CSSProperties = {
    ...style.card,
    background:
      selected || batchSelected
        ? "var(--surface-hover)"
        : hovered
          ? "var(--surface-hover)"
          : "transparent",
    border: `1px solid ${selected ? "var(--accent)" : batchSelected ? "var(--accent)" : "transparent"}`,
    outline: "none",
  };

  function handleDragStart(e: React.DragEvent<HTMLDivElement>) {
    if (batchMode) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    prepareLogoDrag(e, {
      id: logo.id,
      svgUrl: url,
      name: logo.title,
      size: 48,
    });
  }

  function handleDragEnd(e: React.DragEvent<HTMLDivElement>) {
    if (batchMode) return;
    completeLogoDrag(e, {
      id: logo.id,
      svgUrl: url,
      name: logo.title,
      size: 48,
      createComponent: false,
      placement: "cursor",
    });
    onDragDrop?.();
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${logo.title} logo`}
      onClick={handleClick}
      onDoubleClick={() => {
        if (!batchMode) onImport();
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      draggable={!batchMode}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={cardStyle}
    >
      {/* Batch checkbox */}
      {batchMode && (
        <div style={style.checkbox}>
          <div
            style={{
              ...style.checkInner,
              ...(batchSelected ? style.checkOn : {}),
            }}
          >
            {batchSelected && (
              <svg viewBox="0 0 10 10" width="8" height="8" fill="none">
                <path
                  d="M2 5l2.5 2.5L8 3"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Logo image */}
      <div style={style.imgWrap}>
        {imgErr ? (
          <div style={style.fallback}>{logo.title[0]}</div>
        ) : (
          <img
            src={url}
            alt={logo.title}
            style={style.img}
            loading="lazy"
            onError={() => setImgErr(true)}
          />
        )}
      </div>

      {/* Name */}
      <div style={style.name}>{logo.title}</div>

      {/* Quick import button on hover */}
      {hovered && !batchMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onImport();
          }}
          style={style.importBtn}
          aria-label={`Import ${logo.title}`}
        >
          Import
        </button>
      )}

      {/* Favourite button */}
      <button
        onClick={handleFav}
        style={{ ...style.favBtn, opacity: hovered || fav ? 1 : 0 }}
        aria-label={fav ? "Remove favourite" : "Add favourite"}
      >
        <svg
          viewBox="0 0 12 12"
          width="11"
          height="11"
          fill={fav ? "var(--danger)" : "none"}
        >
          <path
            d="M6 10.5s-4.5-3-4.5-6a2.5 2.5 0 015 0 2.5 2.5 0 015 0c0 3-4.5 6-4.5 6z"
            stroke={fav ? "var(--danger)" : "var(--text3)"}
            strokeWidth="1.2"
          />
        </svg>
      </button>

      {/* Variant dot */}
      {hasVariants(logo.route) && <div style={style.variantDot} />}
    </div>
  );
}

const style: Record<string, React.CSSProperties> = {
  card: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 5,
    padding: "10px 2px 8px",
    borderRadius: "var(--radius)",
    cursor: "grab",
    userSelect: "none",
    transition: `all var(--dur) var(--ease)`,
    minWidth: 0,
    overflow: "hidden",
    width: "100%",
  },
  imgWrap: {
    width: "100%",
    maxWidth: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
    borderRadius: 6,
    flexShrink: 0,
  },
  img: { maxWidth: 36, maxHeight: 36, objectFit: "contain", display: "block" },
  fallback: {
    width: 36,
    height: 36,
    borderRadius: 4,
    background: "var(--surface-active)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 600,
    color: "var(--text2)",
  },
  name: {
    fontSize: 11,
    color: "var(--text)",
    textAlign: "center",
    lineHeight: "14px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "100%",
    padding: "0 2px",
  },
  importBtn: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    background: "var(--accent)",
    color: "white",
    border: "none",
    borderRadius: "0 0 var(--radius) var(--radius)",
    fontSize: 10,
    fontWeight: 600,
    fontFamily: "var(--font)",
    padding: "4px 0",
    cursor: "pointer",
    letterSpacing: "0.02em",
  },
  favBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    padding: 2,
    borderRadius: 3,
    display: "flex",
    alignItems: "center",
    transition: `opacity var(--dur) var(--ease)`,
  },
  variantDot: {
    position: "absolute",
    top: 4,
    left: 4,
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: "var(--text3)",
  },
  checkbox: { position: "absolute", top: 4, left: 4 },
  checkInner: {
    width: 14,
    height: 14,
    borderRadius: 3,
    border: "1.5px solid var(--border-strong)",
    background: "var(--bg)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: { background: "var(--accent)", borderColor: "var(--accent)" },
};
