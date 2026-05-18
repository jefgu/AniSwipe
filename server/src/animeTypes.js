export const ALLOWED_ANIME_TYPES = [
  "TV",
  "Movie",
  "OVA",
  "ONA",
  "Special",
  "TV Special",
];

const NORMALIZED_ALLOWED_TYPES = new Set(
  ALLOWED_ANIME_TYPES.map((type) => type.toLowerCase())
);

export function isAllowedAnimeType(type) {
  return typeof type === "string" && NORMALIZED_ALLOWED_TYPES.has(type.toLowerCase());
}

export function allowedAnimeTypeFilter() {
  return { type: { $in: ALLOWED_ANIME_TYPES } };
}
