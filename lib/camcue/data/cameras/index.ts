import type { CameraProfile } from "../../types";
import { djiCameras } from "./dji";
import { goproCameras } from "./gopro";

export const cameras: CameraProfile[] = [...djiCameras, ...goproCameras];

export function getCamera(id: string): CameraProfile | undefined {
  return cameras.find((camera) => camera.id === id);
}

export const cameraBrands = Array.from(
  new Set(cameras.map((camera) => camera.manufacturer)),
);
