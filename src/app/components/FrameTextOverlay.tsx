"use client";

import type { Beat } from "../lib/types";

interface FrameTextOverlayProps {
  beats: Beat[];
  currentBeat: number; // -1 = no text shown
  chapter: string | null;
}

export default function FrameTextOverlay({
  beats,
  currentBeat,
  chapter,
}: FrameTextOverlayProps) {
  if (currentBeat < 0 || currentBeat >= beats.length) return null;

  const beat = beats[currentBeat];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent px-6 pb-10 pt-24">
        {/* Chapter label on first beat only */}
        {chapter && currentBeat === 0 && (
          <p
            key={`chapter-${currentBeat}`}
            className="text-xs uppercase tracking-[0.2em] text-white/60 mb-2 animate-fade-in-up"
          >
            {chapter}
          </p>
        )}

        {/* Beat content */}
        <div key={currentBeat} className="animate-fade-in-up">
          {beat.type === "dialogue" && beat.speaker && (
            <p className="text-xs uppercase tracking-[0.15em] text-white/50 mb-1 font-medium">
              {beat.speaker}
            </p>
          )}
          <p
            className={`text-base sm:text-lg max-w-lg leading-relaxed drop-shadow-lg ${
              beat.type === "narration"
                ? "text-white/90 font-light italic"
                : beat.type === "dialogue"
                  ? "text-white font-normal"
                  : "text-white/70 font-normal"
            }`}
          >
            {beat.type === "dialogue" ? `\u201C${beat.text}\u201D` : beat.text}
          </p>
        </div>

        {/* Beat indicator dots */}
        {beats.length > 1 && (
          <div className="flex gap-1.5 mt-3">
            {beats.map((_, i) => (
              <span
                key={i}
                className={`block w-1.5 h-1.5 rounded-full transition-opacity duration-300 ${
                  i === currentBeat ? "bg-white/80" : "bg-white/25"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
