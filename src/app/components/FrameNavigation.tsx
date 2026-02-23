"use client";

import { useRouter } from "next/navigation";
import { useEffect, useCallback, useRef } from "react";

interface FrameNavigationProps {
  prevFrameId: string | null;
  nextFrameId: string | null;
  isSplash: boolean;
  isLast: boolean;
  totalBeats: number;
  currentBeat: number;
  onAdvanceBeat: () => void;
  onRetreatBeat: () => void;
}

export default function FrameNavigation({
  prevFrameId,
  nextFrameId,
  isSplash,
  isLast,
  totalBeats,
  currentBeat,
  onAdvanceBeat,
  onRetreatBeat,
}: FrameNavigationProps) {
  const router = useRouter();
  const touchStartX = useRef<number | null>(null);

  const goNext = useCallback(() => {
    if (nextFrameId) router.push(`/frame/${nextFrameId}`);
  }, [nextFrameId, router]);

  const goPrev = useCallback(() => {
    if (prevFrameId) router.push(`/frame/${prevFrameId}?dir=back`);
  }, [prevFrameId, router]);

  const handleForward = useCallback(() => {
    // If there are beats remaining, advance the beat
    if (currentBeat < totalBeats - 1) {
      onAdvanceBeat();
    } else {
      // All beats exhausted (or no beats), go to next frame
      goNext();
    }
  }, [currentBeat, totalBeats, onAdvanceBeat, goNext]);

  const handleBackward = useCallback(() => {
    // If on a beat > 0, go back a beat
    if (currentBeat > 0) {
      onRetreatBeat();
    } else {
      // At first beat or no beats, go to previous frame
      goPrev();
    }
  }, [currentBeat, onRetreatBeat, goPrev]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        handleForward();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleBackward();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleForward, handleBackward]);

  // Swipe gesture handling
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const threshold = 50;
    if (deltaX < -threshold) handleForward();
    else if (deltaX > threshold) handleBackward();
    touchStartX.current = null;
  }

  // Splash screen: show "Begin" button
  if (isSplash) {
    return (
      <div
        className="fixed inset-0 z-30"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="absolute bottom-24 left-0 right-0 flex justify-center">
          <button
            onClick={goNext}
            className="px-8 py-3 text-sm uppercase tracking-[0.3em] text-white/70 border border-white/20 rounded-none hover:text-white hover:border-white/50 transition-all duration-300 bg-black/30 backdrop-blur-sm"
          >
            Begin
          </button>
        </div>
      </div>
    );
  }

  // Last frame: show "The End"
  if (isLast && currentBeat >= totalBeats - 1) {
    return (
      <div
        className="fixed inset-0 z-30 flex"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Left tap zone — go back */}
        <div className="w-1/3 h-full cursor-w-resize" onClick={handleBackward} />
        {/* Center + right */}
        <div className="w-2/3 h-full" />
        <div className="absolute bottom-24 left-0 right-0 flex justify-center pointer-events-none">
          <p className="text-sm uppercase tracking-[0.3em] text-white/50">
            The End
          </p>
        </div>
      </div>
    );
  }

  // Normal panel: tap zones (left third = back, right two-thirds = forward)
  return (
    <div
      className="fixed inset-0 z-30 flex"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {prevFrameId || currentBeat > 0 ? (
        <div className="w-1/3 h-full cursor-w-resize" onClick={handleBackward} />
      ) : null}
      <div
        className={`${prevFrameId || currentBeat > 0 ? "w-2/3" : "w-full"} h-full cursor-e-resize`}
        onClick={handleForward}
      />
    </div>
  );
}
