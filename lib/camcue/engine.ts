import type {
  CameraProfile, SceneDef, Scenario, Recommendation, SettingLine,
  StabMode, FovMode, ColorProfile, ConfidenceLevel, AccessoryTip,
  CameraAdvantage, MovementId,
} from "./types";
import { lightLevel, movementLevel, mountShake } from "./data/options";

// ---------------------------------------------------------------------------
// CamCue deterministic recommendation engine.
// Flow: scenario → ideal shooting profile → camera capability fit → validated
// final recommendation. Never emits a setting the camera can't actually use.
// ---------------------------------------------------------------------------

interface IdealProfile {
  targetFps: number;
  cinematic: boolean;
  slowMoWanted: boolean;
  resPreference: "highest" | "standard" | "efficient";
  stabNeed: number; // 0..5
  fovWidth: 1 | 2 | 3 | 4; // desired width
  lowDistortion: boolean;
  isoTier: "bright" | "normal" | "low";
  wantLog: boolean;
  vertical: boolean;
  talking: boolean;
  night: boolean;
  brighter: boolean;
}

function deriveIdeal(scene: SceneDef, sc: Scenario): IdealProfile {
  const light = lightLevel[sc.light];
  const movement: MovementId = sc.movement ?? scene.motion;
  const mLevel = movementLevel[movement];
  const tweaks = sc.tweaks ?? [];
  const priority = sc.priority ?? "balanced";

  // --- frame rate ---
  let targetFps = 30;
  let cinematic = !!scene.cinematicBias;
  if (mLevel >= 2 && light >= 3) targetFps = 60;
  if (mLevel >= 3 && light >= 3) targetFps = 60;
  let slowMoWanted = scene.slowMoValue >= 3 || priority === "slowmo" || tweaks.includes("slowmo") || scene.id === "slowmo";
  if (slowMoWanted && light >= 4) targetFps = 120;
  else if (slowMoWanted && light === 3) targetFps = 60; // slow-mo in mid light: 60 is safer
  if (light <= 1 || sc.light === "night" || sc.light === "very-dark") {
    targetFps = 30; // night: let each frame gather light
    slowMoWanted = false;
  }
  if (cinematic && !slowMoWanted && mLevel <= 2) targetFps = 24;
  if (tweaks.includes("cinematic")) { cinematic = true; if (!slowMoWanted) targetFps = 24; }
  if (tweaks.includes("smoother") && light >= 2) { cinematic = false; targetFps = Math.max(targetFps, 60); }
  if (tweaks.includes("lowlight") || priority === "lowlight") { targetFps = Math.min(targetFps, 30); slowMoWanted = false; }
  if (priority === "battery" || priority === "storage" || tweaks.includes("battery") || tweaks.includes("storage")) {
    targetFps = Math.min(targetFps, cinematic ? 24 : 30);
    slowMoWanted = false;
  }
  if (scene.talking && !slowMoWanted && mLevel <= 1) targetFps = cinematic ? 24 : 30;

  // --- resolution preference ---
  let resPreference: IdealProfile["resPreference"] = "standard";
  if (priority === "quality" || sc.editing === "grade") resPreference = "highest";
  if (priority === "battery" || priority === "storage" || tweaks.includes("battery") || tweaks.includes("storage")) resPreference = "efficient";

  // --- stabilization need ---
  const shake = mountShake[sc.mount];
  let stabNeed = Math.min(5, shake + Math.ceil(mLevel / 2) + (scene.wide ? 0 : 0));
  if (sc.mount === "tripod" || sc.mount === "gimbal") stabNeed = 0;

  // --- FOV ---
  let fovWidth: IdealProfile["fovWidth"] = scene.wide ? 3 : 2;
  if (sc.mount === "chest" || sc.mount === "helmet" || sc.mount === "head") fovWidth = 3;
  if (scene.tight) fovWidth = 2;
  let lowDistortion = !!scene.tight || tweaks.includes("less-distortion");
  if (scene.id === "architecture") lowDistortion = true;

  // --- ISO tier ---
  let isoTier: IdealProfile["isoTier"] = "normal";
  if (light >= 4) isoTier = "bright";
  if (light <= 2) isoTier = "low";

  // --- color ---
  const wantLog = (sc.editing === "grade" || tweaks.includes("pro-color") || sc.platform === "professional");

  // --- orientation ---
  const vertical = !!scene.vertical ||
    sc.platform === "tiktok" || sc.platform === "instagram-reels" || sc.platform === "youtube-shorts";

  return {
    targetFps, cinematic, slowMoWanted, resPreference, stabNeed, fovWidth,
    lowDistortion, isoTier, wantLog,
    vertical, talking: !!scene.talking, night: !!scene.night || light <= 1,
    brighter: tweaks.includes("brighter"),
  };
}

// ---------------------------------------------------------------------------
// capability fitting
// ---------------------------------------------------------------------------

function fpsLabel(fps: number): string {
  return `${fps} FPS`;
}

function pickVideoMode(cam: CameraProfile, ideal: IdealProfile): { res: string; fps: number; note?: string } {
  const modes = cam.videoModes;
  const is360 = cam.category === "360";

  // candidate pool: for 360 cams prefer 360 modes; else prefer non-360
  const pool = is360 ? modes.filter((m) => m.res.includes("360")) : modes;
  const usable = pool.length ? pool : modes;

  const resRank = (res: string): number => {
    const m = res.match(/([\d.]+)K/i);
    if (m) return parseFloat(m[1]);
    if (/1080/.test(res)) return 1.9;
    if (/720/.test(res)) return 1;
    return 2;
  };

  // preferred resolution band
  const sorted = [...usable].sort((a, b) => resRank(b.res) - resRank(a.res));
  let resOrder: typeof sorted;
  if (ideal.resPreference === "highest") {
    resOrder = sorted;
  } else if (ideal.resPreference === "efficient") {
    // prefer ~4K then below
    resOrder = [...sorted].sort((a, b) => {
      const score = (r: number) => (r > 4.2 ? 10 + r : Math.abs(4 - r)); // stay at/below 4K
      return score(resRank(a.res)) - score(resRank(b.res));
    });
  } else {
    // standard: prefer 4K-ish, then higher, then lower
    resOrder = [...sorted].sort((a, b) => {
      const score = (r: number) => (r >= 3.8 && r <= 4.4 ? 0 : r > 4.4 ? 1 + (r - 4.4) * 0.1 : 2 + (4 - r));
      return score(resRank(a.res)) - score(resRank(b.res));
    });
  }

  // find mode supporting target fps (or closest below, then above)
  for (const mode of resOrder) {
    if (mode.fps.includes(ideal.targetFps)) return { res: mode.res, fps: ideal.targetFps, note: mode.note };
  }
  // closest available fps at best resolution choice
  let best: { res: string; fps: number; note?: string } | null = null;
  let bestDelta = Infinity;
  for (const mode of resOrder) {
    for (const f of mode.fps) {
      const delta = Math.abs(f - ideal.targetFps) + (f < ideal.targetFps ? 0 : 5); // prefer lower over higher
      if (delta < bestDelta) { bestDelta = delta; best = { res: mode.res, fps: f, note: mode.note }; }
    }
  }
  return best ?? { res: usable[0].res, fps: usable[0].fps[0] };
}

function stabAvailable(s: StabMode, res: string, fps: number): boolean {
  if (s.maxFps && fps > s.maxFps) return false;
  if (s.minFps && fps < s.minFps) return false;
  if (s.resExclude && s.resExclude.some((r) => res.startsWith(r))) return false;
  return true;
}

function pickStab(cam: CameraProfile, ideal: IdealProfile, res: string, fps: number, mount: string): StabMode | null {
  const avail = cam.stabilization.filter((s) => stabAvailable(s, res, fps));
  if (!avail.length) return null;
  if (ideal.stabNeed === 0) {
    // tripod/gimbal: lightest real mode, or off for tripods with digital-only stab
    if (mount === "tripod") {
      const off = avail.find((s) => s.strength === 0);
      if (off && cam.category !== "pocket") return off;
    }
    const sortedLight = [...avail].sort((a, b) => a.strength - b.strength);
    return sortedLight.find((s) => s.strength > 0) ?? sortedLight[0];
  }
  // want strongest available, but avoid heavy-crop modes unless need is extreme
  const sorted = [...avail].sort((a, b) => b.strength - a.strength);
  if (ideal.stabNeed >= 4) return sorted[0];
  const noCrop = sorted.filter((s) => !s.crop);
  return (noCrop[0] ?? sorted[0]);
}

function pickFov(cam: CameraProfile, ideal: IdealProfile, stab: StabMode | null): FovMode | null {
  if (!cam.fovModes || !cam.fovModes.length) return null;
  let pool = cam.fovModes;
  if (stab?.fovExclude) pool = pool.filter((f) => !stab.fovExclude!.includes(f.id));
  if (!pool.length) pool = cam.fovModes;
  if (ideal.lowDistortion) {
    const low = pool.filter((f) => f.distortion === "low");
    if (low.length) return low.sort((a, b) => Math.abs(a.width - ideal.fovWidth) - Math.abs(b.width - ideal.fovWidth))[0];
  }
  return [...pool].sort((a, b) => {
    const da = Math.abs(a.width - ideal.fovWidth) + (a.distortion === "high" && ideal.fovWidth < 4 ? 0.5 : 0);
    const db = Math.abs(b.width - ideal.fovWidth) + (b.distortion === "high" && ideal.fovWidth < 4 ? 0.5 : 0);
    return da - db;
  })[0];
}

function pickColor(cam: CameraProfile, ideal: IdealProfile): ColorProfile {
  const profiles = cam.colorProfiles;
  const logP = profiles.filter((p) => p.log);
  const normal = profiles.filter((p) => !p.log && !/hlg|hdr/i.test(p.name));
  if (ideal.wantLog && logP.length) {
    return logP.sort((a, b) => b.bitDepth - a.bitDepth)[0];
  }
  return normal[0] ?? profiles[0];
}

function isoRange(cam: CameraProfile, ideal: IdealProfile): { min: number; max: number } {
  const ceil = cam.recommendedIsoCeiling;
  const min = cam.iso.min;
  if (!ceil) {
    const max = ideal.isoTier === "bright" ? Math.min(cam.iso.max, 800)
      : ideal.isoTier === "normal" ? Math.min(cam.iso.max, 1600)
      : cam.iso.max;
    return { min, max };
  }
  const max = ideal.isoTier === "bright" ? ceil.bright : ideal.isoTier === "normal" ? ceil.normal : ceil.low;
  return { min, max: Math.min(max, cam.iso.max) };
}

// ---------------------------------------------------------------------------
// main entry
// ---------------------------------------------------------------------------

export function recommend(cam: CameraProfile, scene: SceneDef, sc: Scenario): Recommendation {
  const ideal = deriveIdeal(scene, sc);
  const light = lightLevel[sc.light];
  const movement = sc.movement ?? scene.motion;
  const mLevel = movementLevel[movement];
  const accessories = sc.accessories ?? [];
  const warnings: string[] = [];

  // ----- fit to camera -----
  const mode = pickVideoMode(cam, ideal);
  if (ideal.slowMoWanted && mode.fps < 100) {
    warnings.push(`${cam.model} can't reach high frame rates in this mode — slow motion will be limited to ${mode.fps} FPS conforming.`);
  }
  const stab = pickStab(cam, ideal, mode.res, mode.fps, sc.mount);
  const fov = pickFov(cam, ideal, stab);
  const color = pickColor(cam, ideal);
  const iso = isoRange(cam, ideal);

  // shutter
  let shutterValue = "Auto";
  let shutterWhy = "Auto shutter handles changing conditions so you can focus on the moment.";
  const use180 = (ideal.cinematic || sc.editing === "grade") && cam.shutterControl && mLevel <= 2 && !ideal.night;
  if (use180) {
    shutterValue = `1/${mode.fps * 2} (180° rule)`;
    shutterWhy = "Shutter at twice your frame rate gives natural, film-like motion blur.";
    if (light >= 4 && !cam.builtInNd && !accessories.includes("nd")) {
      warnings.push("Holding a 180° shutter in bright sun needs an ND filter — without one, use Auto shutter instead.");
      shutterValue = accessories.includes("nd") ? shutterValue : "Auto (no ND filter)";
    }
  }
  if (ideal.night && cam.shutterControl && mLevel <= 1) {
    shutterValue = `Auto, limit slowest to 1/${mode.fps}`;
    shutterWhy = "At night, letting shutter drop to the frame rate keeps maximum light without smearing.";
  }

  // white balance
  let wb = "Auto";
  let wbWhy = "Auto white balance is reliable in consistent light.";
  if (sc.light === "mixed" || scene.id === "hiking") {
    wb = "Locked (5600K daylight)";
    wbWhy = "Mixed light makes auto white balance shift mid-clip — locking it keeps color consistent.";
  }
  if (ideal.wantLog) {
    wb = "Locked";
    wbWhy = "When grading, a locked white balance keeps clips consistent for correction.";
  }

  // orientation
  let orientation = "16:9 Landscape";
  let orientationWhy = "Landscape is the standard for YouTube and TV viewing.";
  if (ideal.vertical) {
    if (cam.verticalNative) {
      orientation = "9:16 Vertical (native)";
      orientationWhy = `${cam.model} captures true vertical video — use it for full-quality Reels/TikTok.`;
    } else {
      const has43 = cam.videoModes.some((m) => m.aspect?.includes("4:3") || m.aspect?.includes("8:7") || m.res.includes("open-gate"));
      orientation = has43 ? "Shoot tall aspect (4:3/8:7) and crop vertical" : "Rotate camera 90° or crop in edit";
      orientationWhy = "This camera has no native vertical mode — a taller sensor mode preserves the most resolution for a 9:16 crop.";
    }
  } else if (sc.platform === "professional" && cam.openGate) {
    orientation = "Open gate (full sensor)";
    orientationWhy = "Open-gate capture gives maximum reframing flexibility in post.";
  }

  // audio
  let audioValue = "Camera mic";
  let audioWhy = "The built-in mics are fine for ambient sound.";
  const windy = scene.water || ["motorcycle", "cycling", "boating", "road-trip"].includes(scene.id) || sc.mount === "vehicle" || sc.mount === "boat";
  if (cam.audio.windReduction && (windy || scene.group === "outdoors" || scene.group === "action")) {
    audioValue = "Camera mic + Wind Reduction ON";
    audioWhy = "Wind noise is the #1 audio killer outdoors — the built-in reduction handles it.";
  }
  if (ideal.talking) {
    if (sc.audioPref === "wireless" || accessories.includes("mic")) {
      audioValue = cam.audio.wireless ? `Wireless mic (${cam.audio.wireless})` : "Wireless mic";
      audioWhy = "For speech, a mic near the mouth beats any camera mic.";
    } else if (sc.audioPref === "external") {
      audioValue = cam.audio.externalMic ? `External mic (${cam.audio.externalMic})` : "External mic";
      audioWhy = "An external mic dramatically improves voice clarity.";
    } else {
      audioValue = cam.audio.windReduction && windy ? "Camera mic + Wind Reduction ON" : "Camera mic, stay close";
      audioWhy = "Without an external mic, keep the camera within arm's length for usable speech.";
    }
  }
  if (sc.audioPref === "none") { audioValue = "Any (audio not critical)"; audioWhy = "You said audio doesn't matter — plan for music or voiceover."; }

  // ----- build setting lines -----
  const settings: SettingLine[] = [];
  const pro: SettingLine[] = [];
  const add = (line: SettingLine, primary = true) => { (primary ? settings : pro).push(line); };

  add({ key: "resolution", label: "Resolution", value: mode.res, why: resWhy(mode.res, ideal) });
  add({ key: "fps", label: "Frame Rate", value: fpsLabel(mode.fps), why: fpsWhy(mode.fps, ideal, movement, light) });
  if (fov) add({ key: "fov", label: "Field of View", value: fov.name, why: fovWhy(fov, ideal, sc.mount) });
  if (stab) add({ key: "stabilization", label: "Stabilization", value: stab.name, why: stabWhy(stab, ideal, sc.mount, cam) });
  add({ key: "shutter", label: "Shutter", value: shutterValue, why: shutterWhy });
  add({ key: "iso", label: "ISO", value: `${iso.min}–${iso.max}`, why: isoWhy(ideal) });
  add({ key: "whiteBalance", label: "White Balance", value: wb, why: wbWhy });
  add({ key: "color", label: "Color", value: color.name, why: colorWhy(color, ideal) });
  add({ key: "audio", label: "Audio", value: audioValue, why: audioWhy });
  if (cam.preRecord && (["fishing", "fish-strike", "wildlife", "kids", "pets", "theme-park", "sports", "surfing"].includes(scene.id) || scene.slowMoValue >= 2)) {
    add({
      key: "preRecord", label: "Pre-Record",
      value: `ON (${cam.preRecord.maxSeconds >= 60 ? Math.round(cam.preRecord.maxSeconds / 60) + " min" : cam.preRecord.maxSeconds + " s"} max)`,
      why: "Unpredictable moments get captured even if you press record late.",
    });
  }
  add({ key: "orientation", label: "Orientation", value: orientation, why: orientationWhy });

  // pro-only lines
  if (cam.evComp) {
    let ev = "0";
    let evWhy = "Neutral exposure for these conditions.";
    if (["snowboarding", "skiing"].includes(scene.id) || (scene.water && light >= 4)) { ev = "+0.3"; evWhy = "Bright snow/water fools meters into underexposing — a slight lift keeps whites white."; }
    if (["sunset", "sunrise", "city-lights", "night-market"].includes(scene.id)) { ev = "-0.3"; evWhy = "Slight underexposure protects highlight color in the sky/lights."; }
    if (ideal.brighter) { ev = "+0.7"; evWhy = "You asked for a brighter image — lifted exposure, watch highlights."; }
    add({ key: "ev", label: "Exposure Comp", value: ev, why: evWhy }, false);
  }
  if (cam.aperture) {
    const ap = cam.aperture.type === "fixed"
      ? `${cam.aperture.value} (fixed)`
      : ideal.night ? `Widest (f/${cam.aperture.min ?? "2.0"})` : light >= 4 ? "Stopped down or Auto" : "Auto";
    add({ key: "aperture", label: "Aperture", value: ap, why: cam.aperture.type === "fixed" ? "This camera's aperture doesn't change." : ideal.night ? "Open wide to gather every bit of light." : "Auto aperture is fine here." }, false);
  }
  if (cam.focus.type === "af") {
    const subj = cam.focus.subjectDetection?.length
      ? (scene.group === "people" || ideal.talking ? "Human" : ["wildlife", "pets"].includes(scene.id) ? (cam.focus.subjectDetection.find((s) => /animal/i.test(s)) ?? cam.focus.subjectDetection[0]) : cam.focus.subjectDetection[0])
      : null;
    add({ key: "focus", label: "Autofocus", value: `Continuous AF${subj ? ` + ${subj} detection` : ""}`, why: "Continuous AF with subject detection keeps your subject sharp without thinking about it." }, false);
    add({ key: "focus-area", label: "Focus Area", value: ideal.talking ? "Wide (face priority)" : "Wide / Tracking", why: "Wide-area AF lets the camera find and hold the subject." }, false);
  } else {
    add({ key: "focus", label: "Focus", value: "Fixed (everything sharp)", why: "Action cameras have fixed focus — no focus decisions needed." }, false);
  }
  add({ key: "codec", label: "Codec", value: cam.codecs.includes("H.265") ? "H.265 (HEVC)" : cam.codecs[0], why: "H.265 halves file size at the same quality — use it unless an old editor can't read it." }, false);
  if (cam.maxBitrateMbps) {
    add({ key: "bitrate", label: "Bitrate", value: sc.priority === "storage" ? "Standard" : "Highest available", why: sc.priority === "storage" ? "Standard bitrate keeps files manageable." : "Higher bitrate holds detail in motion and water." }, false);
  }
  add({ key: "sharpening", label: "Sharpening / NR", value: ideal.wantLog ? "Low / Low" : "Default", why: ideal.wantLog ? "When grading, low in-camera processing preserves flexibility." : "Default processing looks right straight off the camera." }, false);
  add({ key: "metering", label: "Metering", value: ideal.talking ? "Face/center priority" : "Matrix / average", why: ideal.talking ? "Metering on the face keeps skin properly exposed as backgrounds change." : "Average metering suits changing scenes." }, false);
  if (cam.hdrVideo && light >= 4 && !ideal.wantLog) {
    add({ key: "hdr", label: "HDR", value: "Optional — try it", why: "HDR helps hold sky and shadow together in harsh light. Skip if it limits your frame rate." }, false);
  }
  if (cam.lowLightMode && ideal.night && mLevel <= 1) {
    add({ key: "lowlight", label: "Low-Light Mode", value: cam.lowLightMode, why: "Purpose-built night mode — worth it when you and the scene are fairly still." }, false);
  }

  // ----- accessories -----
  const accTips: AccessoryTip[] = [];
  if (light >= 4 && (use180 || ideal.cinematic) && !cam.builtInNd) {
    accTips.push({ id: "nd", text: accessories.includes("nd") ? "Use your ND filter to hold the 180° shutter in bright light." : "An ND filter would let you keep cinematic shutter speeds in this light." });
  }
  if (cam.builtInNd && light >= 4) accTips.push({ id: "nd", text: "Use the built-in ND to keep shutter in a natural range." });
  if (scene.water && !scene.underwater) {
    accTips.push({ id: "cpl", text: "A CPL can cut water glare and reflections — rotate it while watching the screen; effect depends on sun angle." });
  }
  if (windy && ideal.talking) accTips.push({ id: "mic", text: "Wind + speech is brutal — use a wind-protected external mic (deadcat)." });
  if (ideal.night && mLevel === 0) accTips.push({ id: "tripod", text: "A tripod (even a mini one) transforms static night shots." });
  if (scene.underwater && cam.waterproof?.toLowerCase().includes("not")) {
    accTips.push({ id: "waterproof-case", text: `${cam.model} is not waterproof — a dive housing is required here.` });
    warnings.push(`${cam.model} is not waterproof. Do not submerge it without a housing.`);
  }
  if (ideal.night) accTips.push({ id: "nd", text: "Skip the ND filter at night — you need every photon." });

  // ----- camera advantages -----
  const advantages: CameraAdvantage[] = cam.specialFeatures
    .filter((f) => f.sceneIds?.includes(scene.id))
    .slice(0, 2)
    .map((f) => ({ name: f.name, desc: f.desc }));

  // ----- confidence -----
  let confidence: ConfidenceLevel = "optimal";
  let confidenceReason = "Light, movement and your camera's strengths all line up. These settings should just work.";
  const smallSensor = cam.category === "action" || cam.category === "360";
  if (light <= 1 && mLevel >= 2) {
    confidence = "challenging";
    confidenceReason = smallSensor
      ? "Very low light plus fast movement is difficult for an action camera. These settings prioritize keeping your subject usable rather than eliminating all noise."
      : "Very low light plus fast movement pushes any camera. Expect some noise — these settings keep motion usable first.";
  } else if (light <= 1 && smallSensor) {
    confidence = "tradeoffs";
    confidenceReason = "Small sensors struggle after dark. These settings trade some smoothness and noise for the cleanest possible image.";
  } else if (ideal.slowMoWanted && mode.fps < 100) {
    confidence = "tradeoffs";
    confidenceReason = "You wanted strong slow motion but this camera/lighting combination limits frame rate. You'll get modest slow-down, not dramatic.";
  } else if (light === 2 && mLevel >= 3) {
    confidence = "tradeoffs";
    confidenceReason = "Dim light with fast action forces a compromise between motion clarity and noise. These settings sit in the middle.";
  } else if (sc.light === "mixed") {
    confidence = "tradeoffs";
    confidenceReason = "Mixed lighting keeps cameras guessing. Locked white balance helps, but expect some shots to need correction.";
  }
  if (cam.confidence === "unverified") {
    warnings.push(`${cam.model}'s specifications are not fully verified in CamCue yet — double-check these modes exist on your camera.`);
  }

  // ----- why it works (summary) -----
  const whyItWorks = buildWhy(cam, scene, sc, mode, stab, fov, ideal, light);

  // ----- don't forget -----
  let dontForget: string | undefined;
  if (cam.preRecord && ["fishing", "fish-strike", "wildlife", "theme-park", "kids", "pets"].includes(scene.id)) {
    dontForget = "Turn on Pre-Record so an unexpected moment is still captured.";
  } else if (scene.water) {
    dontForget = "Check the lens for water droplets before every clip.";
  } else if (ideal.night) {
    dontForget = "Move slowly — night footage exaggerates every shake.";
  } else if (ideal.talking) {
    dontForget = "Record 10 seconds and play it back to confirm audio before the real take.";
  }

  // ----- how to set -----
  const howToSet: Recommendation["howToSet"] = [];
  const mp = cam.menuPaths ?? {};
  const pushPath = (label: string, value: string, key: keyof typeof mp) => {
    howToSet.push({ step: `${label}: ${value}`, path: mp[key] });
  };
  pushPath("Resolution & FPS", `${mode.res} / ${mode.fps}`, "resolution");
  if (stab) pushPath("Stabilization", stab.name, "stabilization");
  if (fov) pushPath("Field of View", fov.name, "fov");
  pushPath("Color", color.name, "color");
  if (settings.some((s) => s.key === "preRecord")) pushPath("Pre-Record", "ON", "preRecord");
  pushPath("Audio", audioValue, "audio");

  return {
    camera: cam, scene, scenario: sc,
    settings, proSettings: [...settings, ...pro],
    whyItWorks, dontForget,
    mistakes: scene.mistakes,
    confidence, confidenceReason,
    advantages, accessories: accTips, warnings, howToSet,
  };
}

// ---------------------------------------------------------------------------
// why-text helpers
// ---------------------------------------------------------------------------

function resWhy(res: string, ideal: IdealProfile): string {
  if (ideal.resPreference === "efficient") return "This resolution balances quality against battery and file size.";
  if (res.includes("360")) return "Full 360 capture — you'll choose the final frame afterwards.";
  return `${res} gives plenty of detail and room to crop or stabilize in post.`;
}

function fpsWhy(fps: number, ideal: IdealProfile, movement: MovementId, light: number): string {
  if (fps >= 100) return `${fps} FPS gives you real slow motion — every frame counts when the action peaks.`;
  if (fps >= 50) return `${fps} FPS keeps fast action smooth and still allows useful slow motion in the edit.`;
  if (fps === 24 || fps === 25) return `${fps} FPS is the classic cinematic look — natural motion blur, film-like feel.`;
  if (light <= 1) return "Lower frame rate lets each frame gather more light — the single biggest night-quality win.";
  return "30 FPS is the dependable all-rounder for this pace.";
}

function fovWhy(fov: FovMode, ideal: IdealProfile, mount: string): string {
  if (fov.distortion === "low") return `${fov.name} keeps lines straight — clean, professional framing.`;
  if (["chest", "helmet", "head"].includes(mount)) return `A wide view from a body mount captures your hands, gear and surroundings without constant re-aiming.`;
  return `${fov.name} captures the scene and subject together without excessive distortion.`;
}

function stabWhy(stab: StabMode, ideal: IdealProfile, mount: string, cam: CameraProfile): string {
  if (stab.strength === 0) return "On a locked-off mount, stabilization off avoids unnecessary crop and artifacts.";
  if (stab.strength === 3) return `${stab.name} is the strongest mode — worth its crop for this much movement.`;
  if (cam.category === "pocket") return "The mechanical gimbal does the stabilizing — smoother than any digital mode.";
  return `${stab.name} smooths this level of shake without over-cropping the image.`;
}

function isoWhy(ideal: IdealProfile): string {
  if (ideal.isoTier === "bright") return "Keeping ISO low reduces digital noise in bright conditions.";
  if (ideal.isoTier === "low") return "A higher ceiling keeps your subject visible — some noise beats a black frame.";
  return "A moderate ISO range handles light shifts without getting noisy.";
}

function colorWhy(color: ColorProfile, ideal: IdealProfile): string {
  if (color.log) return `${color.name} preserves maximum dynamic range for grading — it looks flat until you color it.`;
  if (ideal.wantLog) return "No log profile fits this mode — this finished profile is the best available.";
  return "Finished color that looks right straight off the camera — no grading needed.";
}

function buildWhy(
  cam: CameraProfile, scene: SceneDef, sc: Scenario,
  mode: { res: string; fps: number }, stab: StabMode | null, fov: FovMode | null,
  ideal: IdealProfile, light: number,
): string {
  const parts: string[] = [];
  if (mode.fps >= 50 && !ideal.cinematic) {
    parts.push(`${mode.fps} FPS keeps ${scene.name.toLowerCase()} action smooth while still allowing useful slow motion.`);
  } else if (ideal.cinematic) {
    parts.push(`${mode.fps} FPS with natural motion blur gives this the cinematic feel it deserves.`);
  } else if (light <= 1) {
    parts.push(`A lower frame rate lets every frame gather more light — the biggest quality lever after dark.`);
  } else {
    parts.push(`${mode.res} at ${mode.fps} FPS is the sweet spot for this scene.`);
  }
  if (fov && fov.width >= 3) {
    parts.push(`The wider field of view captures the subject and surroundings without making footage excessively distorted.`);
  } else if (fov && fov.distortion === "low") {
    parts.push(`The low-distortion view keeps lines straight for a clean, professional look.`);
  }
  if (stab && stab.strength >= 2) {
    parts.push(`${stab.name} handles the shake from ${mountLabelLower(sc.mount)} shooting.`);
  }
  return parts.join(" ");
}

function mountLabelLower(mount: string): string {
  const map: Record<string, string> = {
    chest: "chest-mounted", helmet: "helmet-mounted", head: "head-mounted",
    handheld: "handheld", boat: "boat-mounted", vehicle: "vehicle-mounted",
    handlebar: "handlebar-mounted", selfie: "selfie", "selfie-stick": "selfie-stick",
    gimbal: "gimbal", tripod: "tripod", "stick-360": "360-stick", unknown: "handheld",
  };
  return map[mount] ?? "handheld";
}

// ---------------------------------------------------------------------------
// WHAT IF? mode — change one variable, see the consequence
// ---------------------------------------------------------------------------

export interface WhatIfOption { id: string; label: string }

export function whatIfOptions(cam: CameraProfile, rec: Recommendation): WhatIfOption[] {
  const opts: WhatIfOption[] = [];
  const curFps = parseInt(rec.settings.find((s) => s.key === "fps")?.value ?? "30");
  const allFps = Array.from(new Set(cam.videoModes.flatMap((m) => m.fps))).sort((a, b) => a - b);
  for (const f of [24, 30, 60, 120]) {
    if (f !== curFps && allFps.includes(f)) opts.push({ id: `fps-${f}`, label: `What if I use ${f} FPS?` });
  }
  const logP = cam.colorProfiles.find((p) => p.log);
  const curColor = rec.settings.find((s) => s.key === "color")?.value;
  if (logP && curColor !== logP.name) opts.push({ id: "log", label: `What if I use ${logP.name}?` });
  if (logP && curColor === logP.name) opts.push({ id: "normal", label: "What if I skip log and shoot Normal?" });
  const strongest = [...cam.stabilization].sort((a, b) => b.strength - a.strength)[0];
  const curStab = rec.settings.find((s) => s.key === "stabilization")?.value;
  if (strongest && curStab && strongest.name !== curStab && strongest.strength === 3) {
    opts.push({ id: "max-stab", label: `What if I use ${strongest.name}?` });
  }
  opts.push({ id: "higher-res", label: "What if I shoot at the highest resolution?" });
  return opts.slice(0, 5);
}

export function whatIfAnswer(cam: CameraProfile, scene: SceneDef, sc: Scenario, rec: Recommendation, optionId: string): string {
  const light = lightLevel[sc.light];
  const curFps = parseInt(rec.settings.find((s) => s.key === "fps")?.value ?? "30");

  if (optionId.startsWith("fps-")) {
    const f = parseInt(optionId.slice(4));
    if (f > curFps) {
      if (f >= 100) {
        return light >= 4
          ? `You'll get much better slow motion — ${f} FPS slowed to 30 is a dramatic ${Math.round(f / 30)}x slow-down. Files get larger and battery drains faster, but in this light it's a legitimate choice.`
          : `You'll get much better slow motion, but the camera receives less light per frame and files become larger. In these lighting conditions, ${curFps} FPS is the safer choice.`;
      }
      return light >= 3
        ? `Motion gets noticeably smoother and you gain mild slow-motion flexibility. The trade: larger files and a slightly less filmic feel.`
        : `Smoother motion, but each frame gets less light — in this dim setting you'd trade image quality for smoothness. Probably not worth it.`;
    }
    if (f <= 25) {
      return `You'd get the classic cinematic feel with natural motion blur${(sc.movement ?? scene.motion) === "fast" || (sc.movement ?? scene.motion) === "extreme" ? ", but fast action will look choppier and you lose slow-motion flexibility" : " and smaller files"}. Best when you want mood over smoothness.`;
    }
    return `Slightly less smooth than ${curFps} FPS but smaller files and a touch more light per frame. Fine for relaxed pacing.`;
  }
  if (optionId === "log") {
    const logP = cam.colorProfiles.find((p) => p.log)!;
    return `Use ${logP.name} if you plan to color grade — it protects highlights and gives ${logP.bitDepth}-bit flexibility. If you're uploading straight from your phone, Normal is easier and will usually look better without additional editing.`;
  }
  if (optionId === "normal") {
    return "Normal gives you finished, punchy color with zero editing required. You give up grading flexibility and some highlight headroom — fine for anything going straight online.";
  }
  if (optionId === "max-stab") {
    const strongest = [...cam.stabilization].sort((a, b) => b.strength - a.strength)[0];
    const limits = [
      strongest.maxFps ? `only works up to ${strongest.maxFps} FPS` : null,
      strongest.resExclude?.length ? `unavailable at ${strongest.resExclude.join("/")}` : null,
      strongest.crop ? "crops the image noticeably" : null,
    ].filter(Boolean).join(", ");
    return `${strongest.name} locks the horizon completely — great for spins and rough motion. But it ${limits || "trades field of view for stability"}. Use it when the shot would otherwise be unwatchable, not by default.`;
  }
  if (optionId === "higher-res") {
    const top = [...cam.videoModes].sort((a, b) => parseFloat(b.res) - parseFloat(a.res))[0];
    return `${top.res} maximizes detail and crop room, but files balloon and frame-rate options often shrink. Worth it for landscapes and b-roll; overkill for fast POV where stabilization crops anyway.`;
  }
  return "Changing that variable doesn't meaningfully alter this setup.";
}
