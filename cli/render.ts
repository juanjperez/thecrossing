import fs from "fs";
import path from "path";
import { Command } from "commander";
import ora from "ora";
import type { Story, CharacterFile, RenderManifest } from "../src/app/lib/types";
import { hashFrame, hashCharacter } from "./hasher";
import { diffCharacters, diffFrames } from "./differ";
import { loadManifest, saveManifest } from "./manifest";
import { generateCharacter, generateFrame } from "./generator";

const STORY_PATH = path.join(process.cwd(), "story/story.json");
const CHARACTERS_PATH = path.join(process.cwd(), "story/characters.json");

function loadStoryFile(): Story {
  return JSON.parse(fs.readFileSync(STORY_PATH, "utf-8")) as Story;
}

function loadCharactersFile(): CharacterFile {
  return JSON.parse(fs.readFileSync(CHARACTERS_PATH, "utf-8")) as CharacterFile;
}

const program = new Command();

program
  .name("render")
  .description("Render comic frames using OpenAI image generation")
  .option("--force", "Force re-render all frames and characters")
  .option("--dry-run", "Show what would change without rendering")
  .option("--frame <id>", "Render a specific frame only")
  .option("--characters-only", "Only render character reference images")
  .action(async (opts) => {
    const story = loadStoryFile();
    const characters = loadCharactersFile();
    let manifest = loadManifest();

    console.log(`\n  The Crossing — Renderer\n`);
    console.log(`  Story: "${story.title}" v${story.version}`);
    console.log(`  Frames: ${story.frames.length}`);
    console.log(`  Characters: ${characters.characters.length}\n`);

    // ── Step 1: Diff characters ──
    const changedCharacterIds = new Set<string>();

    if (opts.force) {
      characters.characters.forEach((c) => changedCharacterIds.add(c.id));
    }

    const charDiff = opts.force
      ? { toRender: characters.characters, toDelete: [] }
      : diffCharacters(characters.characters, manifest);

    charDiff.toRender.forEach((c) => changedCharacterIds.add(c.id));

    if (charDiff.toRender.length > 0) {
      console.log(`  Characters to render: ${charDiff.toRender.map((c) => c.id).join(", ")}`);
    }
    if (charDiff.toDelete.length > 0) {
      console.log(`  Characters to delete: ${charDiff.toDelete.join(", ")}`);
    }

    // ── Step 2: Diff frames ──
    let frameDiff = { toRender: story.frames, toDelete: [] as string[] };

    if (!opts.charactersOnly) {
      if (opts.frame) {
        // Single frame mode
        const targetFrame = story.frames.find((f) => f.id === opts.frame);
        if (!targetFrame) {
          console.error(`  Frame "${opts.frame}" not found in story.json`);
          process.exit(1);
        }
        frameDiff = { toRender: [targetFrame], toDelete: [] };
      } else if (!opts.force) {
        frameDiff = diffFrames(story.frames, manifest, changedCharacterIds);
      }
    } else {
      frameDiff = { toRender: [], toDelete: [] };
    }

    if (frameDiff.toRender.length > 0) {
      console.log(`  Frames to render: ${frameDiff.toRender.map((f) => f.id).join(", ")}`);
    }
    if (frameDiff.toDelete.length > 0) {
      console.log(`  Frames to delete: ${frameDiff.toDelete.join(", ")}`);
    }

    const totalWork = charDiff.toRender.length + frameDiff.toRender.length;

    if (totalWork === 0 && charDiff.toDelete.length === 0 && frameDiff.toDelete.length === 0) {
      console.log("\n  Everything is up to date. Nothing to render.\n");
      return;
    }

    // ── Dry run: stop here ──
    if (opts.dryRun) {
      console.log(`\n  Dry run complete. ${totalWork} item(s) would be rendered.\n`);
      return;
    }

    // ── Step 3: Render characters ──
    for (const char of charDiff.toRender) {
      const spinner = ora(`  Rendering character: ${char.name} (${char.views.join(", ")})`).start();
      try {
        const files = await generateCharacter(char);
        manifest.characters[char.id] = {
          hash: hashCharacter(char),
          renderedAt: new Date().toISOString(),
          files,
        };
        saveManifest(manifest);
        spinner.succeed(`  Character rendered: ${char.name}`);
      } catch (err) {
        spinner.fail(`  Failed to render character: ${char.name}`);
        console.error(err);
        process.exit(1);
      }
    }

    // ── Step 4: Delete removed characters ──
    for (const charId of charDiff.toDelete) {
      const entry = manifest.characters[charId];
      if (entry) {
        for (const filePath of Object.values(entry.files)) {
          const fullPath = path.join(process.cwd(), filePath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`  Deleted: ${filePath}`);
          }
        }
        delete manifest.characters[charId];
      }
    }

    // ── Step 5: Render frames ──
    for (const frame of frameDiff.toRender) {
      const spinner = ora(`  Rendering frame: ${frame.id}`).start();
      try {
        const file = await generateFrame(frame, story);
        manifest.frames[frame.id] = {
          hash: hashFrame(frame),
          renderedAt: new Date().toISOString(),
          file,
          promptSnippet: frame.prompt.slice(0, 80) + "...",
        };
        manifest.totalFrames = story.frames.length;
        saveManifest(manifest);
        spinner.succeed(`  Frame rendered: ${frame.id}`);
      } catch (err) {
        spinner.fail(`  Failed to render frame: ${frame.id}`);
        console.error(err);
        process.exit(1);
      }
    }

    // ── Step 6: Delete removed frames ──
    for (const frameId of frameDiff.toDelete) {
      const entry = manifest.frames[frameId];
      if (entry) {
        const fullPath = path.join(process.cwd(), entry.file);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log(`  Deleted: ${entry.file}`);
        }
        delete manifest.frames[frameId];
      }
    }

    manifest.totalFrames = story.frames.length;
    saveManifest(manifest);

    console.log(`\n  Done. Rendered ${totalWork} item(s).\n`);
  });

program.parse();
