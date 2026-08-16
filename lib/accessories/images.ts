// Product photography and purchase variants, keyed by slug.
//
// Every image in public/gear/ is used with the supplier's explicit
// permission, owner-confirmed 2026-08-16 (see the matching sourcing record).
// The first image in `images` is the primary shot; clean product-only frames
// are preferred over the supplier's text-covered marketing tiles.
//
// `variants` is what the customer must choose at purchase — a colour or a
// camera-fit version. The chosen label is validated server-side and travels
// through checkout metadata into the order record, so the admin queue shows
// exactly which version to order from the supplier.

export interface AccessoryVariant {
  label: string;
  image?: string;
}

export interface AccessoryMedia {
  images: string[];
  variants?: AccessoryVariant[];
  variantPrompt?: string;
}

export const accessoryMedia: Record<string, AccessoryMedia> = {
  "magnetic-quick-release-base": {
    images: [
      "/gear/magnetic-quick-release-base.jpg",
      "/gear/magnetic-quick-release-base-v1.jpg",
      "/gear/magnetic-quick-release-base-v2.jpg",
      "/gear/magnetic-quick-release-base-v3.jpg",
    ],
    variantPrompt: "Camera fit",
    variants: [
      { label: "For DJI Osmo Nano / Action 6", image: "/gear/magnetic-quick-release-base-v1.jpg" },
      { label: "For DJI Action 5 Pro / 4 / 3 + Osmo 360", image: "/gear/magnetic-quick-release-base-v2.jpg" },
      { label: "For Insta360 Ace Pro 2 / Ace Pro / X5", image: "/gear/magnetic-quick-release-base-v3.jpg" },
    ],
  },
  "folding-selfie-tripod": {
    images: ["/gear/folding-selfie-tripod-v1.jpg", "/gear/folding-selfie-tripod.jpg"],
  },
  "suction-cup-mount": {
    images: ["/gear/suction-cup-mount-v1.jpg", "/gear/suction-cup-mount.jpg"],
  },
  "backpack-strap-clip": {
    images: ["/gear/backpack-strap-clip-v1.jpg", "/gear/backpack-strap-clip.jpg"],
  },
  "pocket-lens-cover": {
    images: [
      "/gear/pocket-lens-cover-v1.jpg",
      "/gear/pocket-lens-cover-v2.jpg",
      "/gear/pocket-lens-cover-v3.jpg",
      "/gear/pocket-lens-cover.jpg",
    ],
    variantPrompt: "Colour",
    variants: [
      { label: "Black", image: "/gear/pocket-lens-cover-v1.jpg" },
      { label: "Yellow", image: "/gear/pocket-lens-cover-v2.jpg" },
      { label: "Pink", image: "/gear/pocket-lens-cover-v3.jpg" },
    ],
  },
  "wrist-lanyard": {
    images: [
      "/gear/wrist-lanyard-v1.jpg",
      "/gear/wrist-lanyard-v2.jpg",
      "/gear/wrist-lanyard-v3.jpg",
      "/gear/wrist-lanyard-v4.jpg",
      "/gear/wrist-lanyard.jpg",
    ],
    variantPrompt: "Colour",
    variants: [
      { label: "Black", image: "/gear/wrist-lanyard-v1.jpg" },
      { label: "Pink", image: "/gear/wrist-lanyard-v2.jpg" },
      { label: "Brown", image: "/gear/wrist-lanyard-v3.jpg" },
      { label: "Orange", image: "/gear/wrist-lanyard-v4.jpg" },
    ],
  },
};

export function getAccessoryMedia(slug: string): AccessoryMedia | undefined {
  return accessoryMedia[slug];
}

/** Legacy single-image map used by the compact visual. */
export const accessoryImages: Record<string, string> = Object.fromEntries(
  Object.entries(accessoryMedia).map(([slug, media]) => [slug, media.images[0]]),
);
