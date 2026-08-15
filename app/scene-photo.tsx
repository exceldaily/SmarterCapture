"use client";

import Image from "next/image";
import { getScenePhoto, scenePhotoPath } from "@/lib/camcue/data/scene-photos";

/**
 * Renders a scene's photograph when one has been added, and nothing at all
 * when it hasn't — the card's gradient shows through underneath.
 *
 * Scenes without photos must look deliberate rather than broken, which is why
 * this returns null instead of a placeholder.
 */
export function ScenePhoto({
  sceneId,
  sizes = "(max-width: 700px) 50vw, 25vw",
  priority = false,
}: {
  sceneId: string;
  sizes?: string;
  priority?: boolean;
}) {
  const photo = getScenePhoto(sceneId);
  if (!photo) return null;

  return (
    <Image
      className="scene-photo"
      src={scenePhotoPath(sceneId)}
      alt=""
      aria-hidden="true"
      fill
      sizes={sizes}
      priority={priority}
      style={{ objectPosition: photo.focus ?? "center" }}
    />
  );
}

export function hasScenePhoto(sceneId: string): boolean {
  return Boolean(getScenePhoto(sceneId));
}
