import Link from "next/link";
import { brand } from "@/lib/camcue/brand";
import { cameraBrands, cameras } from "@/lib/camcue/data/cameras";
import { scenes } from "@/lib/camcue/data/scenes";

export const metadata = {
  title: `Credits & sources — ${brand.name}`,
  description:
    "Where the photography and camera specification data on this site comes from, and a statement of independence from camera manufacturers.",
};

export default function CreditsPage() {
  const lastReview = cameras.reduce((latest, c) => (c.lastVerified > latest ? c.lastVerified : latest), "");

  return (
    <div className="legal-page">
      <header>
        <span>CREDITS &amp; SOURCES</span>
        <h1>Where this comes from</h1>
        <p>
          {brand.name} is built on other people&apos;s published work: manufacturers&apos;
          specifications and photographers&apos; images. This page records both.
        </p>
      </header>

      <section>
        <h2>Independence</h2>
        <p>
          {brand.name} is an independent informational guide. It is <strong>not affiliated
          with, endorsed by, sponsored by or otherwise connected to</strong>{" "}
          {cameraBrands.join(", ")} or any other camera manufacturer.
        </p>
        <p>
          Camera names, model numbers and feature names such as RockSteady, HyperSmooth,
          FlowState, S-Log3, V-Log and Film Simulation are trademarks of their respective
          owners. They appear here for one reason only: to identify which equipment a
          recommendation applies to, and to name the setting you need to select on it. No
          manufacturer has reviewed, approved or contributed to this site.
        </p>
      </section>

      <section>
        <h2>Camera specification data</h2>
        <p>
          Capability profiles for {cameras.length} cameras are compiled from publicly published
          manufacturer specifications. Each profile records where its data came from, when it was
          last reviewed, and how confident we are in it. That confidence rating is shown to you on
          every recommendation rather than hidden.
        </p>
        <p>
          A camera whose capabilities we cannot verify is <strong>not listed at all</strong>. It
          stays on file, marked unverified and withheld, until its specification can be confirmed.
          Showing it with a warning attached would put the burden on you to notice the warning, and
          a recommendation is only worth as much as the data behind it. The most recent review was
          {" "}{lastReview}.
        </p>
        <p>
          Specifications change with firmware. If something here contradicts your camera, your
          camera is right and we are wrong. Please tell us.
        </p>
      </section>

      <section>
        <h2>Imagery</h2>
        <p>
          <strong>No stock photography, no press imagery and no manufacturer product shots are
          used anywhere on this site.</strong> The camera cards across all {cameras.length}{" "}
          profiles and the artwork behind all {scenes.length} scenes are generated in code from the
          underlying data rather than illustrated with pictures.
        </p>
        <p>
          The home page banner is a single AI-generated image. The people in it are not real
          people, so nobody is depicted without their consent, and it is illustrative of the kind
          of moment this site exists to help you capture rather than a photograph of anything that
          happened.
        </p>
        <p>
          That is a deliberate choice rather than a limitation. Product photography assembled from
          mixed sources looks like exactly what it is, and manufacturer press imagery is licensed
          for editorial use rather than for promoting an independent site like this one. Drawing
          everything keeps the visual language consistent across every camera and avoids borrowing
          credibility from brands that have nothing to do with us.
        </p>
        <p>
          No manufacturer logo, product photograph or press asset appears anywhere on this site.
        </p>
      </section>

      <section>
        <h2>Corrections</h2>
        <p>
          Found a wrong specification or a photo credited incorrectly? That matters more here than
          almost anything else, because a wrong specification produces a recommendation your camera
          cannot actually follow. Get in touch and it will be fixed.
        </p>
      </section>

      <p className="legal-back">
        <Link href="/">← Back to {brand.name}</Link>
      </p>
    </div>
  );
}
