import Link from "next/link";
import { brand } from "@/lib/camcue/brand";
import { cameraBrands, cameras } from "@/lib/camcue/data/cameras";
import { creditedPhotos } from "@/lib/camcue/data/scene-photos";
import { getScene } from "@/lib/camcue/data/scenes";

export const metadata = {
  title: `Credits & sources — ${brand.name}`,
  description:
    "Where the photography and camera specification data on this site comes from, and a statement of independence from camera manufacturers.",
};

const sourceLabels: Record<string, string> = {
  unsplash: "Unsplash",
  pexels: "Pexels",
  pixabay: "Pixabay",
  licensed: "Licensed stock",
  own: "Own photography",
};

export default function CreditsPage() {
  const photos = creditedPhotos();
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
          Cameras marked <strong>not verified</strong> are listed with deliberately minimal
          capabilities, because inventing a plausible-sounding specification is worse than
          admitting we do not have one. The most recent review was {lastReview}.
        </p>
        <p>
          Specifications change with firmware. If something here contradicts your camera, your
          camera is right and we are wrong. Please tell us.
        </p>
      </section>

      <section>
        <h2>Photography</h2>
        {photos.length === 0 ? (
          <p>
            No third-party photographs are currently used on this site. Scene artwork is generated
            in code, and the camera illustrations are original drawings rather than manufacturer
            product images.
          </p>
        ) : (
          <>
            <p>
              Scene photography is licensed for commercial use. Photographers are credited below
              even where their licence does not require it.
            </p>
            <ul className="credit-list">
              {photos.map(({ sceneId, photo }) => {
                const scene = getScene(sceneId);
                return (
                  <li key={sceneId}>
                    <span className="credit-scene">{scene?.name ?? sceneId}</span>
                    <span className="credit-by">
                      {photo.photographer ?? "Unknown"}
                      {" · "}
                      {photo.url ? (
                        <a href={photo.url} target="_blank" rel="noopener noreferrer">
                          {sourceLabels[photo.source] ?? photo.source}
                        </a>
                      ) : (
                        sourceLabels[photo.source] ?? photo.source
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
        <p>
          The camera illustrations throughout the site are original artwork. No manufacturer
          product photography, press imagery or brand logo is used anywhere on this site.
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
