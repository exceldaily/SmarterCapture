/**
 * Capability validator.
 *
 * Runs the recommendation engine across every camera x scene x condition
 * combination and asserts the output is physically selectable on that camera.
 * This is the guard against the one failure CamCue cannot survive: confidently
 * recommending a mode the camera does not have.
 *
 *   npx tsx scripts/validate.ts
 */

import { cameras, pendingCameras } from "../lib/camcue/data/cameras";
import { scenes } from "../lib/camcue/data/scenes";
import { recipes } from "../lib/camcue/data/recipes";
import { recommend } from "../lib/camcue/engine";
import { accessoryProducts } from "../lib/accessories/catalog";
import { accessoryLaunchPolicies, assessAccessoryLaunch } from "../lib/accessories/commerce";
import { recommendAccessories } from "../lib/accessories/recommend";
import { accessorySourcingRecords } from "../lib/accessories/sourcing";
import { accessorySampleQueue, buildSupplierInquiry, launchMarkets } from "../lib/accessories/verification";
import { lightOptions, mountOptions } from "../lib/camcue/data/options";
import type { LightId, MountId, Scenario } from "../lib/camcue/types";

const problems: string[] = [];
const warnings: string[] = [];
let checks = 0;

function fail(msg: string) { problems.push(msg); }

// ---------- 1. static profile audit ----------
for (const cam of cameras) {
  const label = `${cam.manufacturer} ${cam.model}`;

  if (!cam.videoModes.length) fail(`${label}: no video modes`);
  for (const mode of cam.videoModes) {
    if (!mode.fps.length) fail(`${label}: mode ${mode.res} has no frame rates`);
    if (mode.fps.some((f) => f <= 0 || f > 1000)) fail(`${label}: implausible fps in ${mode.res}`);
  }
  if (!cam.stabilization.length) fail(`${label}: no stabilization entries`);
  if (!cam.colorProfiles.length) fail(`${label}: no colour profiles`);
  if (cam.iso.min >= cam.iso.max) fail(`${label}: ISO range is inverted`);

  const ceil = cam.recommendedIsoCeiling;
  if (ceil) {
    if (!(ceil.bright <= ceil.normal && ceil.normal <= ceil.low)) {
      fail(`${label}: ISO ceilings are not ordered bright <= normal <= low`);
    }
    if (ceil.low > cam.iso.max) fail(`${label}: low-light ISO ceiling exceeds the camera maximum`);
  }

  // Interchangeable-lens bodies must not claim a fixed aperture value.
  if (cam.lensMount && cam.aperture?.type === "fixed") {
    fail(`${label}: has a lens mount but declares a fixed aperture`);
  }
  // Fixed-lens cameras should state what the aperture actually is.
  if (!cam.lensMount && cam.aperture && !cam.aperture.value) {
    warnings.push(`${label}: fixed-lens camera has no aperture value recorded`);
  }

  // A stabilization mode that excludes every resolution is a data error.
  for (const stab of cam.stabilization) {
    if (stab.resExclude?.length) {
      const remaining = cam.videoModes.filter((m) => !stab.resExclude!.some((r) => m.res.startsWith(r)));
      if (!remaining.length) fail(`${label}: stabilization "${stab.name}" is excluded from every resolution`);
    }
  }

  // The product must never offer a camera whose capabilities are unverified:
  // a recommendation is only as trustworthy as the data behind it.
  if (cam.confidence === "unverified") {
    fail(`${label}: unverified profile is being shipped — it must be withheld until verified`);
  }

  if (!cam.officialSource) {
    warnings.push(`${label}: no officialSource recorded`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cam.lastVerified)) fail(`${label}: lastVerified is not an ISO date`);
}

// ---------- 2. engine output audit ----------
const lights = lightOptions.map((l) => l.id as LightId);
const mounts = mountOptions.map((m) => m.id as MountId);

for (const cam of cameras) {
  for (const scene of scenes) {
    // Sample the condition space rather than exploding it: every light, and a
    // rotating mount so all mounts get covered across the scene list.
    for (const light of lights) {
      const mount = mounts[(scenes.indexOf(scene) + lights.indexOf(light)) % mounts.length];
      const scenario: Scenario = { cameraId: cam.id, sceneId: scene.id, light, mount };
      const rec = recommend(cam, scene, scenario);
      checks += 1;

      const label = `${cam.model} / ${scene.name} / ${light} / ${mount}`;
      const resValue = rec.settings.find((s) => s.key === "resolution")?.value ?? "";
      const fpsValue = parseInt(rec.settings.find((s) => s.key === "fps")?.value ?? "0", 10);

      // The recommended resolution + frame rate must exist together on this camera.
      // A resolution may appear as several entries (e.g. uncropped 4K/24-30 and
      // cropped 4K/60), so the camera supports the union of their frame rates.
      const modes = cam.videoModes.filter((m) => m.res === resValue);
      if (!modes.length) {
        fail(`${label}: recommended resolution "${resValue}" is not in the camera profile`);
      } else if (!modes.some((m) => m.fps.includes(fpsValue))) {
        fail(`${label}: ${resValue} does not support ${fpsValue} FPS on this camera`);
      }

      // The recommended stabilization mode must exist and be legal at that res/fps.
      const stabValue = rec.settings.find((s) => s.key === "stabilization")?.value;
      if (stabValue) {
        const stab = cam.stabilization.find((s) => s.name === stabValue);
        if (!stab) {
          fail(`${label}: stabilization "${stabValue}" is not in the camera profile`);
        } else {
          if (stab.maxFps && fpsValue > stab.maxFps) {
            fail(`${label}: "${stab.name}" is not available at ${fpsValue} FPS (max ${stab.maxFps})`);
          }
          if (stab.resExclude?.some((r) => resValue.startsWith(r))) {
            fail(`${label}: "${stab.name}" is not available at ${resValue}`);
          }
        }
      }

      // FOV must be a real mode, and must never be offered on a camera that has none.
      const fovValue = rec.settings.find((s) => s.key === "fov")?.value;
      if (fovValue && !cam.fovModes?.some((f) => f.name === fovValue)) {
        fail(`${label}: field of view "${fovValue}" is not in the camera profile`);
      }
      if (!cam.fovModes?.length && fovValue) {
        fail(`${label}: FOV recommended for a camera with no FOV modes`);
      }

      // Colour profile must exist.
      const colorValue = rec.settings.find((s) => s.key === "color")?.value;
      if (colorValue && !cam.colorProfiles.some((p) => p.name === colorValue)) {
        fail(`${label}: colour profile "${colorValue}" is not in the camera profile`);
      }

      // ISO must sit inside the camera's real range.
      const isoValue = rec.settings.find((s) => s.key === "iso")?.value ?? "";
      const [isoMin, isoMax] = isoValue.split("–").map((v) => parseInt(v, 10));
      if (Number.isFinite(isoMin) && isoMin < cam.iso.min) fail(`${label}: ISO floor ${isoMin} is below the camera minimum`);
      if (Number.isFinite(isoMax) && isoMax > cam.iso.max) fail(`${label}: ISO ceiling ${isoMax} exceeds the camera maximum`);

      // Aperture must never be offered on a body with no aperture control.
      if (!cam.aperture && rec.proSettings.some((s) => s.key === "aperture")) {
        fail(`${label}: aperture shown for a camera with no aperture control`);
      }
      // Pre-record must never be offered on a camera without it.
      if (!cam.preRecord && rec.settings.some((s) => s.key === "preRecord")) {
        fail(`${label}: Pre-Record recommended on a camera that has no such feature`);
      }
      // Every recommendation needs its human explanation.
      if (!rec.whyItWorks.trim()) fail(`${label}: empty "why this works" text`);
      if (!rec.mistakes.length) fail(`${label}: no "don't mess this up" advice`);
    }
  }
}

// ---------- 2b. withheld profiles ----------
// These are not shipped, but they must still be honest: no invented modes,
// and a note saying what needs checking.
for (const cam of pendingCameras) {
  const label = `${cam.manufacturer} ${cam.model} (withheld)`;
  if (cam.videoModes.length > 2 || cam.colorProfiles.some((p) => p.log)) {
    fail(`${label}: unverified profile carries speculative capabilities`);
  }
  if (!cam.verifyNote) fail(`${label}: unverified profile has no verifyNote`);
}

// ---------- 3. recipe audit ----------
for (const recipe of recipes) {
  if (!cameras.some((c) => c.id === recipe.cameraId)) {
    fail(`Recipe "${recipe.name}" points at unknown camera ${recipe.cameraId}`);
  }
  if (!scenes.some((s) => s.id === recipe.scenario.sceneId)) {
    fail(`Recipe "${recipe.name}" points at unknown scene ${recipe.scenario.sceneId}`);
  }
}

// ---------- 4. scene feature-link audit ----------
const sceneIds = new Set(scenes.map((s) => s.id));
for (const cam of cameras) {
  for (const feature of cam.specialFeatures) {
    for (const id of feature.sceneIds ?? []) {
      if (!sceneIds.has(id)) {
        warnings.push(`${cam.model}: feature "${feature.name}" references unknown scene "${id}"`);
      }
    }
  }
}

// ---------- 5. accessory sourcing + recommendation audit ----------
const accessoryIds = new Set<string>();
const accessorySlugs = new Set<string>();
const sourcingProductIds = new Set(accessorySourcingRecords.map((record) => record.productId));

for (const product of accessoryProducts) {
  if (accessoryIds.has(product.id)) fail(`Accessory has duplicate id "${product.id}"`);
  if (accessorySlugs.has(product.slug)) fail(`Accessory has duplicate slug "${product.slug}"`);
  accessoryIds.add(product.id);
  accessorySlugs.add(product.slug);

  if (!sourcingProductIds.has(product.id)) fail(`${product.name}: no sourcing record`);
  if (product.catalogStatus === "ready" && product.retailPriceUsd === null) {
    fail(`${product.name}: marked ready without an approved retail price`);
  }
  if (product.catalogStatus !== "ready" && product.retailPriceUsd !== null) {
    fail(`${product.name}: carries a public retail price before it is ready`);
  }
  const launch = assessAccessoryLaunch(product.id);
  if (product.catalogStatus !== "ready" && launch.purchasable) {
    fail(`${product.name}: checkout gate opened before the catalog item was ready`);
  }
  if (product.catalogStatus === "ready" && !launch.purchasable) {
    fail(`${product.name}: marked ready while checkout launch gates remain: ${launch.blockers.join("; ")}`);
  }
  if (product.universal && /dependent|supplier/i.test(product.mountStandard)) {
    fail(`${product.name}: universal badge is attached to an unverified mount description`);
  }
  for (const id of product.recommendationSceneIds) {
    if (!sceneIds.has(id)) fail(`${product.name}: recommendation references unknown scene "${id}"`);
  }
}

for (const [productId, policy] of Object.entries(accessoryLaunchPolicies)) {
  if (!policy) continue;
  if (!accessoryIds.has(productId)) fail(`Launch policy points at unknown accessory "${productId}"`);
  if (policy.productId !== productId) fail(`${productId}: launch policy productId does not match its key`);
  if (policy.allowedCountries.length === 0) fail(`${productId}: launch policy has no verified shipping countries`);
  if (policy.deliveryBusinessDays.minimum < 1 || policy.deliveryBusinessDays.maximum < policy.deliveryBusinessDays.minimum) {
    fail(`${productId}: launch delivery range is invalid`);
  }
}

for (const item of accessorySampleQueue) {
  const inquiry = buildSupplierInquiry(item.product.id);
  if (!inquiry.includes(item.supplier.supplierProductId)) fail(`${item.product.name}: supplier inquiry omits the exact product ID`);
  for (const market of launchMarkets) {
    if (!inquiry.includes(market.testDestination)) fail(`${item.product.name}: supplier inquiry omits ${market.country}`);
  }
}

for (const record of accessorySourcingRecords) {
  if (!accessoryIds.has(record.productId)) fail(`Sourcing record points at unknown product "${record.productId}"`);
  if (!record.candidates.length) fail(`${record.productId}: no supplier candidate`);
  for (const source of record.candidates) {
    if (!/^https:\/\/www\.alibaba\.com\/product-detail\//.test(source.alibabaProductUrl)) {
      fail(`${record.productId}: supplier source is not an exact Alibaba product-detail URL`);
    }
  }
  if (record.recommendedRetailPriceUsd !== null && record.estimatedLandedCostUsd === null) {
    fail(`${record.productId}: retail price approved without a landed cost`);
  }
}

for (const scene of scenes) {
  for (const mount of mounts) {
    const suggestions = recommendAccessories(scene, mount);
    if (suggestions.length > 3) fail(`${scene.id}/${mount}: more than 3 accessory suggestions`);
    if (suggestions.some((product) => product.catalogStatus === "future-bulk")) {
      fail(`${scene.id}/${mount}: future-bulk product appears in customer recommendations`);
    }
  }
}

// ---------- report ----------
console.log(`\nSmarter Capture capability validation`);
console.log(`  cameras:      ${cameras.length} shipped, ${pendingCameras.length} withheld`);
console.log(`  scenes:       ${scenes.length}`);
console.log(`  combinations: ${checks}`);
console.log(`  accessories:  ${accessoryProducts.length} products, ${accessorySourcingRecords.length} sourcing records`);
console.log(`  warnings:     ${warnings.length}`);
console.log(`  failures:     ${problems.length}\n`);

if (warnings.length) {
  console.log("Warnings (non-blocking):");
  for (const w of Array.from(new Set(warnings)).slice(0, 40)) console.log(`  - ${w}`);
  console.log("");
}

if (problems.length) {
  console.log("FAILURES:");
  for (const p of Array.from(new Set(problems)).slice(0, 60)) console.log(`  x ${p}`);
  console.log("");
  process.exit(1);
}

console.log("All recommendations are selectable on their camera.\n");
