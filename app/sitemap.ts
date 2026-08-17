import type { MetadataRoute } from "next";
import { cameras } from "@/lib/camcue/data/cameras";
import { accessoryProducts } from "@/lib/accessories/catalog";
import { DATA_UPDATED_AT, SITE } from "@/lib/gateway/core";

export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date(DATA_UPDATED_AT);
  return [
    { url: `${SITE}/`, lastModified: updated, priority: 1 },
    { url: `${SITE}/gear`, lastModified: updated, priority: 0.9 },
    ...accessoryProducts
      .filter((p) => p.catalogStatus === "ready")
      .map((p) => ({ url: `${SITE}/gear/${p.slug}`, lastModified: updated, priority: 0.8 })),
    { url: `${SITE}/ai`, lastModified: updated, priority: 0.8 },
    { url: `${SITE}/credits`, lastModified: updated, priority: 0.3 },
    { url: `${SITE}/md/cameras`, lastModified: updated, priority: 0.6 },
    { url: `${SITE}/md/scenarios`, lastModified: updated, priority: 0.6 },
    ...cameras.map((cam) => ({
      url: `${SITE}/md/cameras/${cam.id}`,
      lastModified: new Date(cam.lastVerified),
      priority: 0.7,
    })),
  ];
}
