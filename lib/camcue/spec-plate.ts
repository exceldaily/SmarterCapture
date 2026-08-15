import type { CameraProfile } from "./types";

/**
 * The headline capability of a camera, for the card face.
 *
 * Every figure is derived from the capability profile, so two cameras only
 * look alike on the grid when they genuinely are alike. This replaced a
 * per-body-type illustration, where all 14 action cameras shared one drawing
 * and the largest element on the card carried no information.
 */
export interface SpecPlate {
  /** Top resolution, e.g. "5.3K". */
  hero: string;
  /** Max frame rate at that resolution, e.g. "60P". */
  heroSub: string;
  /** Three or four defining capabilities. */
  chips: string[];
  /** Set when the profile is unverified — the card should say so, not guess. */
  pending?: boolean;
}

function resRank(res: string): number {
  const match = res.match(/([\d.]+)K/i);
  if (match) return parseFloat(match[1]);
  if (/1080/.test(res)) return 1.9;
  if (/720/.test(res)) return 1;
  return 2;
}

/**
 * Chips are narrow, so stabilization names reduce to the part people
 * recognise: "SteadyShot Standard (IBIS)" is IBIS, "HyperSmooth AutoBoost"
 * is HYPERSMOOTH.
 */
function shortStab(name: string): string {
  const known: [RegExp, string][] = [
    [/ibis|in-body/i, "IBIS"],
    [/hypersmooth/i, "HYPERSMOOTH"],
    [/horizonsteady/i, "HORIZONSTEADY"],
    [/rocksteady/i, "ROCKSTEADY"],
    [/flowstate/i, "FLOWSTATE"],
    [/horizon lock|horizon balancing/i, "HORIZON LOCK"],
    [/gimbal|follow/i, "GIMBAL"],
    [/360/i, "360 STAB"],
    [/electronic vr|e-stab|digital/i, "DIGITAL IS"],
    [/steadyshot/i, "STEADYSHOT"],
  ];
  for (const [pattern, label] of known) if (pattern.test(name)) return label;
  return name.split(/\s+/)[0].toUpperCase();
}

/** "8K 360" is a resolution label plus a format marker; the marker is a chip. */
function stripFormat(res: string): string {
  return res.replace(/\s*360\s*/i, "").replace(/\s*\(single lens\)\s*/i, "").trim() || res;
}

/** "S-Log3 (S-Gamut3.Cine)" is the profile plus its colour space. Chip the profile. */
function shortLog(name: string): string {
  return name.replace(/\s*\(.*\)/, "").split(" / ")[0].trim().toUpperCase();
}

/** Just the f-number, not the focal-length prose that follows it. */
function shortAperture(value: string): string | null {
  const match = value.match(/f\/[\d.]+(\s*[–-]\s*f?\/?[\d.]+)?/i);
  return match ? match[0].toUpperCase().replace(/\s+/g, "") : null;
}

const MOUNT_LABELS: [RegExp, string][] = [
  [/micro four thirds/i, "MFT"],
  [/l-mount/i, "L-MOUNT"],
  [/sony e/i, "SONY E"],
  [/canon rf/i, "CANON RF"],
  [/nikon z/i, "NIKON Z"],
  [/fujifilm x/i, "FUJI X"],
];

function shortMount(mount: string): string {
  for (const [pattern, label] of MOUNT_LABELS) if (pattern.test(mount)) return label;
  return mount.toUpperCase();
}

export function cameraSpecPlate(cam: CameraProfile): SpecPlate {
  if (cam.confidence === "unverified") {
    return { hero: "—", heroSub: "", chips: ["SPECS NOT VERIFIED"], pending: true };
  }

  const sorted = [...cam.videoModes].sort((a, b) => resRank(b.res) - resRank(a.res));
  const top = sorted[0];
  const topFps = Math.max(...top.fps);

  const chips: string[] = [];

  if (/360/i.test(top.res)) chips.push("360°");

  // The fastest mode anywhere on the camera, which is what people buy for.
  let fastest = { res: "", fps: 0 };
  for (const mode of cam.videoModes) {
    const max = Math.max(...mode.fps);
    if (max > fastest.fps) fastest = { res: mode.res, fps: max };
  }
  if (fastest.fps >= 100 && !(fastest.res === top.res && fastest.fps === topFps)) {
    chips.push(`${stripFormat(fastest.res)}/${fastest.fps}`.toUpperCase());
  }

  const strongest = [...cam.stabilization].sort((a, b) => b.strength - a.strength)[0];
  if (strongest && strongest.strength > 0) chips.push(shortStab(strongest.name));

  const log = cam.colorProfiles.find((p) => p.log);
  chips.push(log ? shortLog(log.name) : "NO LOG");

  // Internal ProRes separates bodies that are otherwise near-identical on
  // paper — the S5 IIX from the S5 II, for instance.
  if (cam.codecs.some((c) => /prores/i.test(c) && /internal/i.test(c))) chips.push("PRORES");

  // Aperture ranks above bit depth because it is what separates otherwise
  // near-identical siblings: the Action 6 is f/2.0-4.0 where the 5 Pro is
  // fixed f/2.8, and without it those cards read exactly alike.
  const aperture = cam.aperture?.value ? shortAperture(cam.aperture.value) : null;
  if (aperture) chips.push(aperture);
  else if (cam.lensMount) chips.push(shortMount(cam.lensMount));

  if (cam.openGate) chips.push("OPEN GATE");

  const maxBits = Math.max(...cam.colorProfiles.map((p) => p.bitDepth));
  chips.push(`${maxBits}-BIT`);

  return { hero: stripFormat(top.res), heroSub: `${topFps}P`, chips: chips.slice(0, 4) };
}
