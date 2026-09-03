import React, { useState, useEffect } from "react";

export type ToastKind = "success" | "error" | "info";
interface Msg { id: number; text: string; kind: ToastKind; }

let _listeners: ((m: Msg[]) => void)[] = [];
let _msgs: Msg[] = [];
let _seq = 0;

export function showToast(text: string, kind: ToastKind = "success") {
  const id = ++_seq;
  _msgs = [..._msgs, { id, text, kind }];
  _listeners.forEach((l) => l(_msgs));
  setTimeout(() => {
    _msgs = _msgs.filter((m) => m.id !== id);
    _listeners.forEach((l) => l(_msgs));
  }, 2800);
}

export function ToastContainer() {
  const [msgs, set] = useState<Msg[]>([]);
  useEffect(() => {
    _listeners.push(set);
    return () => { _listeners = _listeners.filter((l) => l !== set); };
  }, []);

  if (!msgs.length) return null;

  const bg: Record<ToastKind, string> = {
    success: "#1bc47d",
    error:   "var(--danger)",
    info:    "var(--surface)",
  };
  const fg: Record<ToastKind, string> = {
    success: "white",
    error:   "white",
    info:    "var(--text)",
  };

  return (
    <div style={s.wrap} aria-live="polite">
      {msgs.map((m) => (
        <div key={m.id} style={{ ...s.toast, background: bg[m.kind], color: fg[m.kind] }}>
          {m.text}
        </div>
      ))}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    position: "fixed", bottom: 12, left: "50%",
    transform: "translateX(-50%)",
    display: "flex", flexDirection: "column", gap: 4,
    zIndex: 1000, pointerEvents: "none",
  },
  toast: {
    padding: "6px 14px", borderRadius: 100, fontSize: 11,
    fontWeight: 500, boxShadow: "var(--shadow-md)",
    whiteSpace: "nowrap", animation: "toast-in 180ms ease forwards",
  },
};
