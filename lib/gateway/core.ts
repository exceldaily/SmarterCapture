// Gateway domain layer.
//
// Every machine-facing interface (REST /api/v1, MCP /mcp, markdown mirrors,
// the /ai portal) adapts THIS module, which in turn calls the same
// deterministic engine the human UI uses (lib/camcue/engine.ts). There is no
// second recommendation implementation anywhere.
//
// Nothing in this layer invents camera capabilities: cameras, scenes and
// recommendations all come from the verified data modules, and every response
// carries provenance (source, data_version, updated_at, canonical_url).

import { createHash } from "node:crypto";
import { brand } from "@/lib/camcue/brand";
import { cameras, categoryLabels, getCamera } from "@/lib/camcue/data/cameras";
import { getScene, scenes } from "@/lib/camcue/data/scenes";
import { lightOptions, mountOptions, movementOptions, platformOptions } from "@/lib/camcue/data/options";
import { recommend } from "@/lib/camcue/engine";
import { recommendAccessories } from "@/lib/accessories/recommend";
import { accessoryProducts } from "@/lib/accessories/catalog";
import { accessoryMedia } from "@/lib/accessories/images";
import type {
  CameraProfile, EditingId, LightId, MountId, MovementId, PlatformId,
  PriorityId, Scenario, SceneDef,
} from "@/lib/camcue/types";

export const SITE = "https://www.smartercapture.com";
export const API_VERSION = "1.0.0";
export const ENGINE_VERSION = "2026.08.16";

/** Newest review date across the shipped camera set. */
export const DATA_UPDATED_AT = cameras.reduce(
  (latest, cam) => (cam.lastVerified > latest ? cam.lastVerified : latest),
  "2026-01-01",
);

/** Version stamp for all machine responses: engine version + data recency. */
export const DATA_VERSION = `${ENGINE_VERSION}+data.${DATA_UPDATED_AT}`;

// ---------------------------------------------------------------------------
// serialization
// ---------------------------------------------------------------------------

export function cameraCanonicalUrl(slug: string) {
  return `${SITE}/md/cameras/${slug}`;
}

export function sceneCanonicalUrl(id: string) {
  return `${SITE}/md/scenarios/${id}`;
}

export function serializeCameraSummary(cam: CameraProfile) {
  return {
    slug: cam.id,
    manufacturer: cam.manufacturer,
    model: cam.model,
    category: cam.category,
    category_label: categoryLabels[cam.category],
    sensor: cam.sensor,
    confidence: cam.confidence,
    updated_at: cam.lastVerified,
    canonical_url: cameraCanonicalUrl(cam.id),
  };
}

export function serializeCameraFull(cam: CameraProfile) {
  return {
    ...serializeCameraSummary(cam),
    source: cam.officialSource ?? null,
    verify_note: cam.verifyNote ?? null,
    lens_mount: cam.lensMount ?? null,
    capabilities: {
      video_modes: cam.videoModes.map((m) => ({
        resolution: m.res,
        frame_rates: m.fps,
        aspect_ratios: m.aspect ?? ["16:9"],
        note: m.note ?? null,
      })),
      slow_motion: cam.slowMotion ?? [],
      stabilization_modes: cam.stabilization.map((s) => ({
        id: s.id, name: s.name, strength: s.strength,
        max_fps: s.maxFps ?? null, excluded_resolutions: s.resExclude ?? [],
        crops_image: s.crop ?? false, note: s.note ?? null,
      })),
      color_profiles: cam.colorProfiles.map((p) => ({
        id: p.id, name: p.name, bit_depth: p.bitDepth, log: p.log, note: p.note ?? null,
      })),
      field_of_view_modes: (cam.fovModes ?? []).map((f) => ({
        id: f.id, name: f.name, distortion: f.distortion, relative_width: f.width, note: f.note ?? null,
      })),
      iso_range: cam.iso,
      recommended_iso_ceilings: cam.recommendedIsoCeiling ?? null,
      manual_shutter: cam.shutterControl,
      aperture: cam.aperture ?? null,
      exposure_compensation: cam.evComp ?? false,
      focus: cam.focus,
      audio: cam.audio,
      pre_record: cam.preRecord ?? null,
      built_in_nd: cam.builtInNd ?? false,
      hdr_video: cam.hdrVideo ?? null,
      low_light_mode: cam.lowLightMode ?? null,
      open_gate: cam.openGate ?? false,
      native_vertical: cam.verticalNative ?? false,
      waterproof: cam.waterproof ?? null,
      battery_notes: cam.battery ?? null,
      thermal_notes: cam.thermal ?? null,
      storage_notes: cam.storage ?? null,
    },
    special_features: cam.specialFeatures.map((f) => ({ id: f.id, name: f.name, description: f.desc })),
    best_for: cam.bestFor,
    strengths: cam.strengths,
    weaknesses: cam.weaknesses,
  };
}

export function serializeScene(scene: SceneDef) {
  return {
    id: scene.id,
    name: scene.name,
    group: scene.group,
    typical_motion: scene.motion,
    slow_motion_value: scene.slowMoValue,
    cinematic_bias: scene.cinematicBias ?? false,
    default_lighting: scene.defaultLight ?? null,
    default_mount: scene.defaultMount ?? null,
    involves_water: scene.water ?? false,
    speech_critical: scene.talking ?? false,
    common_mistakes: scene.mistakes,
    canonical_url: sceneCanonicalUrl(scene.id),
  };
}

export function serializeAccessory(productId: string) {
  const product = accessoryProducts.find((p) => p.id === productId);
  if (!product) return null;
  const media = accessoryMedia[product.slug];
  return {
    slug: product.slug,
    name: product.name,
    description: product.description,
    category: product.category,
    price_usd: product.retailPriceUsd,
    purchasable: product.catalogStatus === "ready" && product.retailPriceUsd !== null,
    mount_standard: product.mountStandard,
    brands_supported: product.brandsSupported,
    compatibility_note: product.compatibilityNote,
    variants: media?.variants?.map((v) => v.label) ?? [],
    warnings: product.warnings,
    canonical_url: `${SITE}/gear/${product.slug}`,
  };
}

// ---------------------------------------------------------------------------
// free-text resolvers — map agent language onto the controlled vocabulary
// ---------------------------------------------------------------------------

function norm(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

export function resolveCamera(input: string): CameraProfile | null {
  const direct = getCamera(norm(input).replace(/ /g, "-"));
  if (direct) return direct;
  const q = norm(input);
  const scored = cameras
    .map((cam) => {
      const hay = norm(`${cam.manufacturer} ${cam.model}`);
      if (hay === q) return { cam, score: 100 };
      const words = q.split(" ").filter((w) => w.length > 1);
      const hit = words.filter((w) => hay.includes(w)).length;
      return { cam, score: words.length ? (hit / words.length) * (hay.includes(q) ? 2 : 1) : 0 };
    })
    .sort((a, b) => b.score - a.score);
  return scored[0] && scored[0].score >= 0.6 ? scored[0].cam : null;
}

const SCENE_KEYWORDS: Array<[RegExp, string]> = [
  [/fish/, "fishing"], [/boat|marina|sail/, "boating"], [/beach/, "beach"],
  [/hike|hiking|trail/, "hiking"], [/camp/, "camping"], [/wildlife|bird|animal/, "wildlife"],
  [/ocean|wave|sea\b/, "ocean"], [/mountain|alpine/, "mountains"], [/sunrise|dawn/, "sunrise"],
  [/sunset|golden hour|dusk/, "sunset"], [/motorcycle|motorbike|helmet cam/, "motorcycle"],
  [/cycle|cycling|bike|mtb/, "cycling"], [/snowboard/, "snowboarding"], [/\bski/, "skiing"],
  [/surf/, "surfing"], [/motorsport|race|track day|kart/, "motorsports"],
  [/basketball|football|soccer|sport/, "sports"], [/gym|workout|lift/, "gym"],
  [/box|martial|mma/, "boxing"], [/run\b|running|marathon/, "running"],
  [/walking tour|city walk|stroll/, "walking-tour"], [/night market/, "night-market"],
  [/city|urban|street/, "city"], [/restaurant|dinner|cafe/, "restaurant"],
  [/food/, "food-video"], [/airport|flight|plane/, "airport"], [/road trip|drive|driving|car\b/, "road-trip"],
  [/hotel|resort/, "hotel"], [/theme park|roller ?coaster|disney/, "theme-park"],
  [/architecture|building/, "architecture"], [/talking head|talking to camera|piece to camera|presenting/, "talking-head"],
  [/interview/, "interview"], [/family/, "family"], [/kids|children|child/, "kids"],
  [/pet|dog|cat/, "pets"], [/wedding/, "wedding"], [/party/, "party"],
  [/concert|event|festival/, "event"], [/tiktok/, "tiktok"], [/reel/, "instagram-reel"],
  [/youtube/, "youtube"], [/vlog/, "vlog"], [/b.?roll|cinemati/, "cinematic"],
  [/product (video|shot)/, "product"], [/stream/, "streaming"], [/podcast/, "podcast"],
  [/slow.?mo/, "slowmo"], [/timelapse|time.?lapse/, "timelapse"], [/hyperlapse/, "hyperlapse"],
  [/underwater|dive|snorkel/, "underwater"], [/night|dark|astro/, "night"],
];

export function resolveScene(input: string): SceneDef | null {
  const direct = getScene(norm(input).replace(/ /g, "-"));
  if (direct) return direct;
  const q = norm(input);
  const byName = scenes.find((s) => norm(s.name) === q);
  if (byName) return byName;
  for (const [re, id] of SCENE_KEYWORDS) {
    if (re.test(q)) return getScene(id) ?? null;
  }
  return null;
}

function resolveFromOptions<T extends string>(
  input: string | undefined,
  options: Array<{ id: string; name: string }>,
  keywords: Array<[RegExp, T]>,
): T | null {
  if (!input) return null;
  const q = norm(input);
  const exact = options.find((o) => o.id === q.replace(/ /g, "-") || norm(o.name) === q);
  if (exact) return exact.id as T;
  for (const [re, id] of keywords) if (re.test(q)) return id;
  return null;
}

export const resolveLight = (input?: string) =>
  resolveFromOptions<LightId>(input, lightOptions, [
    [/bright|sunny|full sun|tropical|midday|daylight/, "bright-sun"],
    [/partly|part cloud/, "partly-cloudy"], [/overcast|grey|gray|cloudy/, "overcast"],
    [/shade|shadow/, "shade"], [/indoor.*(dim|low)|dim|candle/, "indoor-dim"],
    [/indoor|office|studio/, "indoor-bright"], [/golden/, "golden-hour"],
    [/blue hour|twilight/, "blue-hour"], [/very dark|pitch|no light|astro/, "very-dark"],
    [/night|dark|evening/, "night"], [/mixed/, "mixed"],
  ]);

export const resolveMount = (input?: string) =>
  resolveFromOptions<MountId>(input, mountOptions, [
    [/chest/, "chest"], [/helmet/, "helmet"], [/head/, "head"], [/tripod/, "tripod"],
    [/gimbal/, "gimbal"], [/handlebar|bar mount/, "handlebar"], [/boat/, "boat"],
    [/car|vehicle|dash|windshield|suction/, "vehicle"], [/360 stick|invisible/, "stick-360"],
    [/selfie stick|pole/, "selfie-stick"], [/selfie/, "selfie"], [/hand|held/, "handheld"],
  ]);

export const resolveMovement = (input?: string) =>
  resolveFromOptions<MovementId>(input, movementOptions, [
    [/extreme|very fast|rapid|racing/, "extreme"], [/fast|quick|action/, "fast"],
    [/moderate|medium/, "moderate"], [/slow|gentle/, "slow"],
    [/static|stationary|still|locked/, "stationary"],
  ]);

export const resolvePlatform = (input?: string) =>
  resolveFromOptions<PlatformId>(input, platformOptions, [
    [/shorts/, "youtube-shorts"], [/youtube/, "youtube"], [/tiktok/, "tiktok"],
    [/reel/, "instagram-reels"], [/instagram/, "instagram-feed"], [/facebook/, "facebook"],
    [/professional|broadcast|client/, "professional"], [/personal|family/, "personal"],
  ]);

export function resolveEditing(input?: string): EditingId | null {
  if (!input) return null;
  const q = norm(input);
  if (/none|no edit|straight|direct/.test(q)) return "none";
  if (/grade|colou?r|professional|full/.test(q)) return "grade";
  if (/basic|light|simple|some/.test(q)) return "basic";
  return null;
}

// ---------------------------------------------------------------------------
// recommendation IO
// ---------------------------------------------------------------------------

export interface RecommendInput {
  camera: string;
  activity?: string;
  scenario?: string;
  environment?: string;
  lighting?: string;
  subject?: string;
  movement_level?: string;
  mounting_position?: string;
  desired_resolution?: string;
  desired_frame_rate?: number;
  destination_platform?: string;
  quality_priority?: boolean;
  battery_priority?: boolean;
  storage_priority?: boolean;
  editing_level?: string;
  slow_motion_required?: boolean;
}

/**
 * Meaning of `confidence`: a deterministic, rule-based label from the engine —
 * NOT a statistical probability. "optimal" = light, movement and camera
 * strengths align; "tradeoffs" = a documented compromise was required;
 * "challenging" = physics works against this combination and the settings
 * prioritize a usable result. The reason string states which rule fired.
 */
export function runRecommendation(input: RecommendInput) {
  const assumptions: string[] = [];
  const unresolved: string[] = [];

  const cam = resolveCamera(input.camera);
  if (!cam) {
    return {
      error: "unknown_camera" as const,
      message: `No supported camera matches "${input.camera}". Use GET /api/v1/cameras for the supported list.`,
    };
  }

  const sceneText = input.activity ?? input.scenario ?? input.subject ?? "";
  let scene = sceneText ? resolveScene(sceneText) : null;
  if (!scene && input.environment) scene = resolveScene(input.environment);
  if (!scene) {
    scene = getScene("walking-tour")!;
    assumptions.push(
      sceneText
        ? `Activity "${sceneText}" did not match a known scenario; assumed the general "Walking Tour" profile. See GET /api/v1/scenarios.`
        : 'No activity given; assumed the general "Walking Tour" profile.',
    );
    if (sceneText) unresolved.push("activity");
  }

  const light = resolveLight(input.lighting ?? input.environment) ?? scene.defaultLight ?? "partly-cloudy";
  if (!input.lighting) assumptions.push(`Lighting defaulted to "${light}" (typical for ${scene.name}).`);
  else if (!resolveLight(input.lighting)) {
    assumptions.push(`Lighting "${input.lighting}" was not recognized; used "${light}".`);
    unresolved.push("lighting");
  }

  const mount = resolveMount(input.mounting_position) ?? scene.defaultMount ?? "handheld";
  if (!input.mounting_position) assumptions.push(`Mount defaulted to "${mount}" (typical for ${scene.name}).`);

  const movement = resolveMovement(input.movement_level ?? input.subject) ?? undefined;

  let priority: PriorityId | undefined;
  if (input.slow_motion_required || (input.desired_frame_rate ?? 0) >= 100) priority = "slowmo";
  else if (input.battery_priority) priority = "battery";
  else if (input.storage_priority) priority = "storage";
  else if (input.quality_priority) priority = "quality";
  if (input.desired_frame_rate && input.desired_frame_rate >= 100) {
    assumptions.push(`desired_frame_rate ${input.desired_frame_rate} was treated as a slow-motion priority; the engine still verifies the camera supports it.`);
  }
  if (input.desired_resolution && /8k|6k|5\.|highest|max/i.test(input.desired_resolution) && !priority) {
    priority = "quality";
    assumptions.push(`desired_resolution "${input.desired_resolution}" was treated as a best-quality priority.`);
  }

  const scenario: Scenario = {
    cameraId: cam.id,
    sceneId: scene.id,
    light,
    mount,
    movement,
    platform: resolvePlatform(input.destination_platform) ?? undefined,
    editing: resolveEditing(input.editing_level) ?? undefined,
    priority,
  };

  const rec = recommend(cam, scene, scenario);
  const accessories = recommendAccessories(scene, mount);

  const payload = {
    camera: serializeCameraSummary(cam),
    scenario: { id: scene.id, name: scene.name, lighting: light, mount, movement: movement ?? scene.motion },
    settings: Object.fromEntries(rec.settings.map((s) => [s.key, s.value])),
    settings_detailed: rec.settings.map((s) => ({ key: s.key, label: s.label, value: s.value, why: s.why ?? null })),
    pro_settings: rec.proSettings
      .filter((s) => !rec.settings.some((p) => p.key === s.key))
      .map((s) => ({ key: s.key, label: s.label, value: s.value, why: s.why ?? null })),
    explanation: rec.whyItWorks,
    dont_forget: rec.dontForget ?? null,
    common_mistakes: rec.mistakes,
    warnings: rec.warnings,
    confidence: {
      level: rec.confidence,
      meaning: "Deterministic rule-based label, not a statistical probability.",
      reason: rec.confidenceReason,
    },
    camera_advantages: rec.advantages,
    accessory_suggestions: accessories.map((a) => ({
      slug: a.slug, name: a.name, reason: a.recommendationReason,
      canonical_url: `${SITE}/gear/${a.slug}`,
    })),
    how_to_set: rec.howToSet,
    assumptions,
    unresolved_inputs: unresolved,
  };

  const recommendation_id =
    "rec_" + createHash("sha256").update(JSON.stringify({ scenario, v: DATA_VERSION })).digest("hex").slice(0, 16);

  return {
    error: null,
    result: {
      recommendation_id,
      id_meaning: "Deterministic content hash of the resolved inputs and data version — identical requests share an id.",
      ...payload,
      source_name: brand.name,
      canonical_url: cameraCanonicalUrl(cam.id),
      data_version: DATA_VERSION,
      updated_at: cam.lastVerified,
      attribution: `Source: ${brand.name} (${SITE})`,
    },
  };
}
