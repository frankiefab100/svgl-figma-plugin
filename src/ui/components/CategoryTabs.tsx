import React, { useRef, useState, useEffect, useCallback } from "react";
import type { Category } from "../../types/svgl";

const PINNED = ["All", "Design", "Language", "AI", "Payment"];

interface Props {
  categories: Category[];
  active: string;
  onChange: (cat: string) => void;
}

export function CategoryTabs({ categories, active, onChange }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const names = categories.map((c) => c.category);
  const pinned = PINNED.filter((p) => p === "All" || names.includes(p));
  const extras = names.filter((n) => !PINNED.includes(n)).sort();
  const tabs = [...pinned, ...extras];

  // Always show "All" even while categories are loading
  const display = tabs.length > 0 ? tabs : ["All"];

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2);
  }, []);

  // Map vertical wheel to horizontal scroll & observe resize
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("scroll", checkScroll, { passive: true });

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => checkScroll());
      ro.observe(el);
    }

    checkScroll();

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("scroll", checkScroll);
      if (ro) ro.disconnect();
    };
  }, [checkScroll, display]);

  // Smoothly center or bring active tab into view
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [active]);

  const scrollByAmount = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const offset = direction === "left" ? -180 : 180;
    el.scrollBy({ left: offset, behavior: "smooth" });
  };

  return (
    <div style={style.container}>
      {canScrollLeft && (
        <div style={style.edgeLeft}>
          <button
            type="button"
            className="category-nav-btn"
            aria-label="Scroll left"
            tabIndex={-1}
            onClick={() => scrollByAmount("left")}
          >
            <svg
              viewBox="0 0 16 16"
              width="10"
              height="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 12L6 8l4-4" />
            </svg>
          </button>
        </div>
      )}

      <div
        ref={scrollRef}
        className="no-scrollbar"
        style={style.wrap}
        role="tablist"
      >
        {display.map((tab) => {
          const isSelected = active === tab;
          return (
            <button
              key={tab}
              ref={isSelected ? activeRef : null}
              role="tab"
              aria-selected={isSelected}
              onClick={() => onChange(tab)}
              style={{ ...style.tab, ...(isSelected ? style.active : {}) }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {canScrollRight && (
        <div style={style.edgeRight}>
          <button
            type="button"
            className="category-nav-btn"
            aria-label="Scroll right"
            tabIndex={-1}
            onClick={() => scrollByAmount("right")}
          >
            <svg
              viewBox="0 0 16 16"
              width="10"
              height="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 4l4 4-4 4" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

const style: Record<string, React.CSSProperties> = {
  container: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    width: "100%",
  },
  wrap: {
    display: "flex",
    gap: 4,
    overflowX: "auto",
    padding: "3px 0",
    scrollbarWidth: "none",
    flex: 1,
    scrollBehavior: "smooth",
  },
  tab: {
    flexShrink: 0,
    border: "1px solid var(--border)",
    borderRadius: 100,
    background: "transparent",
    color: "var(--text2)",
    fontSize: 11,
    fontFamily: "var(--font)",
    padding: "3px 10px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all var(--dur) var(--ease)",
  },
  active: {
    background: "var(--accent)",
    borderColor: "var(--accent)",
    color: "var(--accent-fg)",
    fontWeight: 600,
  },
  edgeLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    background: "linear-gradient(to right, var(--bg) 60%, transparent)",
    pointerEvents: "none",
    zIndex: 2,
  },
  edgeRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    background: "linear-gradient(to left, var(--bg) 60%, transparent)",
    pointerEvents: "none",
    zIndex: 2,
  },
};
