// One-time authoring script: generates the 10 selectable profile avatars into
// public/avatars/. The DiceBear packages are devDependencies and never ship to
// users — the app serves the committed SVGs like any other static asset, so
// there are no runtime calls to DiceBear and no rate limits.
//
// Style: "critters" (by DiceBear, CC0 1.0 — no attribution required).
// The seeds are fixed, so re-running this script reproduces identical files.
//
// Usage: node scripts/generate-avatars.mjs
import { mkdir, writeFile } from "node:fs/promises";

import { Avatar, Style } from "@dicebear/core";
import critters from "@dicebear/styles/critters.json" with { type: "json" };

// Ids double as filenames (public/avatars/<id>.svg) and as seeds. These must
// stay in sync with AVATAR_IDS in lib/avatars.ts and the backend allowlist
// in Kue.Api/Constants/AvatarIds.cs.
const AVATAR_IDS = [
  "fox",
  "owl",
  "frog",
  "bee",
  "bunny",
  "panda",
  "koala",
  "raccoon",
  "hedgehog",
  "penguin",
];

const style = new Style(critters);
const outDir = new URL("../public/avatars/", import.meta.url);

await mkdir(outDir, { recursive: true });

for (const id of AVATAR_IDS) {
  const avatar = new Avatar(style, {
    seed: id,
    size: 256,
    // No backgroundColor on purpose: transparent canvas lets the app's CSS
    // tokens style the container, like the existing initials avatars.
    // Want animated critters instead? Add: animationVariant: "slow".
  });

  await writeFile(new URL(`${id}.svg`, outDir), avatar.toString());
  console.log(`wrote public/avatars/${id}.svg`);
}
