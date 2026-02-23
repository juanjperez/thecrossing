import fs from "fs";
import path from "path";
import type { Story, Frame, Character, CharacterFile } from "./types";

const STORY_PATH = path.join(process.cwd(), "story/story.json");
const CHARACTERS_PATH = path.join(process.cwd(), "story/characters.json");

let cachedStory: Story | null = null;
let cachedCharacters: CharacterFile | null = null;

export function loadStory(): Story {
  if (!cachedStory) {
    const raw = fs.readFileSync(STORY_PATH, "utf-8");
    cachedStory = JSON.parse(raw) as Story;
  }
  return cachedStory;
}

export function loadCharacters(): CharacterFile {
  if (!cachedCharacters) {
    const raw = fs.readFileSync(CHARACTERS_PATH, "utf-8");
    cachedCharacters = JSON.parse(raw) as CharacterFile;
  }
  return cachedCharacters;
}

export function getFrames(): Frame[] {
  return loadStory().frames.sort((a, b) => a.sequence - b.sequence);
}

export function getFrameById(id: string): Frame | undefined {
  return loadStory().frames.find((f) => f.id === id);
}

export function getFrameIds(): string[] {
  return getFrames().map((f) => f.id);
}

export function getAdjacentFrames(id: string): {
  prev: Frame | null;
  next: Frame | null;
} {
  const frames = getFrames();
  const index = frames.findIndex((f) => f.id === id);
  return {
    prev: index > 0 ? frames[index - 1] : null,
    next: index < frames.length - 1 ? frames[index + 1] : null,
  };
}

export function getCharacter(id: string): Character | undefined {
  return loadCharacters().characters.find((c) => c.id === id);
}

export function getTotalFrames(): number {
  return loadStory().frames.length;
}

export function getFrameIndex(id: string): number {
  const frames = getFrames();
  return frames.findIndex((f) => f.id === id);
}
