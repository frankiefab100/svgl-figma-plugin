import { useState, useEffect, useCallback, useRef } from "react";
import type { SVGLogo, Category } from "../../types/svgl";
import { filterByCategory, filterByQuery, sendToPlugin } from "../lib/api";
import { useDebounce } from "./useDebounce";

type Status = "idle" | "loading" | "error" | "success";

export function useLogos() {
  // Master list — received once from code.ts, cached here
  const allLogosRef = useRef<SVGLogo[]>([]);
  const [allLogos, setAllLogos] = useState<SVGLogo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Derived display list
  const [logos, setLogos] = useState<SVGLogo[]>([]);

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 280);

  // Listen for data back from code.ts
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const msg = event.data?.pluginMessage;
      if (!msg) return;

      if (msg.type === "LOGOS_DATA") {
        const data = msg.logos as SVGLogo[];
        allLogosRef.current = data;
        setAllLogos(data);
        setStatus("success");
      } else if (msg.type === "CATEGORIES_DATA") {
        setCategories(msg.categories as Category[]);
      } else if (msg.type === "LOGOS_ERROR") {
        setError(msg.error as string);
        setStatus("error");
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Initial fetch, query code.ts for logos and categories 
  useEffect(() => {
    setStatus("loading");
    sendToPlugin({ type: "FETCH_LOGOS" });
    sendToPlugin({ type: "FETCH_CATEGORIES" });
  }, []);

  // Re-filter whenever query or category changes
  useEffect(() => {
    const base = allLogosRef.current;
    if (base.length === 0) return;

    let result = filterByCategory(base, activeCategory);
    result = filterByQuery(result, debouncedQuery);
    setLogos(result);
  }, [debouncedQuery, activeCategory, allLogos]);

  const retry = useCallback(() => {
    setError(null);
    setStatus("loading");
    allLogosRef.current = [];
    setAllLogos([]);
    sendToPlugin({ type: "FETCH_LOGOS" });
    sendToPlugin({ type: "FETCH_CATEGORIES" });
  }, []);

  return {
    logos,
    allLogos,
    categories,
    query,
    setQuery,
    activeCategory,
    setActiveCategory,
    status,
    error,
    retry,
    isLoading: status === "loading",
    isEmpty: status === "success" && logos.length === 0,
  };
}
