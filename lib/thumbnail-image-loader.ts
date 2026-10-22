/**
 * Custom next/image loader for catalog thumbnails.
 *
 * Vercel bills one image transformation per unique variant (source + width +
 * quality + normalized Accept header). A catalog renders the same artwork at
 * many widths and every new title is a new source URL, so thumbnails burn
 * through the Hobby image-optimization allowance quickly while gaining almost
 * nothing: TMDB, AniList and IGDB already serve fixed-width presets from their
 * own CDNs.
 *
 * This loader maps the requested width onto the provider's nearest preset and
 * hands the URL straight to the browser, so `/_next/image` is never involved.
 * Anything we don't recognise (local assets, future hosts) is returned as-is.
 *
 * Large art such as the detail-page banner intentionally stays on a plain
 * <img>, where the source is already the full-size asset.
 */

export type ThumbnailLoaderArgs = {
  src: string;
  width: number;
  quality?: number;
};

const TMDB_WIDTHS = [92, 154, 185, 342, 500] as const;

/** Smallest TMDB preset that still covers `width`; w500 is the practical cap. */
function tmdbPreset(width: number): string {
  for (const preset of TMDB_WIDTHS) {
    if (width <= preset) return `w${preset}`;
  }
  return `w${TMDB_WIDTHS[TMDB_WIDTHS.length - 1]}`;
}

function mapTmdb(src: string, width: number): string {
  // https://image.tmdb.org/t/p/w500/<file>
  return src.replace(/\/t\/p\/[^/]+\//, `/t/p/${tmdbPreset(width)}/`);
}

function mapAniList(src: string, width: number): string {
  // https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/<file>
  // AniList only serves small (100w), medium (230w) and large (460w); xlarge
  // and extraLarge 404 on most covers, so `large` is the ceiling.
  const preset = width <= 108 ? "small" : width <= 270 ? "medium" : "large";
  return src.replace(/\/cover\/(?:small|medium|large|extraLarge)\//, `/cover/${preset}/`);
}

function mapIgdb(src: string, width: number): string {
  // https://images.igdb.com/igdb/image/upload/t_cover_big/<hash>.jpg
  const preset = width <= 90 ? "t_cover_small" : width <= 264 ? "t_cover_big" : "t_cover_big_2x";
  return src.replace(/\/upload\/t_[^/]+\//, `/upload/${preset}/`);
}

export default function thumbnailImageLoader({ src, width }: ThumbnailLoaderArgs): string {
  if (src.startsWith("https://image.tmdb.org/")) return mapTmdb(src, width);
  if (src.startsWith("https://s4.anilist.co/")) return mapAniList(src, width);
  if (src.startsWith("https://images.igdb.com/")) return mapIgdb(src, width);
  return src;
}
