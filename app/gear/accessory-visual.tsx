import { accessoryImages } from "@/lib/accessories/images";
import type { AccessoryProduct } from "@/lib/accessories/types";

export function AccessoryVisual({ product, compact = false }: { product: AccessoryProduct; compact?: boolean }) {
  const photo = accessoryImages[product.slug];
  if (photo) {
    return (
      <div className={`gear-visual has-photo${compact ? " compact" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt={product.name} loading="lazy" />
      </div>
    );
  }
  return (
    <div className={`gear-visual tone-${product.category}${compact ? " compact" : ""}`} aria-hidden="true">
      <span className="gear-visual-code">{product.shortName.split(" ").map((word) => word[0]).join("").slice(0, 3)}</span>
      <span className="gear-visual-ring" />
      <span className="gear-visual-axis horizontal" />
      <span className="gear-visual-axis vertical" />
      <span className="gear-visual-meta">{product.mountStandard}</span>
    </div>
  );
}
