// CamCue core types — camera capability engine
// Machine-readable capability profiles. Never scatter specs in components.

export type CameraCategory =
  | "action"
  | "360"
  | "pocket"
  | "vlogging"
  | "compact"
  | "mirrorless"
  | "cinema";

export type Confidence = "verified" | "high" | "unverified";

export interface VideoMode {
  res: string; // "4K", "5.3K", "2.7K", "1080p", "6K open-gate" etc
  fps: number[]; // frame rates available at this resolution
  aspect?: string[]; // e.g. ["16:9","4:3"] — default 16:9
  note?: string;
}

export interface StabMode {
  id: string;
  name: string; // "RockSteady", "HyperSmooth", "Active", "IBIS"...
  strength: 0 | 1 | 2 | 3; // 0=off, 3=strongest
  maxFps?: number; // unavailable above this fps
  minFps?: number;
  resExclude?: string[]; // resolutions where unavailable
  fovExclude?: string[]; // FOV ids incompatible with this mode
  crop?: boolean; // crops the image
  note?: string;
}

export interface ColorProfile {
  id: string;
  name: string; // "Normal", "D-Log M", "S-Log3", "10-bit HLG"...
  bitDepth: 8 | 10 | 12;
  log: boolean;
  note?: string;
  modesExclude?: string[]; // resolutions/fps where unavailable, freeform match on res
}

export interface FovMode {
  id: string;
  name: string; // "Natural Wide", "Linear", "HyperView", "Dewarp"...
  distortion: "low" | "medium" | "high";
  width: 1 | 2 | 3 | 4; // 1=narrow ... 4=ultra wide
  note?: string;
}

export interface SpecialFeature {
  id: string;
  name: string;
  desc: string; // plain-English one-liner
  sceneIds?: string[]; // scenes where this is a Camera Advantage
  verified?: boolean;
}

export interface CameraProfile {
  id: string; // slug: "dji-osmo-action-6"
  manufacturer: string;
  model: string;
  category: CameraCategory;
  sensor: string;
  popular?: boolean;

  // verification metadata
  confidence: Confidence;
  lastVerified: string; // ISO date
  firmwareChecked?: string;
  officialSource?: string;
  verifyNote?: string;

  videoModes: VideoMode[];
  slowMotion?: { res: string; fps: number }[]; // dedicated slow-mo modes
  verticalNative?: boolean; // sensor allows true vertical / rotating module
  openGate?: boolean;

  stabilization: StabMode[];
  horizonLeveling?: { name: string; note?: string };

  colorProfiles: ColorProfile[];
  codecs: string[];
  maxBitrateMbps?: number;

  iso: { min: number; max: number };
  recommendedIsoCeiling?: { bright: number; normal: number; low: number };
  shutterControl: boolean; // manual shutter available
  aperture?: { type: "fixed" | "variable"; value?: string; min?: number; max?: number };
  evComp?: boolean;
  whiteBalance?: "auto-only" | "full";

  fovModes?: FovMode[];
  lensMount?: string; // for ILCs, e.g. "Sony E"

  focus: {
    type: "fixed" | "af";
    modes?: string[];
    subjectDetection?: string[];
  };

  audio: {
    mics: string;
    windReduction: boolean;
    externalMic?: string; // "USB-C", "3.5mm", "hot shoe digital"
    wireless?: string; // "DJI Mic direct", "GoPro remote", "sold separately"
  };

  preRecord?: { maxSeconds: number };
  loopRecording?: boolean;
  hdrVideo?: string;
  lowLightMode?: string;
  timelapse?: boolean;
  hyperlapse?: boolean;
  builtInNd?: boolean;

  waterproof?: string;
  battery?: string;
  thermal?: string;
  storage?: string;

  specialFeatures: SpecialFeature[];

  // "Set it on my camera" — settingKey -> menu path string
  menuPaths?: Partial<Record<SettingKey, string>>;

  bestFor: string[];
  strengths: string[];
  weaknesses: string[];
}

export type SettingKey =
  | "resolution"
  | "fps"
  | "fov"
  | "stabilization"
  | "shutter"
  | "iso"
  | "whiteBalance"
  | "color"
  | "audio"
  | "preRecord"
  | "orientation"
  | "ev"
  | "focus"
  | "bitrate"
  | "nd";

// ---------- scenario inputs ----------

export type LightId =
  | "bright-sun" | "partly-cloudy" | "overcast" | "shade"
  | "indoor-bright" | "indoor-dim" | "golden-hour" | "blue-hour"
  | "night" | "very-dark" | "mixed";

export type MovementId = "stationary" | "slow" | "moderate" | "fast" | "extreme";

export type MountId =
  | "handheld" | "selfie" | "tripod" | "chest" | "head" | "helmet"
  | "vehicle" | "boat" | "handlebar" | "gimbal" | "selfie-stick"
  | "stick-360" | "unknown";

export type PlatformId =
  | "youtube" | "youtube-shorts" | "tiktok" | "instagram-reels"
  | "instagram-feed" | "facebook" | "personal" | "professional" | "unsure";

export type EditingId = "none" | "basic" | "grade" | "unsure";

export type PriorityId =
  | "quality" | "balanced" | "battery" | "storage" | "slowmo" | "lowlight";

export type AudioPrefId = "camera" | "wireless" | "external" | "none";

export type AccessoryId =
  | "nd" | "cpl" | "tripod" | "gimbal" | "mic" | "chest"
  | "selfie-stick" | "waterproof-case" | "lighting" | "nothing";

export interface SceneDef {
  id: string;
  name: string;
  emoji: string;
  group: "outdoors" | "action" | "travel" | "people" | "creator" | "special";
  // scene DNA the engine consumes
  motion: MovementId; // typical subject motion
  slowMoValue: 0 | 1 | 2 | 3; // how valuable slow motion is here
  cinematicBias?: boolean; // 24fps look preferred
  defaultLight?: LightId;
  defaultMount?: MountId;
  wide?: boolean; // favors wide FOV
  tight?: boolean; // favors low-distortion / linear
  talking?: boolean; // speech audio is critical
  water?: boolean;
  vertical?: boolean; // platform-vertical scene (tiktok etc)
  night?: boolean;
  timelapse?: "timelapse" | "hyperlapse";
  photo?: boolean;
  underwater?: boolean;
  mistakes: string[]; // scenario-specific "don't mess this up"
  tips?: string[];
}

export interface Scenario {
  cameraId: string;
  sceneId: string;
  light: LightId;
  movement?: MovementId; // override scene default
  mount: MountId;
  platform?: PlatformId;
  editing?: EditingId;
  priority?: PriorityId;
  audioPref?: AudioPrefId;
  accessories?: AccessoryId[];
  tweaks?: TweakId[];
}

export type TweakId =
  | "cinematic" | "smoother" | "lowlight" | "battery" | "storage"
  | "slowmo" | "less-distortion" | "brighter" | "pro-color";

// ---------- engine output ----------

export type ConfidenceLevel = "optimal" | "tradeoffs" | "challenging";

export interface SettingLine {
  key: SettingKey | string;
  label: string; // "Frame Rate"
  value: string; // "60 FPS"
  pro?: boolean; // only shown in Pro Breakdown
  why?: string; // short expandable explanation
}

export interface AccessoryTip {
  id: AccessoryId | string;
  text: string;
}

export interface CameraAdvantage {
  name: string;
  desc: string;
}

export interface Recommendation {
  camera: CameraProfile;
  scene: SceneDef;
  scenario: Scenario;
  settings: SettingLine[]; // primary tiles (Just Tell Me)
  proSettings: SettingLine[]; // full Pro Breakdown
  whyItWorks: string; // summary paragraph
  dontForget?: string;
  mistakes: string[];
  confidence: ConfidenceLevel;
  confidenceReason: string;
  advantages: CameraAdvantage[];
  accessories: AccessoryTip[];
  warnings: string[];
  howToSet: { step: string; path?: string }[];
}
