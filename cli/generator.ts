import fs from "fs";
import path from "path";
import OpenAI, { toFile } from "openai";
import type { Frame, Character, Story } from "../src/app/lib/types";

let _openai: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI();
  }
  return _openai;
}

/**
 * Generate a character reference image for a given view.
 * Returns the path to the saved image file.
 */
export async function generateCharacterRef(
  character: Character,
  view: string,
): Promise<string> {
  const prompt = `Character reference sheet — ${view} view. ${character.prompt}. Clean white background, single character, full body visible.`;

  const result = await getClient().images.generate({
    model: "gpt-image-1",
    prompt,
    n: 1,
    size: "1024x1024",
    quality: "high",
    output_format: "png",
  });

  const imageData = result.data![0];
  if (!imageData.b64_json) {
    throw new Error(`No image data returned for character ${character.id} (${view})`);
  }

  const outputPath = `public/characters/${character.id}-${view}.png`;
  const fullPath = path.join(process.cwd(), outputPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, Buffer.from(imageData.b64_json, "base64"));

  return outputPath;
}

/**
 * Generate all reference views for a character.
 * Returns a map of view → file path.
 */
export async function generateCharacter(
  character: Character,
): Promise<Record<string, string>> {
  const files: Record<string, string> = {};

  for (const view of character.views) {
    const filePath = await generateCharacterRef(character, view);
    files[view] = filePath;
  }

  return files;
}

/**
 * Load character reference images as Uploadable files for the edit API.
 */
async function loadCharacterRefs(charIds: string[]) {
  const files = [];

  for (const charId of charIds) {
    const refPath = path.join(
      process.cwd(),
      `public/characters/${charId}-front.png`,
    );
    if (fs.existsSync(refPath)) {
      files.push(
        await toFile(fs.createReadStream(refPath), `${charId}-front.png`, {
          type: "image/png",
        }),
      );
    }
  }

  return files;
}

/**
 * Generate a frame image, passing character reference images as input.
 * Uses images.edit() when character refs exist, images.generate() otherwise.
 */
export async function generateFrame(
  frame: Frame,
  story: Story,
): Promise<string> {
  const fullPrompt = `${frame.prompt}\n\nArt style: ${story.metadata.artStyle}`;
  const size = frame.size as "1024x1024" | "1024x1536" | "1536x1024";
  const quality = frame.quality === "high" ? "high" as const
    : frame.quality === "medium" ? "medium" as const
    : "low" as const;

  let b64: string;

  const charRefs = await loadCharacterRefs(frame.characters);

  if (charRefs.length > 0) {
    // Use images.edit() to pass character reference images
    const result = await getClient().images.edit({
      model: "gpt-image-1",
      image: charRefs.length === 1 ? charRefs[0] : charRefs,
      prompt: fullPrompt,
      n: 1,
      size,
      quality,
    });

    const imageData = result.data![0];
    if (!imageData.b64_json) {
      throw new Error(`No image data returned for frame ${frame.id}`);
    }
    b64 = imageData.b64_json;
  } else {
    // No character references — use images.generate()
    const result = await getClient().images.generate({
      model: "gpt-image-1",
      prompt: fullPrompt,
      n: 1,
      size,
      quality,
      output_format: "png",
    });

    const imageData = result.data![0];
    if (!imageData.b64_json) {
      throw new Error(`No image data returned for frame ${frame.id}`);
    }
    b64 = imageData.b64_json;
  }

  const outputPath = `public/frames/${frame.id}.png`;
  const fullPath = path.join(process.cwd(), outputPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, Buffer.from(b64, "base64"));

  return outputPath;
}
