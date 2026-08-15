import { cameras, categoryLabels } from "@/lib/camcue/data/cameras";
import { cameraSpecPlate } from "@/lib/camcue/spec-plate";

export const metadata = {
  title: "Design review — Smarter Capture",
  robots: { index: false, follow: false },
};

// Internal design-review page. Renders spec plates straight from the camera
// data, so what you see here is exactly what ships on the cards.
const SAMPLES = [
  "dji-osmo-action-6",
  "gopro-hero13-black",
  "insta360-x5",
  "dji-osmo-pocket-3",
  "sony-a7s-iii",
  "lumix-gh7",
  "nikon-z30",
  "gopro-mission-1",
];

export default function StyleguidePage() {
  return (
    <div className="styleguide">
      <header>
        <span>DESIGN REVIEW</span>
        <h1>Spec plates</h1>
        <p>
          The card face is the camera&apos;s headline capability, pulled from its profile. Two
          cameras look alike here only when they genuinely are alike — which is the whole point,
          since a per-body-type drawing gave all 14 action cameras the same picture.
        </p>
      </header>

      <div className="sg-grid">
        {SAMPLES.map((id) => {
          const cam = cameras.find((c) => c.id === id);
          if (!cam) return null;
          const plate = cameraSpecPlate(cam);
          return (
            <figure className="sg-item" key={id}>
              <div className={`camera-visual tone-${cam.category}${plate.pending ? " pending" : ""}`}>
                <span className="plate-hero">
                  {plate.hero}
                  {plate.heroSub && <i>{plate.heroSub}</i>}
                </span>
                <span className="plate-chips">
                  {plate.chips.map((chip) => <em key={chip}>{chip}</em>)}
                </span>
              </div>
              <figcaption>
                <strong>{cam.manufacturer} {cam.model}</strong>
                <small>{categoryLabels[cam.category]} · {cam.sensor}</small>
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
