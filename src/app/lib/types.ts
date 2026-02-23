// ── Story Types ──

export type FrameType = "splash" | "panel";
export type ImageSize = "1024x1024" | "1024x1536" | "1536x1024";
export type ImageQuality = "low" | "medium" | "high";

export type BeatType = "narration" | "dialogue" | "action";

export interface Beat {
  type: BeatType;
  text: string;
  speaker?: string; // only for dialogue
}

export interface Frame {
  id: string;
  type: FrameType;
  sequence: number;
  prompt: string;
  caption: string | null;
  narrative: string | null;
  chapter: string | null;
  characters: string[];
  size: ImageSize;
  quality: ImageQuality;
  beats: Beat[];
}

export interface StoryMetadata {
  author: string;
  artStyle: string;
  aspectRatio: string;
}

export interface Story {
  title: string;
  version: string;
  metadata: StoryMetadata;
  frames: Frame[];
}

// ── Character Types ──

export type CharacterView = "front" | "side" | "back" | "three-quarter";

export interface Character {
  id: string;
  name: string;
  prompt: string;
  views: CharacterView[];
}

export interface CharacterFile {
  characters: Character[];
}

// ── Manifest Types ──

export interface ManifestCharacterEntry {
  hash: string;
  renderedAt: string;
  files: Record<string, string>;
}

export interface ManifestFrameEntry {
  hash: string;
  renderedAt: string;
  file: string;
  promptSnippet: string;
}

export interface RenderManifest {
  generatedAt: string | null;
  model: string;
  totalFrames: number;
  characters: Record<string, ManifestCharacterEntry>;
  frames: Record<string, ManifestFrameEntry>;
}
