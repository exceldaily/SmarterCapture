import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CamCue — Camera Settings, Solved",
    short_name: "CamCue",
    description: "Compatible camera settings for the shot in front of you.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f3ee",
    theme_color: "#0b0d0c",
    orientation: "portrait",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
