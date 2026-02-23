# The Crossing

A comic book reader web app. The storyline is authored in JSON, AI-generated images are produced via OpenAI's image generation API, and the reader is a statically-generated Next.js app deployed on Vercel.

## Project Structure

```
thecrossing/
├── story/
│   ├── story.json            # Canonical story definition (frames, prompts, captions)
│   └── characters.json       # Character definitions + visual prompts
├── cli/                      # CLI renderer tool
│   ├── render.ts             # Main CLI entry point
│   ├── hasher.ts             # Content hashing (SHA-256)
│   ├── differ.ts             # Change detection with character cascade
│   ├── generator.ts          # OpenAI image generation wrapper
│   └── manifest.ts           # Manifest read/write
├── src/app/                  # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx              # Redirects to /frame/splash
│   ├── frame/[id]/page.tsx   # Dynamic route per frame
│   ├── components/           # FrameViewer, FrameNavigation, FrameCaption, ProgressBar
│   └── lib/                  # story.ts (loader), types.ts
├── public/
│   ├── frames/               # Generated frame images
│   └── characters/           # Generated character reference images
├── render-manifest.json      # Tracks rendered state (committed)
└── specs/                    # Storyline design docs
```

## Setup

```bash
npm install
cp .env.example .env.local
# Edit .env.local and add your OpenAI API key
```

## Authoring the Story

### Characters (`story/characters.json`)

Define characters with visual prompts. Each character gets reference images generated from multiple views, ensuring visual consistency across frames.

```json
{
  "characters": [
    {
      "id": "mara",
      "name": "Mara",
      "prompt": "A woman in her 30s with short dark hair, weathered face, long leather coat...",
      "views": ["front", "side"]
    }
  ]
}
```

### Frames (`story/story.json`)

Define the story as an ordered sequence of frames. Each frame has a prompt for image generation, an optional caption for the reader, and a list of character IDs whose reference images will be used during generation.

```json
{
  "frames": [
    {
      "id": "frame-001",
      "type": "panel",
      "sequence": 1,
      "prompt": "Close-up of Mara gripping a leather satchel...",
      "caption": "It began with a decision that couldn't be undone.",
      "narrative": "Author notes (not shown to reader)",
      "chapter": "Chapter 1",
      "characters": ["mara"],
      "size": "1024x1536",
      "quality": "high"
    }
  ]
}
```

Frame types:
- **`splash`** — Title/intro card, shown with a "Begin" button
- **`panel`** — Standard comic panel with prev/next navigation

## Rendering Images

The CLI renderer generates images via OpenAI's `gpt-image-1` model. It uses content hashing to only re-render frames whose content has changed.

```bash
# Render only changed frames and characters
npm run render

# Preview what would change (no API calls)
npm run render -- --dry-run

# Force re-render everything
npm run render -- --force

# Render a specific frame
npm run render -- --frame splash

# Only render character reference images
npm run render -- --characters-only
```

### Change Detection

The renderer tracks what's been generated in `render-manifest.json`. Only fields that affect the visual output are hashed:

**Frames:** `id`, `prompt`, `size`, `quality`, `type`, `characters`
- Changing `caption`, `sequence`, `chapter`, or `narrative` does NOT trigger re-render

**Characters:** `prompt`, `views`
- Changing a character's visual description re-renders their references AND all frames that reference that character

### What triggers a re-render
1. Frame or character hash changed (content modified)
2. Image file missing from disk
3. New frame/character added
4. Character changed — all frames referencing that character cascade

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Reader Navigation

The web reader provides an immersive, full-screen comic reading experience:

- **Tap/click zones**: Left third goes back, right two-thirds goes forward
- **Keyboard**: Arrow keys and spacebar
- **Swipe**: Touch swipe left/right on mobile
- **Progress bar**: Thin bar at top shows reading progress
- **Captions**: Fade-in text overlay at the bottom of panels

### Routes

```
/                → redirects to /frame/splash
/frame/splash    → Splash screen with "Begin" button
/frame/frame-001 → Panel with prev/next navigation
/frame/frame-N   → Last panel shows "The End"
```

## Deployment

The app is designed for Vercel. All frame routes are statically generated at build time via `generateStaticParams()`. Push to deploy.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key (used by CLI renderer only, not needed at build time) |
