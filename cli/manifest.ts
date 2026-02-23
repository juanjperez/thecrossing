import fs from "fs";
import path from "path";
import type { RenderManifest } from "../src/app/lib/types";

const MANIFEST_PATH = path.join(process.cwd(), "render-manifest.json");

export function loadManifest(): RenderManifest {
  if (!fs.existsSync(MANIFEST_PATH)) {
    return createEmptyManifest();
  }
  const raw = fs.readFileSync(MANIFEST_PATH, "utf-8");
  return JSON.parse(raw) as RenderManifest;
}

export function saveManifest(manifest: RenderManifest): void {
  manifest.generatedAt = new Date().toISOString();
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
}

function createEmptyManifest(): RenderManifest {
  return {
    generatedAt: null,
    model: "gpt-image-1",
    totalFrames: 0,
    characters: {},
    frames: {},
  };
}
