"use client";

import { useState } from "react";
import type { AccessoryMedia } from "@/lib/accessories/images";

/**
 * Product photo gallery: primary image with thumbnail switching. Rendered
 * only for products that have approved supplier photography.
 */
export function ProductGallery({ media, name }: { media: AccessoryMedia; name: string }) {
  const [active, setActive] = useState(0);
  const images = media.images;

  return (
    <div className="product-gallery">
      <div className="product-gallery-main">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[active]} alt={name} />
      </div>
      {images.length > 1 && (
        <div className="product-gallery-thumbs" role="tablist" aria-label="Product photos">
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              role="tab"
              aria-selected={index === active}
              className={index === active ? "active" : ""}
              onClick={() => setActive(index)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
