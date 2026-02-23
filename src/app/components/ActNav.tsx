"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ActNavProps {
  currentChapter: string | null;
}

const ACTS = [
  { label: "Act I", frameId: "frame-001" },
  { label: "Act II", frameId: "frame-046" },
  { label: "Act III", frameId: "frame-115" },
];

export default function ActNav({ currentChapter }: ActNavProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div ref={menuRef} className="fixed top-3 right-4 z-50">
      {/* Toggle button — three small horizontal lines */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 group pointer-events-auto"
        aria-label="Navigate acts"
      >
        <div className="flex flex-col gap-[3px]">
          <span className="block w-4 h-[1.5px] bg-white/30 group-hover:bg-white/60 transition-colors duration-300" />
          <span className="block w-4 h-[1.5px] bg-white/30 group-hover:bg-white/60 transition-colors duration-300" />
          <span className="block w-4 h-[1.5px] bg-white/30 group-hover:bg-white/60 transition-colors duration-300" />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-10 right-0 bg-black/80 backdrop-blur-md border border-white/10 rounded-sm py-1 min-w-[120px] animate-fade-in-up pointer-events-auto">
          {ACTS.map((act) => {
            const isCurrent = currentChapter === act.label;
            return (
              <button
                key={act.frameId}
                onClick={() => {
                  setOpen(false);
                  router.push(`/frame/${act.frameId}`);
                }}
                className={`block w-full text-left px-4 py-2 text-xs uppercase tracking-[0.15em] transition-colors duration-200 ${
                  isCurrent
                    ? "text-white/90"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {act.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
