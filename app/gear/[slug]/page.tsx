import { ProductGallery } from "@/app/gear/product-gallery";
import { getAccessoryMedia } from "@/lib/accessories/images";
import { GearDisclaimer } from "@/app/gear/gear-disclaimer";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, CircleAlert, Clock3, Package, ShieldCheck } from "lucide-react";
import { accessoryProducts, getAccessory } from "@/lib/accessories/catalog";
import { assessAccessoryLaunch } from "@/lib/accessories/commerce";
import { brand } from "@/lib/camcue/brand";
import { LanguageSwitcher } from "@/app/language-switcher";
import { T } from "@/app/locale-provider";
import { AccessoryVisual } from "../accessory-visual";
import { LocalizedPrice } from "../localized-price";

export function generateStaticParams() {
  return accessoryProducts.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps<"/gear/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = getAccessory(slug);
  return product
    ? { title: `${product.name} — ${brand.name}`, description: product.description }
    : { title: `Accessory not found — ${brand.name}` };
}

export default async function AccessoryPage({ params }: PageProps<"/gear/[slug]">) {
  const { slug } = await params;
  const product = getAccessory(slug);
  if (!product) notFound();

  const isReady = assessAccessoryLaunch(product.id).purchasable;
  const media = getAccessoryMedia(product.slug);

  const productUrl = `${brand.siteUrl}/gear/${product.slug}`;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${productUrl}#product`,
        name: product.name,
        description: product.description,
        url: productUrl,
        ...(media?.images?.length ? { image: media.images.map((img) => `${brand.siteUrl}${img}`) } : {}),
        brand: { "@type": "Brand", name: brand.name },
        ...(isReady && product.retailPriceUsd
          ? {
              offers: {
                "@type": "Offer",
                url: productUrl,
                price: product.retailPriceUsd.toFixed(2),
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
                shippingDetails: {
                  "@type": "OfferShippingDetails",
                  shippingDestination: { "@type": "DefinedRegion", addressCountry: "US" },
                },
              },
            }
          : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Gear", item: `${brand.siteUrl}/gear` },
          { "@type": "ListItem", position: 2, name: product.name, item: productUrl },
        ],
      },
    ],
  };

  return (
    <div className="gear-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <header className="gear-site-header">
        <Link href="/" className="gear-wordmark"><span className="gear-mark" />{brand.wordmark}</Link>
        <nav aria-label="Gear navigation"><Link href="/gear"><ArrowLeft size={15} /> <T k="gearNavAllGear" /></Link><Link href="/" ><T k="gearNavAssistant" /></Link><LanguageSwitcher /></nav>
      </header>

      <main className="product-page page-width">
        <div className="product-breadcrumb"><Link href="/gear"><T k="gearTitle" /></Link><span>/</span><span>{product.name}</span></div>
        <section className="product-hero">
          {media ? <ProductGallery media={media} name={product.name} /> : <AccessoryVisual product={product} />}
          <div className="product-summary">
            <span className="product-category">{product.category}</span>
            <h1>{product.name}</h1>
            <p>{product.description}</p>
            {product.universal && <div className="product-universal"><BadgeCheck size={17} /> Universal action-camera mount</div>}
            <div className="product-price">
              {isReady ? <strong><LocalizedPrice usd={product.retailPriceUsd!} /></strong> : <strong><T k="gearPricePending" /></strong>}
              <small>{isReady ? <T k="gearPriceShipping" /> : <T k="gearPriceUnavailable" />}</small>
            </div>
            <form method="post" action="/api/accessories/checkout">
              <input type="hidden" name="productId" value={product.id} />
              <input type="hidden" name="quantity" value="1" />
              {media?.variants && (
                <label className="product-variant">
                  <span>{media.variantPrompt ?? "Option"}</span>
                  <select name="variant" required defaultValue="">
                    <option value="" disabled>Choose…</option>
                    {media.variants.map((variant) => (
                      <option key={variant.label} value={variant.label}>{variant.label}</option>
                    ))}
                  </select>
                </label>
              )}
              <button className="product-buy" type="submit" disabled={!isReady}>{isReady ? <T k="gearBuy" /> : <T k="gearCheckoutGated" />}</button>
            </form>
            {!isReady && <p className="product-gate"><ShieldCheck size={16} /> We are confirming the exact one-unit cost, delivery window and sample quality before accepting money.</p>}
          </div>
        </section>

        <div className="product-details-grid">
          <section>
            <span>GREAT FOR</span>
            <div className="product-tags">{product.useCases.map((item) => <i key={item}>{item}</i>)}</div>
          </section>
          <section>
            <span>COMPATIBILITY</span>
            <h2>{product.mountStandard}</h2>
            <ul>{product.brandsSupported.map((item) => <li key={item}>{item}</li>)}</ul>
            <p>{product.compatibilityNote}</p>
          </section>
          <section>
            <span>WHAT&apos;S INCLUDED</span>
            <ul>{product.includedItems.map((item) => <li key={item}>{item}</li>)}</ul>
            {product.material && <p><strong>Material:</strong> {product.material}</p>}
          </section>
          <section>
            <span>IMPORTANT NOTES</span>
            <ul>{product.warnings.map((item) => <li key={item}><CircleAlert size={15} />{item}</li>)}</ul>
          </section>
        </div>

        <section className="product-shipping-note">
          <Clock3 size={21} />
          <div><span>SHIPPING + RETURNS</span><h2>Confirmed before sale, not guessed.</h2><p>Destination-specific shipping, delivery timing and the return process will appear here only after the supplier route is verified. International supplier fulfillment can occasionally be delayed, so the checkout estimate must be based on the actual destination.</p></div>
        </section>

        <section className="product-recommendation-note">
          <Package size={20} />
          <div><span>WHY SMARTER CAPTURE MAY SUGGEST IT</span><p>{product.recommendationReason}</p></div>
        </section>

        <GearDisclaimer />
      </main>
    </div>
  );
}
