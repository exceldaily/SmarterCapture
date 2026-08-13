import type {
  LightId, MovementId, MountId, PlatformId, EditingId,
  PriorityId, AudioPrefId, AccessoryId, TweakId,
} from "../types";

export const lightOptions: { id: LightId; name: string; emoji: string }[] = [
  { id: "bright-sun", name: "Bright Sun", emoji: "☀️" },
  { id: "partly-cloudy", name: "Partly Cloudy", emoji: "⛅" },
  { id: "overcast", name: "Overcast", emoji: "☁️" },
  { id: "shade", name: "Shade", emoji: "🌳" },
  { id: "indoor-bright", name: "Indoor Bright", emoji: "💡" },
  { id: "indoor-dim", name: "Indoor Dim", emoji: "🕯" },
  { id: "golden-hour", name: "Golden Hour", emoji: "🌇" },
  { id: "blue-hour", name: "Blue Hour", emoji: "🌆" },
  { id: "night", name: "Night", emoji: "🌙" },
  { id: "very-dark", name: "Very Dark", emoji: "🌑" },
  { id: "mixed", name: "Mixed Lighting", emoji: "🎭" },
];

// relative light level 0 (very dark) .. 5 (bright sun)
export const lightLevel: Record<LightId, number> = {
  "bright-sun": 5, "partly-cloudy": 4, overcast: 3, shade: 3,
  "indoor-bright": 3, "golden-hour": 3, "blue-hour": 2, "indoor-dim": 2,
  mixed: 2, night: 1, "very-dark": 0,
};

export const movementOptions: { id: MovementId; name: string; emoji: string }[] = [
  { id: "stationary", name: "Stationary", emoji: "🧍" },
  { id: "slow", name: "Slow", emoji: "🚶" },
  { id: "moderate", name: "Moderate", emoji: "🏃" },
  { id: "fast", name: "Fast", emoji: "🚴" },
  { id: "extreme", name: "Extremely Fast", emoji: "🏎" },
];

export const movementLevel: Record<MovementId, number> = {
  stationary: 0, slow: 1, moderate: 2, fast: 3, extreme: 4,
};

export const mountOptions: { id: MountId; name: string; emoji: string }[] = [
  { id: "handheld", name: "Handheld", emoji: "✋" },
  { id: "selfie", name: "Selfie", emoji: "🤳" },
  { id: "tripod", name: "Tripod", emoji: "🔺" },
  { id: "chest", name: "Chest Mount", emoji: "🎽" },
  { id: "head", name: "Head Mount", emoji: "🎩" },
  { id: "helmet", name: "Helmet", emoji: "⛑" },
  { id: "vehicle", name: "Vehicle Mount", emoji: "🚗" },
  { id: "boat", name: "Boat Mount", emoji: "🚤" },
  { id: "handlebar", name: "Handlebar", emoji: "🚲" },
  { id: "gimbal", name: "Gimbal", emoji: "🎥" },
  { id: "selfie-stick", name: "Selfie Stick", emoji: "🥢" },
  { id: "stick-360", name: "360 Stick", emoji: "🪄" },
  { id: "unknown", name: "Not Sure", emoji: "❓" },
];

// how much shake the mount introduces 0 (rock solid) .. 3 (very shaky)
export const mountShake: Record<MountId, number> = {
  tripod: 0, gimbal: 0, vehicle: 2, boat: 2, handlebar: 3,
  chest: 3, head: 2, helmet: 2, handheld: 2, selfie: 2,
  "selfie-stick": 2, "stick-360": 1, unknown: 2,
};

export const platformOptions: { id: PlatformId; name: string; emoji: string; vertical?: boolean }[] = [
  { id: "youtube", name: "YouTube", emoji: "▶️" },
  { id: "youtube-shorts", name: "YouTube Shorts", emoji: "📱", vertical: true },
  { id: "tiktok", name: "TikTok", emoji: "🎵", vertical: true },
  { id: "instagram-reels", name: "Instagram Reels", emoji: "📸", vertical: true },
  { id: "instagram-feed", name: "Instagram Feed", emoji: "🖼" },
  { id: "facebook", name: "Facebook", emoji: "👍" },
  { id: "personal", name: "Personal", emoji: "🏠" },
  { id: "professional", name: "Professional Production", emoji: "🎬" },
  { id: "unsure", name: "Not Sure", emoji: "❓" },
];

export const editingOptions: { id: EditingId; name: string }[] = [
  { id: "none", name: "No Editing" },
  { id: "basic", name: "Basic Editing" },
  { id: "grade", name: "Full Color Grade" },
  { id: "unsure", name: "Not Sure" },
];

export const priorityOptions: { id: PriorityId; name: string }[] = [
  { id: "quality", name: "Best Quality" },
  { id: "balanced", name: "Balanced" },
  { id: "battery", name: "Longest Battery" },
  { id: "storage", name: "Smallest Files" },
  { id: "slowmo", name: "Best Slow Motion" },
  { id: "lowlight", name: "Best Low Light" },
];

export const audioPrefOptions: { id: AudioPrefId; name: string }[] = [
  { id: "camera", name: "Camera Microphone" },
  { id: "wireless", name: "Wireless Microphone" },
  { id: "external", name: "External Microphone" },
  { id: "none", name: "Audio Doesn't Matter" },
];

export const accessoryOptions: { id: AccessoryId; name: string }[] = [
  { id: "nd", name: "ND Filters" },
  { id: "cpl", name: "CPL Filter" },
  { id: "tripod", name: "Tripod" },
  { id: "gimbal", name: "Gimbal" },
  { id: "mic", name: "External Microphone" },
  { id: "chest", name: "Chest Mount" },
  { id: "selfie-stick", name: "Selfie Stick" },
  { id: "waterproof-case", name: "Waterproof Case" },
  { id: "lighting", name: "Extra Lighting" },
  { id: "nothing", name: "Nothing" },
];

export const tweakOptions: { id: TweakId; name: string }[] = [
  { id: "cinematic", name: "Make It More Cinematic" },
  { id: "smoother", name: "Make Motion Smoother" },
  { id: "lowlight", name: "Improve Low Light" },
  { id: "battery", name: "Save Battery" },
  { id: "storage", name: "Save Storage" },
  { id: "slowmo", name: "Better Slow Motion" },
  { id: "less-distortion", name: "Less Distortion" },
  { id: "brighter", name: "Brighter Image" },
  { id: "pro-color", name: "More Professional Color" },
];
