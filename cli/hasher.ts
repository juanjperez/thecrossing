import { createHash } from "crypto";
import type { Frame, Character } from "../src/app/lib/types";

/**
 * Hash the fields of a frame that affect the generated image.
 * Changes to caption, sequence, chapter, or narrative do NOT trigger re-render.
 */
export function hashFrame(frame: Frame): string {
  const data = {
    id: frame.id,
    prompt: frame.prompt,
    size: frame.size,
    quality: frame.quality,
    type: frame.type,
    characters: [...frame.characters].sort(),
  };
  return createHash("sha256")
    .update(JSON.stringify(data))
    .digest("hex");
}

/**
 * Hash the fields of a character that affect the generated reference images.
 */
export function hashCharacter(character: Character): string {
  const data = {
    id: character.id,
    prompt: character.prompt,
    views: [...character.views].sort(),
  };
  return createHash("sha256")
    .update(JSON.stringify(data))
    .digest("hex");
}
