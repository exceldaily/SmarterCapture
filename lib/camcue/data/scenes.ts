import type { SceneDef } from "../types";

// Scene catalog — the "what are you shooting?" cards.
// Each scene carries the DNA the recommendation engine consumes plus
// scenario-specific "don't mess this up" advice.

export const scenes: SceneDef[] = [
  // ---------- OUTDOORS ----------
  {
    id: "fishing", name: "Fishing", emoji: "🎣", group: "outdoors",
    motion: "fast", slowMoValue: 2, wide: true, water: true,
    defaultLight: "bright-sun", defaultMount: "chest",
    mistakes: [
      "Clean water droplets from the lens between shots — one drop ruins an hour of footage.",
      "Keep Pre-Record enabled — strikes never wait for the record button.",
      "Don't point straight into harsh sun unless you want a backlit silhouette.",
    ],
  },
  {
    id: "boating", name: "Boating", emoji: "🚤", group: "outdoors",
    motion: "fast", slowMoValue: 1, wide: true, water: true,
    defaultLight: "bright-sun", defaultMount: "boat",
    mistakes: [
      "Wipe salt spray off the lens regularly — it dries into haze.",
      "Mount low and rigid; rail-mounted cameras pick up engine vibration.",
    ],
  },
  {
    id: "beach", name: "Beach", emoji: "🏖", group: "outdoors",
    motion: "moderate", slowMoValue: 2, wide: true, water: true,
    defaultLight: "bright-sun", defaultMount: "handheld",
    mistakes: [
      "Sand kills cameras — never set it lens-down.",
      "Bright sand fools exposure; drop EV slightly so skin isn't blown out.",
    ],
  },
  {
    id: "hiking", name: "Hiking", emoji: "🥾", group: "outdoors",
    motion: "slow", slowMoValue: 0, wide: true,
    defaultLight: "partly-cloudy", defaultMount: "chest",
    mistakes: [
      "Shoot short clips, not one endless recording — you'll never edit a 2-hour file.",
      "Mixed forest light flickers; keep white balance locked, not auto.",
    ],
  },
  {
    id: "camping", name: "Camping", emoji: "🏕", group: "outdoors",
    motion: "slow", slowMoValue: 0,
    defaultLight: "golden-hour", defaultMount: "tripod",
    mistakes: [
      "Campfire scenes: expose for faces, let the fire blow out slightly.",
      "Cold nights drain batteries fast — keep spares in a warm pocket.",
    ],
  },
  {
    id: "nature", name: "Nature", emoji: "🌲", group: "outdoors",
    motion: "slow", slowMoValue: 1, cinematicBias: true,
    defaultLight: "partly-cloudy", defaultMount: "handheld",
    mistakes: [
      "Move the camera slowly — nature footage falls apart with jerky pans.",
    ],
  },
  {
    id: "wildlife", name: "Wildlife", emoji: "🐦", group: "outdoors",
    motion: "fast", slowMoValue: 3, tight: true,
    defaultLight: "partly-cloudy", defaultMount: "tripod",
    mistakes: [
      "Animals don't do second takes — use Pre-Record or pre-roll burst if you have it.",
      "Wide FOV makes animals tiny; get closer or accept an environmental shot.",
    ],
  },
  {
    id: "ocean", name: "Ocean", emoji: "🌊", group: "outdoors",
    motion: "moderate", slowMoValue: 2, wide: true, water: true,
    defaultLight: "bright-sun", defaultMount: "handheld",
    mistakes: [
      "Rinse the camera in fresh water after salt exposure.",
      "Waves look slower on camera than in person — slow motion helps them read as powerful.",
    ],
  },
  {
    id: "mountains", name: "Mountains", emoji: "🏔", group: "outdoors",
    motion: "stationary", slowMoValue: 0, cinematicBias: true,
    defaultLight: "bright-sun", defaultMount: "tripod",
    mistakes: [
      "Haze flattens distant peaks — a CPL and shooting earlier in the day both help.",
    ],
  },
  {
    id: "sunrise", name: "Sunrise", emoji: "🌅", group: "outdoors",
    motion: "stationary", slowMoValue: 0, cinematicBias: true,
    defaultLight: "golden-hour", defaultMount: "tripod",
    mistakes: [
      "Arrive 30 minutes early — the best color is often before the sun appears.",
      "Don't trust auto exposure; it will brighten the sky and kill the mood.",
    ],
  },
  {
    id: "sunset", name: "Sunset", emoji: "🌇", group: "outdoors",
    motion: "stationary", slowMoValue: 0, cinematicBias: true,
    defaultLight: "golden-hour", defaultMount: "tripod",
    mistakes: [
      "Underexpose slightly to keep the sky's color — you can lift shadows later.",
      "Stay 20 minutes after the sun drops; the afterglow is often the best light.",
    ],
  },

  // ---------- ACTION ----------
  {
    id: "motorcycle", name: "Motorcycle", emoji: "🏍", group: "action",
    motion: "extreme", slowMoValue: 1, wide: true,
    defaultLight: "bright-sun", defaultMount: "helmet",
    mistakes: [
      "Wind roar destroys audio — enable wind reduction and plan music/voiceover.",
      "Chin-mount looks best; top-of-helmet mounts look like a periscope.",
      "Check mount tightness at every stop — vibration loosens everything.",
    ],
  },
  {
    id: "cycling", name: "Cycling", emoji: "🚲", group: "action",
    motion: "fast", slowMoValue: 1, wide: true,
    defaultLight: "partly-cloudy", defaultMount: "handlebar",
    mistakes: [
      "Handlebar mounts show harsh vibration — chest or helmet is smoother.",
      "Keep the horizon level; leaning shots need horizon leveling on.",
    ],
  },
  {
    id: "snowboarding", name: "Snowboarding", emoji: "🏂", group: "action",
    motion: "extreme", slowMoValue: 3, wide: true,
    defaultLight: "bright-sun", defaultMount: "helmet",
    mistakes: [
      "Snow tricks exposure meters — add a touch of positive EV so snow is white, not gray.",
      "Cold drains batteries — keep spares inside your jacket.",
    ],
  },
  {
    id: "skiing", name: "Skiing", emoji: "⛷", group: "action",
    motion: "extreme", slowMoValue: 3, wide: true,
    defaultLight: "bright-sun", defaultMount: "helmet",
    mistakes: [
      "Add positive EV so snow reads white, not gray.",
      "Pole-mounted selfie follow-shots beat helmet POV for showing the skier.",
    ],
  },
  {
    id: "surfing", name: "Surfing", emoji: "🏄", group: "action",
    motion: "extreme", slowMoValue: 3, wide: true, water: true,
    defaultLight: "bright-sun", defaultMount: "helmet",
    mistakes: [
      "Spit-and-rinse or hydrophobic coating — water drops on the lens ruin every wave.",
      "Mouth mounts give the classic surf POV angle.",
    ],
  },
  {
    id: "motorsports", name: "Motorsports", emoji: "🏎", group: "action",
    motion: "extreme", slowMoValue: 2, wide: true,
    defaultLight: "bright-sun", defaultMount: "vehicle",
    mistakes: [
      "Use a slightly faster shutter than the usual rule so panning shots keep energy without total blur.",
      "Rigid mounts only — suction mounts on vibrating panels produce jello.",
    ],
  },
  {
    id: "sports", name: "Sports", emoji: "🏀", group: "action",
    motion: "fast", slowMoValue: 3,
    defaultLight: "indoor-bright", defaultMount: "tripod",
    mistakes: [
      "Indoor gyms are darker than they look — don't force 120 FPS in bad light.",
      "Frame wider than you think; fast action leaves tight frames constantly.",
    ],
  },
  {
    id: "gym", name: "Gym", emoji: "🏋️", group: "action",
    motion: "moderate", slowMoValue: 2,
    defaultLight: "indoor-bright", defaultMount: "tripod",
    mistakes: [
      "Gym lighting flickers on camera — match shutter to local mains (1/50 or 1/60) if you see banding.",
      "Wide angle up close distorts bodies; step back and zoom/crop instead.",
    ],
  },
  {
    id: "boxing", name: "Boxing / Martial Arts", emoji: "🥊", group: "action",
    motion: "extreme", slowMoValue: 3,
    defaultLight: "indoor-bright", defaultMount: "tripod",
    mistakes: [
      "Slow motion is everything here — light the space as brightly as you can.",
    ],
  },
  {
    id: "running", name: "Running", emoji: "🏃", group: "action",
    motion: "fast", slowMoValue: 1, wide: true,
    defaultLight: "partly-cloudy", defaultMount: "chest",
    mistakes: [
      "Chest mounts bounce with every step — strongest stabilization mode on.",
    ],
  },

  // ---------- TRAVEL ----------
  {
    id: "walking-tour", name: "Walking Tour", emoji: "🚶", group: "travel",
    motion: "slow", slowMoValue: 0, wide: true,
    defaultLight: "partly-cloudy", defaultMount: "handheld",
    mistakes: [
      "Walk heel-to-toe smoothly — stabilization can't fix bouncy walking.",
      "Shoot 10–20 second clips of many things, not minutes of one street.",
    ],
  },
  {
    id: "city", name: "City", emoji: "🏙", group: "travel",
    motion: "slow", slowMoValue: 1, cinematicBias: true,
    defaultLight: "partly-cloudy", defaultMount: "handheld",
    mistakes: [
      "Look for reflections, leading lines and people — empty streets read as boring.",
    ],
  },
  {
    id: "night-market", name: "Night Market", emoji: "🌃", group: "travel",
    motion: "slow", slowMoValue: 0, night: true, wide: true,
    defaultLight: "night", defaultMount: "handheld",
    mistakes: [
      "Don't use unnecessarily high FPS at night — it starves the sensor of light.",
      "Avoid an extremely high ISO ceiling; embrace some shadows.",
      "Walk slowly — it improves both stabilization and low-light image quality.",
    ],
  },
  {
    id: "restaurant", name: "Restaurant / Food", emoji: "🍜", group: "travel",
    motion: "stationary", slowMoValue: 0, tight: true,
    defaultLight: "indoor-dim", defaultMount: "handheld",
    mistakes: [
      "Sit near a window if you can — daylight beats restaurant lighting every time.",
      "Get close-ups of texture and steam within the first minute while food is fresh.",
    ],
  },
  {
    id: "airport", name: "Airport", emoji: "✈️", group: "travel",
    motion: "slow", slowMoValue: 0,
    defaultLight: "indoor-bright", defaultMount: "handheld",
    mistakes: [
      "Window seats: put the lens right against the glass to kill reflections.",
    ],
  },
  {
    id: "road-trip", name: "Road Trip", emoji: "🚗", group: "travel",
    motion: "fast", slowMoValue: 0, wide: true,
    defaultLight: "bright-sun", defaultMount: "vehicle",
    mistakes: [
      "Clean the windshield before suction-mounting behind it.",
      "Timelapse long boring stretches instead of recording them in real time.",
    ],
  },
  {
    id: "hotel", name: "Hotel", emoji: "🏨", group: "travel",
    motion: "slow", slowMoValue: 0, tight: true, cinematicBias: true,
    defaultLight: "indoor-bright", defaultMount: "handheld",
    mistakes: [
      "Open every curtain first — hotel rooms film far better in daylight.",
      "Slow reveal movements (door push, slider-style walk-ins) sell the space.",
    ],
  },
  {
    id: "theme-park", name: "Theme Park", emoji: "🎡", group: "travel",
    motion: "fast", slowMoValue: 2, wide: true,
    defaultLight: "bright-sun", defaultMount: "handheld",
    mistakes: [
      "Check ride camera policies — many require a secured strap or ban cameras entirely.",
      "Pre-Record catches reactions you can't predict.",
    ],
  },
  {
    id: "architecture", name: "Architecture", emoji: "🏛", group: "travel",
    motion: "stationary", slowMoValue: 0, tight: true, cinematicBias: true,
    defaultLight: "partly-cloudy", defaultMount: "handheld",
    mistakes: [
      "Use a low-distortion (linear) view — bent buildings look amateur.",
      "Keep vertical lines vertical; tilt the whole camera, not just up.",
    ],
  },

  // ---------- PEOPLE ----------
  {
    id: "talking-head", name: "Talking to Camera", emoji: "👤", group: "people",
    motion: "stationary", slowMoValue: 0, talking: true, tight: true, cinematicBias: true,
    defaultLight: "indoor-bright", defaultMount: "tripod",
    mistakes: [
      "Audio matters more than video — get the mic close.",
      "Face a window; never sit with a bright window behind you.",
      "Lens at eye level. Looking down at a camera flatters nobody.",
    ],
  },
  {
    id: "interview", name: "Interview", emoji: "🎙", group: "people",
    motion: "stationary", slowMoValue: 0, talking: true, tight: true, cinematicBias: true,
    defaultLight: "indoor-bright", defaultMount: "tripod",
    mistakes: [
      "Record a backup audio track if you possibly can.",
      "Frame with looking room — subject's eyes about a third from the top.",
    ],
  },
  {
    id: "family", name: "Family", emoji: "👨‍👩‍👧", group: "people",
    motion: "moderate", slowMoValue: 1, wide: true,
    defaultLight: "partly-cloudy", defaultMount: "handheld",
    mistakes: [
      "Capture moments, not poses — keep rolling a few seconds after everyone 'finishes'.",
    ],
  },
  {
    id: "kids", name: "Kids", emoji: "👶", group: "people",
    motion: "fast", slowMoValue: 3, wide: true,
    defaultLight: "partly-cloudy", defaultMount: "handheld",
    mistakes: [
      "Get down to their eye level — adult-height footage feels detached.",
      "Kids don't repeat moments; Pre-Record or just keep rolling.",
    ],
  },
  {
    id: "pets", name: "Pets", emoji: "🐕", group: "people",
    motion: "fast", slowMoValue: 3, wide: true,
    defaultLight: "partly-cloudy", defaultMount: "handheld",
    mistakes: [
      "Shoot from their eye level, even if it means lying on the ground.",
      "Slow motion makes ordinary pet movement look spectacular.",
    ],
  },
  {
    id: "wedding", name: "Wedding", emoji: "💍", group: "people",
    motion: "slow", slowMoValue: 2, cinematicBias: true, talking: true,
    defaultLight: "mixed", defaultMount: "tripod",
    mistakes: [
      "Never rely on one battery or one card for a wedding.",
      "Test audio during the rehearsal — vows only happen once.",
    ],
  },
  {
    id: "party", name: "Party", emoji: "🎉", group: "people",
    motion: "moderate", slowMoValue: 2, wide: true,
    defaultLight: "indoor-dim", defaultMount: "handheld",
    mistakes: [
      "Embrace the ambient light; blasting a video light kills the vibe.",
    ],
  },
  {
    id: "event", name: "Event", emoji: "🎤", group: "people",
    motion: "moderate", slowMoValue: 1,
    defaultLight: "indoor-dim", defaultMount: "handheld",
    mistakes: [
      "Stage lighting swings wildly — lock exposure on the performer, not the room.",
    ],
  },

  // ---------- CREATOR ----------
  {
    id: "tiktok", name: "TikTok", emoji: "📱", group: "creator",
    motion: "moderate", slowMoValue: 1, vertical: true, talking: true,
    defaultLight: "indoor-bright", defaultMount: "tripod",
    mistakes: [
      "Shoot vertical from the start — cropping landscape later throws away most of your pixels.",
      "Hook in the first second; frame tight on the subject.",
    ],
  },
  {
    id: "instagram-reel", name: "Instagram Reel", emoji: "📸", group: "creator",
    motion: "moderate", slowMoValue: 1, vertical: true,
    defaultLight: "indoor-bright", defaultMount: "handheld",
    mistakes: [
      "Shoot vertical natively; keep key action center-frame for the feed crop.",
    ],
  },
  {
    id: "youtube", name: "YouTube", emoji: "▶️", group: "creator",
    motion: "slow", slowMoValue: 1, talking: true,
    defaultLight: "indoor-bright", defaultMount: "tripod",
    mistakes: [
      "Consistent audio beats pretty video for watch time — mic first.",
    ],
  },
  {
    id: "vlog", name: "Vlog", emoji: "🎥", group: "creator",
    motion: "slow", slowMoValue: 0, talking: true, wide: true,
    defaultLight: "partly-cloudy", defaultMount: "selfie",
    mistakes: [
      "Hold the camera slightly above eye level, arm relaxed.",
      "Talk in short takes — long rambles are painful to edit.",
    ],
  },
  {
    id: "cinematic", name: "Cinematic B-Roll", emoji: "🎞", group: "creator",
    motion: "slow", slowMoValue: 2, cinematicBias: true, tight: true,
    defaultLight: "golden-hour", defaultMount: "gimbal",
    mistakes: [
      "One slow deliberate move per shot — in, out, across. Never wander.",
      "Follow the 180° shutter rule; that's most of the 'cinematic' look.",
      "Shoot 3–5 second usable moments; quantity of angles beats length.",
    ],
  },
  {
    id: "product", name: "Product Video", emoji: "🛍", group: "creator",
    motion: "stationary", slowMoValue: 1, tight: true, cinematicBias: true,
    defaultLight: "indoor-bright", defaultMount: "tripod",
    mistakes: [
      "Wipe fingerprints — macro shots show everything.",
      "Move the product or the light, not just the camera.",
    ],
  },
  {
    id: "food-video", name: "Food Video", emoji: "🍔", group: "creator",
    motion: "stationary", slowMoValue: 2, tight: true, cinematicBias: true,
    defaultLight: "indoor-bright", defaultMount: "tripod",
    mistakes: [
      "Side or back light makes food glisten; front light makes it flat.",
      "Capture steam, pours and pulls in slow motion.",
    ],
  },
  {
    id: "streaming", name: "Streaming", emoji: "🎮", group: "creator",
    motion: "stationary", slowMoValue: 0, talking: true, tight: true,
    defaultLight: "indoor-dim", defaultMount: "tripod",
    mistakes: [
      "Match camera frame rate to your stream output (usually 30 or 60).",
      "Light your face separately from your screen glow.",
    ],
  },
  {
    id: "podcast", name: "Podcast", emoji: "🎙", group: "creator",
    motion: "stationary", slowMoValue: 0, talking: true, tight: true, cinematicBias: true,
    defaultLight: "indoor-bright", defaultMount: "tripod",
    mistakes: [
      "24 or 25 FPS is fine — podcasts don't need smooth motion, they need clean audio.",
      "Frame consistent angles per speaker and never touch them mid-episode.",
    ],
  },

  // ---------- SPECIAL SHOTS ----------
  {
    id: "slowmo", name: "Slow Motion", emoji: "🐌", group: "special",
    motion: "fast", slowMoValue: 3,
    defaultLight: "bright-sun", defaultMount: "handheld",
    mistakes: [
      "High frame rates need lots of light — slow motion in dim rooms gets grainy fast.",
      "Not everything deserves slow motion; save it for genuine peaks of action.",
    ],
  },
  {
    id: "timelapse", name: "Timelapse", emoji: "⏱", group: "special",
    motion: "stationary", slowMoValue: 0, timelapse: "timelapse",
    defaultLight: "golden-hour", defaultMount: "tripod",
    mistakes: [
      "The camera cannot move at all — a rock-solid mount is the whole game.",
      "Shoot longer than feels necessary; 30 real minutes is only ~10 seconds of video.",
    ],
  },
  {
    id: "hyperlapse", name: "Hyperlapse", emoji: "⚡", group: "special",
    motion: "slow", slowMoValue: 0, timelapse: "hyperlapse", wide: true,
    defaultLight: "partly-cloudy", defaultMount: "handheld",
    mistakes: [
      "Pick a fixed target (building, statue) and keep it center-frame every step.",
      "Small consistent steps beat big strides.",
    ],
  },
  {
    id: "night", name: "Night", emoji: "🌌", group: "special",
    motion: "slow", slowMoValue: 0, night: true,
    defaultLight: "night", defaultMount: "handheld",
    mistakes: [
      "Drop to 24/30 FPS — high FPS starves the sensor at night.",
      "Skip the ND filter after dark.",
      "Move slower than feels natural; night footage exaggerates every shake.",
    ],
  },
  {
    id: "city-lights", name: "Starburst / City Lights", emoji: "✨", group: "special",
    motion: "stationary", slowMoValue: 0, night: true, cinematicBias: true,
    defaultLight: "night", defaultMount: "tripod",
    mistakes: [
      "A tripod transforms night city shots — even a mini one on a railing.",
    ],
  },
  {
    id: "underwater", name: "Underwater", emoji: "💦", group: "special",
    motion: "moderate", slowMoValue: 2, water: true, underwater: true, wide: true,
    defaultLight: "bright-sun", defaultMount: "handheld",
    mistakes: [
      "Check your camera's depth rating before submerging — housings exist for a reason.",
      "Water eats red light — expect blue/green footage; a red filter or color grade fixes it.",
      "Get close: water clarity drops fast with distance.",
    ],
  },
  {
    id: "fake-drone", name: "Fake Drone / 360", emoji: "🚁", group: "special",
    motion: "moderate", slowMoValue: 0, wide: true,
    defaultLight: "bright-sun", defaultMount: "stick-360",
    mistakes: [
      "Extend the stick fully and keep it out of your walking line.",
      "Smooth, slow arcs sell the drone illusion; fast swings break it.",
    ],
  },
  {
    id: "cinematic-shot", name: "Cinematic Shot", emoji: "🎬", group: "special",
    motion: "slow", slowMoValue: 1, cinematicBias: true, tight: true,
    defaultLight: "golden-hour", defaultMount: "gimbal",
    mistakes: [
      "One motivated camera move per shot.",
      "Respect the 180° shutter rule for natural motion blur.",
    ],
  },
  {
    id: "tracking-shot", name: "Tracking Shot", emoji: "🏃", group: "special",
    motion: "fast", slowMoValue: 1, wide: true,
    defaultLight: "partly-cloudy", defaultMount: "gimbal",
    mistakes: [
      "Match your subject's speed; the gap between you should stay constant.",
      "Pre-walk the path once to find trip hazards.",
    ],
  },
  {
    id: "photo", name: "Thumbnail / Photo", emoji: "📸", group: "special",
    motion: "stationary", slowMoValue: 0, photo: true,
    defaultLight: "bright-sun", defaultMount: "handheld",
    mistakes: [
      "Shoot RAW or highest-quality JPEG if thumbnails matter to you.",
      "Take 10x more frames than you need — expressions change every split second.",
    ],
  },
];

export const sceneGroups: { id: SceneDef["group"]; name: string }[] = [
  { id: "outdoors", name: "Outdoors" },
  { id: "action", name: "Action" },
  { id: "travel", name: "Travel" },
  { id: "people", name: "People" },
  { id: "creator", name: "Creator" },
  { id: "special", name: "Special Shots" },
];

export function getScene(id: string): SceneDef | undefined {
  return scenes.find((s) => s.id === id);
}
