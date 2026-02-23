"use client";

import Image from "next/image";
import type { FrameType } from "../lib/types";

interface FrameViewerProps {
  frameId: string;
  frameType: FrameType;
  nextFrameId: string | null;
}

export default function FrameViewer({
  frameId,
  frameType,
  nextFrameId,
}: FrameViewerProps) {
  return (
    <>
      <div className="fixed inset-0 z-10 flex items-center justify-center bg-black">
        <Image
          src={`/frames/${frameId}.png`}
          alt={frameType === "splash" ? "The Crossing" : `Frame ${frameId}`}
          fill
          className="object-contain"
          priority
          sizes="100vw"
        />
      </div>

      {/* Preload next frame */}
      {nextFrameId && (
        <link
          rel="preload"
          href={`/frames/${nextFrameId}.png`}
          as="image"
        />
      )}
    </>
  );
}
