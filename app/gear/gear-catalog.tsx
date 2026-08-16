"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CircleAlert } from "lucide-react";
import { accessoryCategories, accessoryProducts } from "@/lib/accessories/catalog";
import type { AccessoryCategory } from "@/lib/accessories/types";
import type { DictionaryKey } from "@/lib/i18n";
import { useT } from "@/app/locale-provider";
import { AccessoryVisual } from "./accessory-visual";

// Translation keys for the category rail; the catalog itself stays
// English-only data (see lib/i18n/index.ts for the v1 scope decision).
const categoryKey: Record<"all" | AccessoryCategory, DictionaryKey> = {
  all: "gearCatAll",
  pov: "gearCatPov",
  water: "gearCatWater",
  travel: "gearCatTravel",
  vehicle: "gearCatVehicle",
  sports: "gearCatSports",
  everyday: "gearCatEveryday",
  mounts: "gearCatMounts",
};

export function GearCatalog() {
  const t = useT();
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
            {t(categoryKey[item.id])}
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
                  {product.catalogStatus === "ready" ? t("gearStatusReady") : product.catalogStatus === "future-bulk" ? t("gearStatusFuture") : t("gearStatusResearch")}
                </span>
                <Link href={`/gear/${product.slug}`}>{t("gearView")} <ArrowRight size={15} /></Link>
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
