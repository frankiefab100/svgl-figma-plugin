import React, { useState } from "react";
import type { SVGLogo } from "../../types/svgl";
import { resolveLogoUrl, hasVariants } from "../lib/api";
import { getSettings } from "../lib/storage";

const SIZES = [24, 32, 48, 64, 128];

interface ImportOpts {
  svgUrl: string;
  name: string;
  size: number;
  createComponent: boolean;
  placement: "cursor" | "new-page";
}

interface Props {
  logo: SVGLogo;
  onBack: () => void;
  onImport: (opts: ImportOpts) => void;
  isFav?: boolean;
  onToggleFav?: () => void;
}

export function LogoPreview({
  logo,
  onBack,
  onImport,
  isFav,
  onToggleFav,
}: Props) {
  const userSettings = getSettings();
  const [variant, setVariant] = useState<"light" | "dark">("light");
  const [size, setSize] = useState(userSettings.defaultSize);
  const [mode, setMode] = useState(userSettings.importMode);
  const [placement, setPlacement] = useState(userSettings.placement);

  const supportsVariants = hasVariants(logo.route);
  const svgUrl = resolveLogoUrl(logo.route, variant);
  const cats = Array.isArray(logo.category) ? logo.category : [logo.category];

  function handleDragStart(e: React.DragEvent<HTMLDivElement>) {
    e.dataTransfer.effectAllowed = "copyMove";
    e.dataTransfer.dropEffect = "copy";

    e.dataTransfer.setData("text/plain", logo.title);
    e.dataTransfer.setData("text/uri-list", svgUrl);
    e.dataTransfer.setData(
      "application/x-svgl-logo",
      JSON.stringify({
        id: logo.id,
        svgUrl,
        name: logo.title,
        size,
      }),
    );

    try {
      const placeholder = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><title>${logo.title}</title></svg>`;
      const file = new File([placeholder], `${logo.title}.svg`, {
        type: "image/svg+xml",
      });
      if (e.dataTransfer.items) {
        e.dataTransfer.items.add(file);
      }
    } catch (_) {
      /* ignore */
    }

    const img = new Image();
    img.src = svgUrl;
    img.width = size;
    img.height = size;
    try {
      e.dataTransfer.setDragImage(img, size / 2, size / 2);
    } catch (_) {
      /* ignore */
    }
  }

  function handleDragEnd(e: React.DragEvent<HTMLDivElement>) {
    if ((e.view as unknown as { length: number })?.length === 0) return;
    const payload = {
      svgUrl,
      name: logo.title,
      size,
    };
    // Dual approach: official pluginDrop + legacy pluginMessage
    parent.postMessage(
      {
        pluginDrop: {
          clientX: e.clientX,
          clientY: e.clientY,
          dropMetadata: payload,
        },
      },
      "*",
    );
    parent.postMessage(
      {
        pluginMessage: {
          type: "IMPORT_LOGO_DROP",
          payload: {
            ...payload,
            createComponent: mode === "component",
            placement,
            x: e.clientX,
            y: e.clientY,
          },
        },
      },
      "*",
    );
  }

  return (
    <div style={style.wrap} className="animate-in">
      {/* Header */}
      <div style={style.header}>
        <button onClick={onBack} style={style.back}>
          <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
            <path
              d="M10 3L5 8l5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </button>
      </div>

      {/* Preview canvas */}
      <div
        style={style.canvas}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <img
          src={svgUrl}
          alt={logo.title}
          style={style.previewImg}
          draggable={false}
        />
        {onToggleFav && (
          <button
            onClick={onToggleFav}
            style={style.favBtn}
            aria-label={isFav ? "Remove favourite" : "Add favourite"}
            title={isFav ? "Remove from favourites" : "Add to favourites"}
          >
            <svg
              viewBox="0 0 12 12"
              width="14"
              height="14"
              fill={isFav ? "var(--danger)" : "none"}
            >
              <path
                d="M6 10.5s-4.5-3-4.5-6a2.5 2.5 0 015 0 2.5 2.5 0 015 0c0 3-4.5 6-4.5 6z"
                stroke={isFav ? "var(--danger)" : "var(--text3)"}
                strokeWidth="1.2"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Info */}
      <div style={style.info}>
        <div style={style.titleRow}>
          <span style={style.logoTitle}>{logo.title}</span>
          {logo.url && (
            <a
              href={logo.url}
              style={style.extLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg viewBox="0 0 12 12" width="11" height="11" fill="none">
                <path
                  d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V7M7 1h4v4M11 1L5 7"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          )}
        </div>
        <div style={style.tags}>
          {cats.map((c) => (
            <span key={c} style={style.tag}>
              {c}
            </span>
          ))}
        </div>
      </div>

      <div style={style.divider} />

      {/* Variants */}
      {supportsVariants && (
        <Section label="Variants">
          <div style={style.row}>
            {(["light", "dark"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVariant(v)}
                style={{
                  ...style.variantBtn,
                  ...(variant === v ? style.variantBtnOn : {}),
                }}
              >
                <img
                  src={resolveLogoUrl(logo.route, v)}
                  alt={v}
                  style={{
                    ...style.variantThumb,
                    background: v === "dark" ? "#111" : "#f5f5f5",
                  }}
                />
                {v === "light" ? "Light" : "Dark"}
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Size */}
      <Section label="Size">
        <div style={style.row}>
          {SIZES.map((n) => (
            <button
              key={n}
              onClick={() => setSize(n)}
              style={{
                ...style.sizeBtn,
                ...(size === n ? style.sizeBtnOn : {}),
              }}
            >
              {n}
            </button>
          ))}
          <span style={style.unit}>px</span>
        </div>
      </Section>

      {/* Import as */}
      <Section label="Import as">
        <div style={style.row}>
          {(["svg", "component"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                ...style.modeBtn,
                ...(mode === m ? style.modeBtnOn : {}),
              }}
            >
              {m === "svg" ? "SVG (editable)" : "Component"}
            </button>
          ))}
        </div>
      </Section>

      {/* Placement */}
      <Section label="Placement">
        <div style={style.row}>
          {(["cursor", "new-page"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPlacement(p)}
              style={{
                ...style.modeBtn,
                ...(placement === p ? style.modeBtnOn : {}),
              }}
            >
              {p === "cursor" ? "At cursor" : "New page"}
            </button>
          ))}
        </div>
      </Section>

      <div style={style.divider} />

      {/* Import button */}
      <button
        onClick={() =>
          onImport({
            svgUrl,
            name: logo.title,
            size,
            createComponent: mode === "component",
            placement,
          })
        }
        style={style.importBtn}
      >
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
          <path
            d="M8 2v9M4 8l4 4 4-4M2 14h12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Import SVG
      </button>

      {/* Meta */}
      <div style={style.meta}>
        <MetaRow k="Source" v="svgl.app" />
        <MetaRow k="Category" v={cats.join(", ")} />
        <MetaRow k="License" v="Check source before commercial use" muted />
      </div>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: "8px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: "var(--text2)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function MetaRow({ k, v, muted }: { k: string; v: string; muted?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 11,
        color: "var(--text2)",
      }}
    >
      <span style={{ color: "var(--text3)" }}>{k}</span>
      <span style={muted ? { color: "var(--text3)", fontStyle: "italic" } : {}}>
        {v}
      </span>
    </div>
  );
}

const style: Record<string, React.CSSProperties> = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflowY: "auto",
  },
  header: {
    padding: "10px 12px 8px",
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
  },
  back: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    border: "none",
    background: "transparent",
    color: "var(--text2)",
    fontSize: 12,
    fontFamily: "var(--font)",
    cursor: "pointer",
    padding: "2px 4px",
    borderRadius: 4,
  },
  canvas: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 136,
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
    backgroundImage:
      "repeating-linear-gradient(45deg, var(--bg2) 0, var(--bg2) 5px, var(--bg) 5px, var(--bg) 10px)",
    cursor: "grab",
  },
  previewImg: { maxWidth: 96, maxHeight: 96, objectFit: "contain" },
  favBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    borderRadius: 4,
    width: 24,
    height: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
  },
  info: { padding: "10px 12px 6px", flexShrink: 0 },
  titleRow: { display: "flex", alignItems: "center", gap: 6, marginBottom: 6 },
  logoTitle: { fontSize: 14, fontWeight: 600, color: "var(--text)" },
  extLink: { color: "var(--accent)", display: "flex" },
  tags: { display: "flex", gap: 4, flexWrap: "wrap" },
  tag: {
    fontSize: 10,
    padding: "2px 6px",
    borderRadius: 100,
    background: "var(--bg2)",
    border: "1px solid var(--border)",
    color: "var(--text2)",
  },
  divider: {
    height: 1,
    background: "var(--border)",
    margin: "2px 0",
    flexShrink: 0,
  },
  row: { display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" },
  variantBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    border: "1.5px solid var(--border)",
    borderRadius: "var(--radius)",
    background: "var(--surface)",
    cursor: "pointer",
    padding: "6px 10px",
    fontSize: 11,
    fontFamily: "var(--font)",
    color: "var(--text)",
  },
  variantBtnOn: {
    borderColor: "var(--accent)",
    color: "var(--accent)",
    fontWeight: 600,
  },
  variantThumb: {
    width: 32,
    height: 32,
    objectFit: "contain",
    borderRadius: 4,
    padding: 4,
  },
  sizeBtn: {
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--text2)",
    borderRadius: "var(--radius-sm)",
    fontSize: 11,
    fontFamily: "var(--font)",
    padding: "4px 8px",
    cursor: "pointer",
  },
  sizeBtnOn: {
    background: "var(--accent)",
    borderColor: "var(--accent)",
    color: "white",
    fontWeight: 600,
  },
  modeBtn: {
    flex: 1,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--text2)",
    borderRadius: "var(--radius-sm)",
    fontSize: 11,
    fontFamily: "var(--font)",
    padding: "5px 8px",
    cursor: "pointer",
    textAlign: "center",
  },
  modeBtnOn: {
    background: "var(--accent)",
    borderColor: "var(--accent)",
    color: "white",
    fontWeight: 600,
  },
  unit: { fontSize: 11, color: "var(--text3)" },
  importBtn: {
    margin: "6px 12px 8px",
    padding: 9,
    background: "var(--accent)",
    color: "white",
    border: "none",
    borderRadius: "var(--radius)",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "var(--font)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    flexShrink: 0,
  },
  meta: {
    padding: "4px 12px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 5,
    flexShrink: 0,
  },
};
