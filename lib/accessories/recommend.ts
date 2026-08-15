import type { MountId, SceneDef } from "@/lib/camcue/types";
import { accessoryProducts } from "./catalog";

const launchableStatuses = new Set(["researching", "ready"]);

export function recommendAccessories(scene: SceneDef, mount: MountId) {
  return accessoryProducts
    .filter((product) => launchableStatuses.has(product.catalogStatus))
    .map((product) => {
      const sceneMatch = product.recommendationSceneIds.includes(scene.id);
      const mountMatch = product.recommendationMounts.includes(mount);
      const waterMatch = Boolean(scene.water) && product.category === "water";
      const score = (sceneMatch ? 4 : 0) + (mountMatch ? 2 : 0) + (waterMatch ? 3 : 0);
      return { product, score };
    })
    .filter(({ score }) => score >= 2)
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name))
    .slice(0, 3)
    .map(({ product }) => product);
}
