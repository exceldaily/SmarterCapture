"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CircleAlert } from "lucide-react";
import { accessoryCategories, accessoryProducts } from "@/lib/accessories/catalog";
import type { AccessoryCategory } from "@/lib/accessories/types";
import { AccessoryVisual } from "./accessory-visual";

export function GearCatalog() {
  const [category, setCategory] = useState<"all" | AccessoryCategory>("all");
  const products = useMemo(
    () => accessoryProducts.filter((product) => category === "all" || product.category === category),
    [category],
  );

  return (
    <>
      <div className="gear-filter" aria-label="Accessory categories">
        {accessoryCategories.map((item) => (
          <button
            key={item.id}
            className={category === item.id ? "active" : ""}
            onClick={() => setCategory(item.id)}
            aria-pressed={category === item.id}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="gear-grid">
        {products.map((product) => (
          <article className="gear-card" key={product.id}>
            <AccessoryVisual product={product} />
            <div className="gear-card-copy">
              <div className="gear-card-kicker">
                <span>{product.category}</span>
                {product.universal && <i><BadgeCheck size={13} /> Universal action-camera mount</i>}
              </div>
              <h2>{product.name}</h2>
              <p>{product.description}</p>
              <div className="gear-compatibility">
                {product.brandsSupported.slice(0, 3).map((brand) => <span key={brand}>{brand}</span>)}
              </div>
              <div className="gear-use-cases">
                <small>Best for</small>
                <p>{product.useCases.slice(0, 4).join(" · ")}</p>
              </div>
              <div className="gear-card-foot">
                <span className={`gear-status ${product.catalogStatus}`}>
                  {product.catalogStatus === "ready" ? "Ready to order" : product.catalogStatus === "future-bulk" ? "Future bulk candidate" : "Sourcing review"}
                </span>
                <Link href={`/gear/${product.slug}`}>View accessory <ArrowRight size={15} /></Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="gear-honesty-note">
        <CircleAlert size={18} />
        <p><strong>Why there are no guessed prices.</strong> A product only becomes buyable after its exact one-unit variant, destination shipping, delivery window and sample quality are confirmed. Displayed wholesale “from” prices are not treated as retail-ready costs.</p>
      </div>
    </>
  );
}
