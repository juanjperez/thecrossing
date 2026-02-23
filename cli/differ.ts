import fs from "fs";
import path from "path";
import type { Frame, Character, RenderManifest } from "../src/app/lib/types";
import { hashFrame, hashCharacter } from "./hasher";

export interface CharacterDiff {
  toRender: Character[];
  toDelete: string[];
}

export interface FrameDiff {
  toRender: Frame[];
  toDelete: string[];
}

/**
 * Diff characters against manifest. A character needs re-render if:
 * - Its hash changed (prompt or views changed)
 * - Its image files are missing from disk
 * - It's new (not in manifest)
 */
export function diffCharacters(
  characters: Character[],
  manifest: RenderManifest,
): CharacterDiff {
  const toRender: Character[] = [];
  const currentIds = new Set(characters.map((c) => c.id));

  for (const char of characters) {
    const hash = hashCharacter(char);
    const entry = manifest.characters[char.id];

    if (!entry || entry.hash !== hash) {
      toRender.push(char);
      continue;
    }

    // Check if files exist on disk
    const filesMissing = Object.values(entry.files).some(
      (filePath) => !fs.existsSync(path.join(process.cwd(), filePath)),
    );
    if (filesMissing) {
      toRender.push(char);
    }
  }

  // IDs in manifest but not in story → flag for deletion
  const toDelete = Object.keys(manifest.characters).filter(
    (id) => !currentIds.has(id),
  );

  return { toRender, toDelete };
}

/**
 * Diff frames against manifest. A frame needs re-render if:
 * - Its hash changed
 * - Its image file is missing from disk
 * - It's new (not in manifest)
 * - Any of its referenced characters were re-rendered
 */
export function diffFrames(
  frames: Frame[],
  manifest: RenderManifest,
  changedCharacterIds: Set<string>,
): FrameDiff {
  const toRender: Frame[] = [];
  const currentIds = new Set(frames.map((f) => f.id));

  for (const frame of frames) {
    const hash = hashFrame(frame);
    const entry = manifest.frames[frame.id];

    // New or hash changed
    if (!entry || entry.hash !== hash) {
      toRender.push(frame);
      continue;
    }

    // File missing on disk
    if (!fs.existsSync(path.join(process.cwd(), entry.file))) {
      toRender.push(frame);
      continue;
    }

    // Character dependency cascade: if any referenced character changed,
    // this frame must re-render even if its own hash didn't change
    const hasChangedCharacter = frame.characters.some((charId) =>
      changedCharacterIds.has(charId),
    );
    if (hasChangedCharacter) {
      toRender.push(frame);
    }
  }

  // IDs in manifest but not in story → flag for deletion
  const toDelete = Object.keys(manifest.frames).filter(
    (id) => !currentIds.has(id),
  );

  return { toRender, toDelete };
}
