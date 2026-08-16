import type { MetadataRoute } from "next";
import { brand } from "@/lib/camcue/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${brand.name} — Camera Settings, Solved`,
    short_name: brand.name,
    description: brand.tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#f0efea",
    theme_color: "#0a0b0c",
    orientation: "portrait",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
