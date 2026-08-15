import type { CameraCategory, CameraProfile } from "../../types";
import { canonCameras } from "./canon";
import { djiCameras } from "./dji";
import { fujifilmCameras } from "./fujifilm";
import { goproCameras } from "./gopro";
import { insta360Cameras } from "./insta360";
import { nikonCameras } from "./nikon";
import { panasonicCameras } from "./panasonic";
import { sonyCameras } from "./sony";

export const cameras: CameraProfile[] = [
  ...djiCameras,
  ...goproCameras,
  ...insta360Cameras,
  ...sonyCameras,
  ...canonCameras,
  ...nikonCameras,
  ...fujifilmCameras,
  ...panasonicCameras,
];

export function getCamera(id: string): CameraProfile | undefined {
  return cameras.find((camera) => camera.id === id);
}

export const cameraBrands = Array.from(
  new Set(cameras.map((camera) => camera.manufacturer)),
);

export const categoryLabels: Record<CameraCategory, string> = {
  action: "Action",
  "360": "360",
  pocket: "Pocket gimbal",
  vlogging: "Vlogging",
  compact: "Compact",
  mirrorless: "Mirrorless",
  cinema: "Cinema",
};

// Browsing order — creator-first, matching how people actually shop.
export const categoryOrder: CameraCategory[] = [
  "action", "360", "pocket", "vlogging", "compact", "mirrorless", "cinema",
];

export function camerasByCategory(category: CameraCategory): CameraProfile[] {
  return cameras.filter((camera) => camera.category === category);
}

export function camerasByBrand(manufacturer: string): CameraProfile[] {
  return cameras.filter((camera) => camera.manufacturer === manufacturer);
}
