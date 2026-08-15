import type { Scenario } from "../types";

// Scene Recipes — curated expert presets.
// A recipe is a *scenario input*, not stored settings: it runs through the
// recommendation engine, so it always respects camera capabilities and stays
// correct as camera data evolves.

export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  cameraId: string;
  verified: boolean; // CamCue Verified vs community
  note?: string; // one-line expert note shown on the card
  scenario: Omit<Scenario, "cameraId">;
}

const a6 = "dji-osmo-action-6";

export const recipes: Recipe[] = [
  { id: "a6-boat-running", name: "Boat Running", emoji: "🚤", cameraId: a6, verified: true,
    note: "Mounted wide shot with maximum stabilization for chop.",
    scenario: { sceneId: "boating", light: "bright-sun", mount: "boat", movement: "extreme" } },
  { id: "a6-boat-wide", name: "Boat-Mounted Wide", emoji: "📐", cameraId: a6, verified: true,
    note: "Set-and-forget deck angle that captures everything.",
    scenario: { sceneId: "boating", light: "bright-sun", mount: "boat", movement: "moderate" } },
  { id: "a6-beach-day", name: "Bright Sunny Beach", emoji: "🏖", cameraId: a6, verified: true,
    note: "Sun, sand and splash without blown highlights.",
    scenario: { sceneId: "beach", light: "bright-sun", mount: "handheld", movement: "moderate" } },
  { id: "a6-walking-vlog", name: "Walking Vlog", emoji: "🚶", cameraId: a6, verified: true,
    note: "Selfie-arm framing with smooth walk stabilization.",
    scenario: { sceneId: "vlog", light: "partly-cloudy", mount: "selfie", platform: "youtube" } },
  { id: "a6-night-market", name: "Night Market Walk", emoji: "🌃", cameraId: a6, verified: true,
    note: "Bangkok-style neon — low FPS, controlled ISO, slow steps.",
    scenario: { sceneId: "night-market", light: "night", mount: "handheld", movement: "slow" } },
  { id: "a6-indoor-restaurant", name: "Indoor Restaurant", emoji: "🍜", cameraId: a6, verified: true,
    note: "Dim-light table shots that stay clean.",
    scenario: { sceneId: "restaurant", light: "indoor-dim", mount: "handheld" } },
  { id: "a6-food-closeup", name: "Food Close-Up", emoji: "🍔", cameraId: a6, verified: true,
    note: "Low-distortion detail shots with slow-mo steam and pulls.",
    scenario: { sceneId: "food-video", light: "indoor-bright", mount: "tripod", priority: "slowmo" } },
  { id: "a6-kids-running", name: "Kids Running", emoji: "👶", cameraId: a6, verified: true,
    note: "Fast little humans, captured smooth with slow-mo backup.",
    scenario: { sceneId: "kids", light: "partly-cloudy", mount: "handheld", movement: "fast", priority: "slowmo" } },
  { id: "a6-family-travel", name: "Family Travel", emoji: "👨‍👩‍👧", cameraId: a6, verified: true,
    note: "One setting for the whole day out.",
    scenario: { sceneId: "family", light: "partly-cloudy", mount: "handheld" } },
  { id: "a6-moto-helmet", name: "Motorcycle Helmet", emoji: "🏍", cameraId: a6, verified: true,
    note: "Chin-mount POV — wind reduction and horizon control on.",
    scenario: { sceneId: "motorcycle", light: "bright-sun", mount: "helmet", movement: "extreme" } },
  { id: "a6-moto-mounted", name: "Motorcycle Mounted", emoji: "🔩", cameraId: a6, verified: true,
    note: "Frame-mounted angle; stabilization fights engine buzz.",
    scenario: { sceneId: "motorcycle", light: "bright-sun", mount: "vehicle", movement: "extreme" } },
  { id: "a6-car-mounted", name: "Car Mounted", emoji: "🚗", cameraId: a6, verified: true,
    note: "Road-trip exterior or dash angle.",
    scenario: { sceneId: "road-trip", light: "bright-sun", mount: "vehicle", movement: "fast" } },
  { id: "a6-hiking", name: "Hiking", emoji: "🥾", cameraId: a6, verified: true,
    note: "Chest-mount trail POV with locked white balance for forest light.",
    scenario: { sceneId: "hiking", light: "partly-cloudy", mount: "chest", movement: "slow" } },
  { id: "a6-cycling", name: "Cycling", emoji: "🚲", cameraId: a6, verified: true,
    note: "Smooth road POV — chest beats handlebar for vibration.",
    scenario: { sceneId: "cycling", light: "partly-cloudy", mount: "chest", movement: "fast" } },
  { id: "a6-gym", name: "Gym Session", emoji: "🏋️", cameraId: a6, verified: true,
    note: "Anti-flicker shutter with clean framing for lifts.",
    scenario: { sceneId: "gym", light: "indoor-bright", mount: "tripod", movement: "moderate" } },
  { id: "a6-slowmo-action", name: "Slow-Motion Action", emoji: "🐌", cameraId: a6, verified: true,
    note: "Maximum frame rate the light will allow.",
    scenario: { sceneId: "slowmo", light: "bright-sun", mount: "handheld", movement: "extreme", priority: "slowmo" } },
  { id: "a6-sunset", name: "Perfect Sunset", emoji: "🌇", cameraId: a6, verified: true,
    note: "Protects sky color; cinematic pacing.",
    scenario: { sceneId: "sunset", light: "golden-hour", mount: "tripod", editing: "basic" } },
  { id: "a6-sunrise", name: "Sunrise", emoji: "🌅", cameraId: a6, verified: true,
    note: "Early light, locked exposure, patient frames.",
    scenario: { sceneId: "sunrise", light: "golden-hour", mount: "tripod", editing: "basic" } },
  { id: "a6-low-light", name: "Low Light", emoji: "🌑", cameraId: a6, verified: true,
    note: "SuperNight-ready settings for after dark.",
    scenario: { sceneId: "night", light: "very-dark", mount: "handheld", movement: "slow" } },
  { id: "a6-talking-head", name: "Talking to Camera", emoji: "👤", cameraId: a6, verified: true,
    note: "Front-screen framing with DJI Mic audio priority.",
    scenario: { sceneId: "talking-head", light: "indoor-bright", mount: "tripod", audioPref: "wireless" } },
  { id: "a6-youtube-vlog", name: "YouTube Vlog", emoji: "▶️", cameraId: a6, verified: true,
    note: "The all-day vlog baseline.",
    scenario: { sceneId: "vlog", light: "partly-cloudy", mount: "selfie", platform: "youtube", audioPref: "wireless" } },
  { id: "a6-vertical", name: "TikTok / Reels Vertical", emoji: "📱", cameraId: a6, verified: true,
    note: "True vertical capture from the square sensor.",
    scenario: { sceneId: "tiktok", light: "indoor-bright", mount: "handheld", platform: "tiktok" } },
  { id: "a6-cinematic-broll", name: "Cinematic B-Roll", emoji: "🎞", cameraId: a6, verified: true,
    note: "180° shutter, D-Log M, deliberate moves.",
    scenario: { sceneId: "cinematic", light: "golden-hour", mount: "handheld", editing: "grade", accessories: ["nd"] } },
  { id: "a6-timelapse", name: "Timelapse", emoji: "⏱", cameraId: a6, verified: true,
    note: "Locked-off interval shooting.",
    scenario: { sceneId: "timelapse", light: "golden-hour", mount: "tripod" } },
  { id: "a6-hyperlapse", name: "Hyperlapse", emoji: "⚡", cameraId: a6, verified: true,
    note: "Walk-through time compression with a fixed target.",
    scenario: { sceneId: "hyperlapse", light: "partly-cloudy", mount: "handheld" } },
  { id: "a6-rain", name: "Rain", emoji: "🌧", cameraId: a6, verified: true,
    note: "Moody weather footage — the Action 6 doesn't care that it's wet.",
    scenario: { sceneId: "nature", light: "overcast", mount: "handheld", movement: "slow", tweaks: ["cinematic"] } },
  { id: "a6-water-sports", name: "Water Sports", emoji: "🏄", cameraId: a6, verified: true,
    note: "Splash-heavy fast action with slow-mo on tap.",
    scenario: { sceneId: "surfing", light: "bright-sun", mount: "helmet", movement: "extreme", priority: "slowmo" } },

  // A couple of cross-camera verified recipes so other cameras feel alive
  { id: "p3-night-walk", name: "Night City Walk", emoji: "🌃", cameraId: "dji-osmo-pocket-3", verified: true,
    note: "The Pocket 3's 1\" sensor plus gimbal is built for exactly this.",
    scenario: { sceneId: "night-market", light: "night", mount: "handheld", movement: "slow" } },
  { id: "p3-talking-head", name: "Creator Talking Head", emoji: "👤", cameraId: "dji-osmo-pocket-3", verified: true,
    note: "Face tracking keeps you centered while you present.",
    scenario: { sceneId: "talking-head", light: "indoor-bright", mount: "tripod", audioPref: "wireless" } },
  { id: "hero13-mtb", name: "Mountain Bike POV", emoji: "🚵", cameraId: "gopro-hero13-black", verified: true,
    note: "HyperSmooth POV for rough trails.",
    scenario: { sceneId: "cycling", light: "partly-cloudy", mount: "chest", movement: "extreme" } },
  { id: "zve10ii-talking", name: "Sony Talking Head", emoji: "🎙", cameraId: "sony-zv-e10-ii", verified: true,
    note: "Product-ready creator setup with clean autofocus.",
    scenario: { sceneId: "talking-head", light: "indoor-bright", mount: "tripod", audioPref: "external", editing: "basic" } },
];

export function getRecipe(id: string): Recipe | undefined {
  return recipes.find((r) => r.id === id);
}

export function recipesForCamera(cameraId: string): Recipe[] {
  return recipes.filter((r) => r.cameraId === cameraId);
}
