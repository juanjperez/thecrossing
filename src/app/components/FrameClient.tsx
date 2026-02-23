"use client";

import { useState, useCallback } from "react";
import type { Beat, FrameType } from "../lib/types";
import FrameViewer from "./FrameViewer";
import FrameTextOverlay from "./FrameTextOverlay";
import FrameNavigation from "./FrameNavigation";
import ProgressBar from "./ProgressBar";
import ActNav from "./ActNav";

interface FrameClientProps {
  frameId: string;
  frameType: FrameType;
  beats: Beat[];
  chapter: string | null;
  prevFrameId: string | null;
  nextFrameId: string | null;
  current: number;
  total: number;
  initialDirection: "forward" | "back";
}

export default function FrameClient({
  frameId,
  frameType,
  beats,
  chapter,
  prevFrameId,
  nextFrameId,
  current,
  total,
  initialDirection,
}: FrameClientProps) {
  // If navigated backward, start at last beat; otherwise -1 (no text)
  const [currentBeat, setCurrentBeat] = useState(
    initialDirection === "back" && beats.length > 0 ? beats.length - 1 : -1
  );

  const onAdvanceBeat = useCallback(() => {
    setCurrentBeat((prev) => Math.min(prev + 1, beats.length - 1));
  }, [beats.length]);

  const onRetreatBeat = useCallback(() => {
    setCurrentBeat((prev) => Math.max(prev - 1, -1));
  }, []);

  const isSplash = frameType === "splash";
  const isLast = !nextFrameId;

  // For navigation: effective beat position
  // When currentBeat is -1 and there are beats, a forward tap should show beat 0
  // When currentBeat is at last beat, forward tap should go to next frame
  const effectiveBeat = currentBeat;
  const totalBeats = beats.length;

  return (
    <main className="relative w-screen h-screen bg-black select-none">
      <ProgressBar current={current} total={total} />
      <ActNav currentChapter={chapter} />

      <FrameViewer
        frameId={frameId}
        frameType={frameType}
        nextFrameId={nextFrameId}
      />

      <FrameTextOverlay
        beats={beats}
        currentBeat={currentBeat}
        chapter={chapter}
      />

      <FrameNavigation
        prevFrameId={prevFrameId}
        nextFrameId={nextFrameId}
        isSplash={isSplash}
        isLast={isLast}
        totalBeats={totalBeats}
        currentBeat={effectiveBeat}
        onAdvanceBeat={onAdvanceBeat}
        onRetreatBeat={onRetreatBeat}
      />
    </main>
  );
}
