// Scene photography manifest.
//
// A scene shows a photo only when it has an entry here. That is deliberate:
// the entry carries the licence and credit, so a photo cannot appear on the
// site without its provenance being recorded and rendered on /credits.
//
// To add a photo:
//   1. Drop the file at  public/scenes/<scene-id>.jpg   (scene ids live in
//      data/scenes.ts — e.g. "fishing", "night-market", "motorcycle")
//   2. Add an entry below with where it came from.
// See public/scenes/README.md for sourcing rules and per-scene search terms.

export type PhotoSource =
  | "unsplash"
  | "pexels"
  | "pixabay"
  | "own" // shot by us — no attribution needed
  | "licensed"; // paid stock; keep the licence reference in `note`

export interface ScenePhoto {
  /** Photographer's name, as the source lists it. Omit for own photography. */
  photographer?: string;
  source: PhotoSource;
  /** Link back to the original. Good manners on free stock, required by some. */
  url?: string;
  /** Licence reference or any restriction worth remembering. */
  note?: string;
  /**
   * Where the subject sits, for object-position. Photos are cropped hard on
   * small cards, and a centred crop often cuts the subject out.
   */
  focus?: "top" | "center" | "bottom";
}

/**
 * sceneId -> photo credit. The file itself is public/scenes/<sceneId>.jpg
 *
 * Empty to start. Every scene falls back to its generated gradient until a
 * photo is added, so the site is complete either way.
 */
export const scenePhotos: Record<string, ScenePhoto> = {
  // Example of the shape — delete or replace once you add real files:
  //
  // fishing: {
  //   photographer: "Jane Doe",
  //   source: "unsplash",
  //   url: "https://unsplash.com/photos/xxxxxxx",
  //   focus: "center",
  // },
};

export function getScenePhoto(sceneId: string): ScenePhoto | undefined {
  return scenePhotos[sceneId];
}

export function scenePhotoPath(sceneId: string): string {
  return `/scenes/${sceneId}.jpg`;
}

/** Credits that need rendering on /credits, in scene order. */
export function creditedPhotos(): { sceneId: string; photo: ScenePhoto }[] {
  return Object.entries(scenePhotos)
    .filter(([, photo]) => photo.source !== "own")
    .map(([sceneId, photo]) => ({ sceneId, photo }));
}

export const photoCount = () => Object.keys(scenePhotos).length;
