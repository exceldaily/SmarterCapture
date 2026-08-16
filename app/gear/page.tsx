import { GearDisclaimer } from "@/app/gear/gear-disclaimer";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Camera, ShieldCheck } from "lucide-react";
import { brand } from "@/lib/camcue/brand";
import { LanguageSwitcher } from "@/app/language-switcher";
import { T } from "@/app/locale-provider";
import { GearCatalog } from "./gear-catalog";

export const metadata: Metadata = {
  title: `Suggested Accessories — ${brand.name}`,
  description: "Useful, compatibility-aware gear for getting more out of an action camera.",
};

export default function GearPage() {
  return (
    <div className="gear-page">
      <header className="gear-site-header">
        <Link href="/" className="gear-wordmark"><span className="gear-mark" />{brand.wordmark}</Link>
        <nav aria-label="Gear navigation"><Link href="/"><ArrowLeft size={15} /> <T k="gearNavAssistant" /></Link><Link href="/gear" className="active"><T k="gearNavGear" /></Link><LanguageSwitcher /></nav>
      </header>

      <main className="page-width">
        <section className="gear-hero">
          <div>
            <span><T k="gearEyebrow" /></span>
            <h1><T k="gearTitle" /></h1>
            <p><T k="gearSub" /></p>
          </div>
          <aside>
            <ShieldCheck size={22} />
            <div><strong>Evidence before checkout</strong><p>Compatibility comes from the source listing. Price and shipping stay unpublished until the one-unit economics are confirmed.</p></div>
          </aside>
        </section>

        <section className="gear-intro-strip">
          <span><Camera size={16} /> Six products live, more in research</span>
          <span>No batteries, filters or model-specific fit guesswork</span>
          <span>Product photos used with supplier permission</span>
        </section>

        <GearCatalog />

        <GearDisclaimer />
      </main>

      <footer className="gear-footer"><span>{brand.domain}</span><p>The camera assistant remains the product. Gear is an optional, low-pressure recommendation.</p></footer>
    </div>
  );
}
