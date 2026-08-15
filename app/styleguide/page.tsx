import { CameraArt } from "../camera-art";
import { cameras, categoryLabels, categoryOrder } from "@/lib/camcue/data/cameras";
import type { CameraCategory } from "@/lib/camcue/types";

export const metadata = {
  title: "Design review — Smarter Capture",
  robots: { index: false, follow: false },
};

// Internal design-review page. Renders the camera illustrations from the same
// source the product uses, so it can never drift from what ships.
export default function StyleguidePage() {
  return (
    <div className="styleguide">
      <header>
        <span>DESIGN REVIEW</span>
        <h1>Camera art</h1>
        <p>
          One silhouette per body type, drawn from scratch — no manufacturer photography.
          These replace the generic icon that used to sit on every card.
        </p>
      </header>

      <div className="sg-grid">
        {categoryOrder.map((category) => {
          const count = cameras.filter((c) => c.category === category).length;
          return (
            <figure key={category} className="sg-item">
              <div className={`camera-visual tone-${category}`}>
                <CameraArt category={category as CameraCategory} />
              </div>
              <figcaption>
                <strong>{categoryLabels[category]}</strong>
                <small>{count} camera{count === 1 ? "" : "s"}</small>
              </figcaption>
            </figure>
          );
        })}
      </div>

      <section className="sg-swatches">
        <h2>Palette</h2>
        <div>
          {[
            ["--ink", "Chassis"],
            ["--bone", "Paper"],
            ["--signal", "Signal"],
            ["--aqua", "Aqua"],
            ["--aqua-deep", "Aqua deep"],
            ["--good", "Good"],
            ["--warn", "Warn"],
          ].map(([token, label]) => (
            <span key={token}>
              <i style={{ background: `var(${token})` }} />
              {label}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
