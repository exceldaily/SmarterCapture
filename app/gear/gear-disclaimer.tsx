import { AlertTriangle } from "lucide-react";

/**
 * Equipment-risk disclaimer, shown on the gear catalog and every product page.
 *
 * Plain English on purpose: fake legalese impresses nobody and a court reads
 * intent either way. The promise this page makes is that the buyer, not the
 * store, is the last check before a camera hangs off any mount.
 */
export function GearDisclaimer() {
  return (
    <section className="gear-disclaimer" aria-label="Equipment risk notice">
      <div className="gear-disclaimer-head">
        <AlertTriangle size={18} />
        <h2>Your camera is your responsibility</h2>
      </div>
      <p>
        Every mount, clamp, magnet and strap here holds camera equipment, and any of them can fail
        if it is worn, badly fitted, overloaded or used beyond what it was designed for. Check the
        fit and the hold before every single use, use a safety tether wherever a drop would damage
        the camera or anything below it, and stay inside your camera maker&apos;s own limits.
      </p>
      <p>
        By purchasing, you accept that Smarter Capture is not liable for damage to cameras, other
        equipment, property or footage arising from the use, misuse or failure of an accessory.
        If an item arrives defective, don&apos;t use it — contact us and we will make it right.
      </p>
    </section>
  );
}
