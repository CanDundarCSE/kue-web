// The 10 selectable profile avatars (DiceBear "critters" style, CC0 1.0).
// Ids double as seeds and filenames (public/avatars/<id>.svg). Must stay in
// sync with scripts/generate-avatars.mjs and Kue.Api/Constants/AvatarIds.cs.
export const AVATAR_IDS = [
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
] as const;

export type AvatarId = (typeof AVATAR_IDS)[number];

export function isAvatarId(value: unknown): value is AvatarId {
  return typeof value === "string" && (AVATAR_IDS as readonly string[]).includes(value);
}

export function avatarSrc(id: AvatarId): string {
  return `/avatars/${id}.svg`;
}
