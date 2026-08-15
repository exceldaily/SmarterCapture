"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Aperture,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bookmark,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock3,
  CloudSun,
  Compass,
  Film,
  Focus,
  Gauge,
  Heart,
  HelpCircle,
  Home,
  Layers3,
  Lightbulb,
  Mic2,
  Moon,
  Package,
  Play,
  Plus,
  Search,
  Settings2,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Sun,
  Video,
  X,
  Zap,
} from "lucide-react";
import { recommend, whatIfAnswer, whatIfOptions } from "@/lib/camcue/engine";
import { CameraArt } from "./camera-art";
import { brand } from "@/lib/camcue/brand";
import { cameraBrands, cameras, categoryLabels, categoryOrder, getCamera } from "@/lib/camcue/data/cameras";
import { recipes, type Recipe } from "@/lib/camcue/data/recipes";
import { getScene, sceneGroups, scenes } from "@/lib/camcue/data/scenes";
import {
  accessoryOptions,
  audioPrefOptions,
  editingOptions,
  lightOptions,
  mountOptions,
  movementOptions,
  platformOptions,
  priorityOptions,
  tweakOptions,
} from "@/lib/camcue/data/options";
import type {
  AccessoryId,
  AudioPrefId,
  EditingId,
  LightId,
  MountId,
  MovementId,
  PlatformId,
  PriorityId,
  Scenario,
  SceneDef,
  SettingLine,
  TweakId,
} from "@/lib/camcue/types";

type View = "home" | "flow" | "result" | "recipes" | "bag" | "learn";

interface SavedSetup {
  id: string;
  name: string;
  scenario: Scenario;
  savedAt: string;
}

const DEFAULT_CAMERA = "dji-osmo-action-6";
const POPULAR_SCENES = ["fishing", "walking-tour", "night", "motorcycle", "talking-head", "cinematic"];

const learnCards = [
  { title: "24 vs 30 vs 60 vs 120 FPS", time: "45 sec", icon: Film, text: "24 feels cinematic. 30 is the safe all-rounder. 60 keeps action smooth. 120 is for deliberate slow motion—and needs lots of light." },
  { title: "What ISO actually does", time: "30 sec", icon: Sun, text: "ISO brightens the image after light hits the sensor. Higher ISO helps in the dark, but adds grain. Keep the ceiling as low as the scene allows." },
  { title: "Stabilization, simply", time: "40 sec", icon: Focus, text: "Stronger stabilization smooths more shake but usually crops the picture. Use the lightest mode that makes your shot watchable." },
  { title: "Should I shoot Log?", time: "35 sec", icon: Layers3, text: "Log looks flat on purpose and needs color grading. If you want footage ready to share, Normal is almost always the better choice." },
  { title: "When an ND filter matters", time: "45 sec", icon: Aperture, text: "An ND is sunglasses for your lens. It lets you keep natural motion blur in bright sun. Skip it at night or when shutter is set to Auto." },
  { title: "Why night footage gets grainy", time: "50 sec", icon: Moon, text: "Small cameras need more time or more electronic gain in the dark. Lower FPS, move slowly and keep the camera stable for the biggest improvement." },
];

function fuzzyMatch(text: string, query: string) {
  const haystack = text.toLowerCase().replace(/[^a-z0-9]/g, "");
  const needle = query.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!needle) return true;
  if (haystack.includes(needle)) return true;
  let cursor = 0;
  for (const char of haystack) if (char === needle[cursor]) cursor += 1;
  return cursor === needle.length;
}

function settingIcon(key: string) {
  const props = { size: 17, strokeWidth: 2 };
  if (key === "fps") return <Gauge {...props} />;
  if (key === "resolution") return <Video {...props} />;
  if (key === "stabilization") return <Focus {...props} />;
  if (key === "audio") return <Mic2 {...props} />;
  if (key === "orientation") return <Layers3 {...props} />;
  if (key === "shutter") return <Aperture {...props} />;
  if (key === "iso") return <Sun {...props} />;
  if (key === "preRecord") return <Clock3 {...props} />;
  return <SlidersHorizontal {...props} />;
}

function confidenceCopy(confidence: "optimal" | "tradeoffs" | "challenging") {
  if (confidence === "optimal") return "Great match";
  if (confidence === "tradeoffs") return "Best compromise";
  return "Challenging conditions";
}

/**
 * A scene's shooting characteristics as a short technical readout, in the
 * spirit of film edge-markings or an EXIF strip. Every token is derived from
 * the scene's real DNA rather than being decorative filler.
 */
function sceneTechLine(scene: SceneDef): string[] {
  const motion: Record<string, string> = {
    stationary: "STATIC", slow: "SLOW", moderate: "MODERATE", fast: "FAST", extreme: "RAPID",
  };
  const tokens: string[] = [motion[scene.motion] ?? "MODERATE"];
  if (scene.cinematicBias) tokens.push("24P");
  else if (scene.motion === "fast" || scene.motion === "extreme") tokens.push("60P");
  if (scene.slowMoValue >= 3) tokens.push("SLO-MO");
  if (scene.night) tokens.push("LOW LIGHT");
  if (scene.wide) tokens.push("WIDE");
  if (scene.tight) tokens.push("LINEAR");
  if (scene.water) tokens.push("WATER");
  if (scene.talking) tokens.push("AUDIO");
  return tokens.slice(0, 3);
}

function CamMark() {
  return (
    <span className="cam-mark" aria-hidden="true">
      <span className="cam-mark-dot" />
    </span>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <button className="brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label={`${brand.name} home`}>
      <CamMark />
      <span>{brand.wordmark}</span>
      {!compact && <small>SHOT SETTINGS</small>}
    </button>
  );
}

/**
 * Reveals its children once scrolled into view.
 *
 * The visible state lives in React rather than being toggled with classList:
 * React owns `className` on these elements, so an imperative class would be
 * wiped by the next re-render and the section would stay invisible forever.
 */
function Reveal({
  as: Tag = "section",
  className = "",
  children,
}: {
  as?: "section" | "div";
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || shown) return;
    // typeof rather than `in window`: the `in` check narrows window to never.
    if (typeof IntersectionObserver === "undefined") {
      // No observer support: show it rather than leaving content hidden.
      const id = setTimeout(() => setShown(true), 0);
      return () => clearTimeout(id);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 },
    );
    observer.observe(node);

    // Safety net: the observer only delivers while the page is actually
    // rendering, so a tab that loads hidden (or any future regression here)
    // could otherwise leave a whole section stuck at opacity 0. Content
    // visibility must never depend on an animation firing.
    const failsafe = setTimeout(() => setShown(true), 1600);

    return () => {
      observer.disconnect();
      clearTimeout(failsafe);
    };
  }, [shown]);

  return (
    <Tag ref={ref as React.Ref<HTMLElement & HTMLDivElement>} className={`${className} reveal${shown ? " shown" : ""}`}>
      {children}
    </Tag>
  );
}

function SettingTile({ line, detail = false }: { line: SettingLine; detail?: boolean }) {
  if (detail) {
    return (
      <details className="pro-line">
        <summary>
          <span className="setting-glyph">{settingIcon(line.key)}</span>
          <span>{line.label}</span>
          <strong>{line.value}</strong>
          <ChevronDown size={16} />
        </summary>
        {line.why && <p>{line.why}</p>}
      </details>
    );
  }
  return (
    <div className="setting-tile">
      <div className="setting-label"><span className="setting-glyph">{settingIcon(line.key)}</span>{line.label}</div>
      <strong>{line.value}</strong>
    </div>
  );
}

export default function CamCueApp() {
  const [view, setView] = useState<View>("home");
  const [step, setStep] = useState(1);
  const [cameraId, setCameraId] = useState(DEFAULT_CAMERA);
  const [sceneId, setSceneId] = useState("fishing");
  const [light, setLight] = useState<LightId>("bright-sun");
  const [movement, setMovement] = useState<MovementId>("fast");
  const [mount, setMount] = useState<MountId>("chest");
  const [platform, setPlatform] = useState<PlatformId>("youtube");
  const [editing, setEditing] = useState<EditingId>("none");
  const [priority, setPriority] = useState<PriorityId>("balanced");
  const [audioPref, setAudioPref] = useState<AudioPrefId>("camera");
  const [accessories, setAccessories] = useState<AccessoryId[]>([]);
  const [tweaks, setTweaks] = useState<TweakId[]>([]);
  const [cameraQuery, setCameraQuery] = useState("");
  const [cameraFilter, setCameraFilter] = useState<string>("all");
  const [sceneQuery, setSceneQuery] = useState("");
  const [sceneGroup, setSceneGroup] = useState("outdoors");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPro, setShowPro] = useState(false);
  const [naturalText, setNaturalText] = useState("");
  const [whatIf, setWhatIf] = useState("");
  const [bag, setBag] = useState<string[]>([DEFAULT_CAMERA]);
  const [saved, setSaved] = useState<SavedSetup[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const storedBag = JSON.parse(localStorage.getItem("camcue-bag") ?? "null") as string[] | null;
        const storedSaved = JSON.parse(localStorage.getItem("camcue-saved") ?? "null") as SavedSetup[] | null;
        const lastCamera = localStorage.getItem("camcue-last-camera");
        if (storedBag?.length) setBag(storedBag);
        if (storedSaved?.length) setSaved(storedSaved);
        if (lastCamera && getCamera(lastCamera)) setCameraId(lastCamera);
      } catch {
        // A blocked or malformed local store should never stop a recommendation.
      }
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("camcue-bag", JSON.stringify(bag));
    localStorage.setItem("camcue-saved", JSON.stringify(saved));
    localStorage.setItem("camcue-last-camera", cameraId);
  }, [bag, saved, cameraId, hydrated]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);


  const camera = getCamera(cameraId) ?? cameras[0];
  const scene = getScene(sceneId) ?? scenes[0];
  const scenario: Scenario = useMemo(() => ({
    cameraId,
    sceneId,
    light,
    movement,
    mount,
    platform,
    editing,
    priority,
    audioPref,
    accessories,
    tweaks,
  }), [cameraId, sceneId, light, movement, mount, platform, editing, priority, audioPref, accessories, tweaks]);
  const result = useMemo(() => recommend(camera, scene, scenario), [camera, scene, scenario]);
  const whatIfChoices = useMemo(() => whatIfOptions(camera, result), [camera, result]);

  const filteredCameras = useMemo(() => cameras.filter((item) => {
    if (!fuzzyMatch(`${item.manufacturer} ${item.model} ${item.category}`, cameraQuery)) return false;
    if (cameraQuery || cameraFilter === "all") return true;
    if (cameraFilter.startsWith("brand:")) return item.manufacturer === cameraFilter.slice(6);
    return item.category === cameraFilter;
  }), [cameraQuery, cameraFilter]);

  const filteredScenes = useMemo(() => scenes.filter((item) => {
    if (sceneQuery) return fuzzyMatch(`${item.name} ${item.group}`, sceneQuery);
    return item.group === sceneGroup;
  }), [sceneQuery, sceneGroup]);

  const startFlow = (targetStep = 1) => {
    setStep(targetStep);
    setView("flow");
    setShowPro(false);
    setWhatIf("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const chooseScene = (id: string) => {
    const next = getScene(id);
    if (!next) return;
    setSceneId(id);
    setLight(next.defaultLight ?? "partly-cloudy");
    setMount(next.defaultMount ?? "handheld");
    setMovement(next.motion);
  };

  const finish = () => {
    setTweaks([]);
    setWhatIf("");
    setShowPro(false);
    setView("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const loadRecipe = (recipe: Recipe) => {
    setCameraId(recipe.cameraId);
    setSceneId(recipe.scenario.sceneId);
    setLight(recipe.scenario.light);
    setMount(recipe.scenario.mount);
    setMovement(recipe.scenario.movement ?? getScene(recipe.scenario.sceneId)?.motion ?? "moderate");
    setPlatform(recipe.scenario.platform ?? "personal");
    setEditing(recipe.scenario.editing ?? "none");
    setPriority(recipe.scenario.priority ?? "balanced");
    setAudioPref(recipe.scenario.audioPref ?? "camera");
    setAccessories(recipe.scenario.accessories ?? []);
    setTweaks(recipe.scenario.tweaks ?? []);
    setView("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const parseNatural = () => {
    const text = naturalText.toLowerCase().trim();
    if (!text) return;
    const detectedCamera = cameras.find((item) => {
      const model = item.model.toLowerCase();
      return text.includes(model) || model.split(" ").filter((word) => word.length > 3).every((word) => text.includes(word));
    });
    const sceneKeywords: [string[], string][] = [
      [["fish", "fishing", "angler"], "fishing"], [["night market", "market"], "night-market"],
      [["motorcycle", "motorbike", "helmet"], "motorcycle"], [["boat", "boating", "marina"], "boating"],
      [["hike", "hiking", "trail"], "hiking"], [["talking", "talking head", "to camera"], "talking-head"],
      [["food", "restaurant", "meal"], "food-video"], [["sunset"], "sunset"], [["underwater", "dive"], "underwater"],
      [["bike", "cycling", "bicycle"], "cycling"], [["vlog", "vlogging"], "vlog"], [["cinematic", "b-roll", "broll"], "cinematic"],
      [["family", "kids"], "family"], [["travel", "walking tour", "city walk"], "walking-tour"],
    ];
    const detectedSceneId = sceneKeywords.find(([words]) => words.some((word) => text.includes(word)))?.[1] ?? "vlog";
    const detectedScene = getScene(detectedSceneId) ?? scenes[0];
    const detectedLight: LightId = /very dark|pitch black/.test(text) ? "very-dark" : /night|dark|evening/.test(text) ? "night" : /sunny|bright sun|midday/.test(text) ? "bright-sun" : /indoor|inside/.test(text) ? "indoor-bright" : /sunset|golden/.test(text) ? "golden-hour" : detectedScene.defaultLight ?? "partly-cloudy";
    const detectedMount: MountId = text.includes("chest") ? "chest" : text.includes("helmet") ? "helmet" : text.includes("tripod") ? "tripod" : text.includes("boat mount") ? "boat" : text.includes("selfie") ? "selfie" : detectedScene.defaultMount ?? "handheld";
    const detectedPlatform: PlatformId = text.includes("tiktok") ? "tiktok" : text.includes("reel") ? "instagram-reels" : text.includes("shorts") ? "youtube-shorts" : text.includes("youtube") ? "youtube" : "personal";
    if (detectedCamera) setCameraId(detectedCamera.id);
    setSceneId(detectedScene.id);
    setLight(detectedLight);
    setMount(detectedMount);
    setMovement(detectedScene.motion);
    setPlatform(detectedPlatform);
    setEditing(/grade|color grade|professional/.test(text) ? "grade" : "none");
    setPriority(text.includes("slow motion") ? "slowmo" : text.includes("low light") ? "lowlight" : "balanced");
    setView("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleBag = (id: string) => {
    setBag((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setToast(bag.includes(id) ? "Removed from Camera Bag" : "Added to Camera Bag");
  };

  const toggleAccessory = (id: AccessoryId) => {
    setAccessories((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current.filter((item) => item !== "nothing"), id]);
  };

  const toggleTweak = (id: TweakId) => {
    setTweaks((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setWhatIf("");
  };

  const saveSetup = () => {
    const entry: SavedSetup = {
      id: `${Date.now()}`,
      name: `${camera.model} — ${scene.name}`,
      scenario,
      savedAt: new Date().toISOString(),
    };
    setSaved((current) => [entry, ...current].slice(0, 12));
    if (!bag.includes(camera.id)) setBag((current) => [...current, camera.id]);
    setToast("Setup saved for offline access");
  };

  const loadSaved = (item: SavedSetup) => {
    setCameraId(item.scenario.cameraId);
    setSceneId(item.scenario.sceneId);
    setLight(item.scenario.light);
    setMovement(item.scenario.movement ?? "moderate");
    setMount(item.scenario.mount);
    setPlatform(item.scenario.platform ?? "personal");
    setEditing(item.scenario.editing ?? "none");
    setPriority(item.scenario.priority ?? "balanced");
    setAudioPref(item.scenario.audioPref ?? "camera");
    setAccessories(item.scenario.accessories ?? []);
    setTweaks(item.scenario.tweaks ?? []);
    setView("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const shareSetup = async () => {
    const headline = `${scene.name} · ${camera.manufacturer} ${camera.model}`;
    const body = result.settings.slice(0, 7).map((line) => `${line.label}: ${line.value}`).join("\n");
    const shareText = `CAMCUE RECIPE\n${headline}\n\n${body}`;
    try {
      const useNativeShare = "share" in navigator;
      if (useNativeShare) await navigator.share({ title: `${scene.name} ${brand.name} Recipe`, text: shareText });
      else await navigator.clipboard.writeText(shareText);
      setToast(useNativeShare ? "Share sheet opened" : "Settings copied");
    } catch {
      // The native share sheet being dismissed is not an error for the user.
    }
  };

  const navTo = (next: View) => {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app-shell">
      {toast && <div className="toast"><Check size={16} />{toast}</div>}

      <header className="site-header">
        <Brand />
        <nav className="desktop-nav" aria-label="Main navigation">
          <button className={view === "home" ? "active" : ""} onClick={() => navTo("home")}>Home</button>
          <button className={view === "recipes" ? "active" : ""} onClick={() => navTo("recipes")}>Recipes</button>
          <button className={view === "learn" ? "active" : ""} onClick={() => navTo("learn")}>Learn</button>
        </nav>
        <button className="bag-button" onClick={() => navTo("bag")}><Camera size={17} /><span>My Camera Bag</span><b>{bag.length}</b></button>
      </header>

      <main>
        {view === "home" && (
          <div className="home-view page-width">
            <section className="hero">
              <div className="hero-copy">
                <div className="eyebrow"><span className="rec-dot" /> {cameras.length} CAMERAS · CAPABILITY CHECKED</div>
                <h1>Know exactly<br />how to <em>shoot it.</em></h1>
                <p>Tell {brand.name} what you&apos;re filming. You get the resolution, frame rate, stabilization and everything else — checked against the exact camera in your hand.</p>
                <div className="hero-actions">
                  <button className="primary-button" onClick={() => startFlow(1)}>Choose a camera <ArrowRight size={19} /></button>
                  <button className="secondary-button" onClick={() => navTo("bag")}><Camera size={18} /> My camera bag</button>
                </div>
                <div className="trust-row">
                  <span><ShieldCheck size={15} /> Compatibility checked</span>
                  <span><Zap size={15} /> Instant results</span>
                  <span><CircleCheck size={15} /> No login needed</span>
                </div>
              </div>
              <div className="hero-device" aria-label={`Example ${brand.name} recommendation`}>
                <div className="device-top"><span><span className="rec-dot" /> RECOMMENDED SETUP</span><span>4K · 60</span></div>
                <div className="device-hero-art"><CameraArt category="action" /></div>
                <div className="device-scene">
                  <span className="scene-code">OF</span>
                  <div><small>OFFSHORE FISHING</small><strong>Action 6</strong></div>
                  <BadgeCheck className="verified-icon" size={21} />
                </div>
                <div className="device-settings">
                  <div><small>RESOLUTION</small><b>4K</b></div>
                  <div><small>FRAME RATE</small><b>60 <i>FPS</i></b></div>
                  <div><small>STABILIZATION</small><b>RockSteady</b></div>
                  <div><small>FIELD OF VIEW</small><b>Natural Wide</b></div>
                </div>
                <div className="device-tip"><Lightbulb size={17} /><span><small>DON&apos;T FORGET</small>Turn on Pre-Record before the first cast.</span></div>
              </div>
            </section>

            <Reveal as="div" className="brand-strip">
              <small>Independent capability research covering</small>
              {cameraBrands.map((name) => <b key={name}>{name}</b>)}
              <em>Not affiliated with or endorsed by any manufacturer</em>
            </Reveal>

            <Reveal className="natural-box">
              <div className="natural-heading"><SlidersHorizontal size={20} /><div><strong>Describe the shot</strong><span>Use a sentence instead of the selectors.</span></div></div>
              <div className="natural-input">
                <input value={naturalText} onChange={(event) => setNaturalText(event.target.value)} onKeyDown={(event) => event.key === "Enter" && parseNatural()} placeholder="Fishing from a boat tomorrow. Sunny, chest mount, for YouTube…" aria-label="Describe what you are shooting" />
                <button onClick={parseNatural} disabled={!naturalText.trim()} aria-label="Build recommendation"><ArrowRight size={20} /></button>
              </div>
              <small>{brand.name} reads the details and applies the same compatibility rules.</small>
            </Reveal>

            <Reveal className="home-section">
              <div className="section-heading"><div><span>COMMON SCENES</span><h2>Start with the shot</h2></div><button onClick={() => startFlow(2)}>View all scenes <ArrowRight size={16} /></button></div>
              <div className="popular-grid">
                {POPULAR_SCENES.map((id, index) => {
                  const item = getScene(id);
                  if (!item) return null;
                  return (
                    <button
                      key={id}
                      className={`popular-card tone-${item.group}`}
                      onClick={() => { chooseScene(id); startFlow(3); }}
                    >
                      <span className="frame-perf" aria-hidden="true" />
                      <span className="scene-index">{String(index + 1).padStart(2, "0")}<i>A</i></span>
                      <span className="frame-edge" aria-hidden="true">{item.group.toUpperCase()}</span>
                      <strong>{item.name}</strong>
                      <span className="scene-tech">
                        {sceneTechLine(item).map((token) => <em key={token}>{token}</em>)}
                      </span>
                      <small>Open setup <ChevronRight size={13} /></small>
                      <span className="frame-perf bottom" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            </Reveal>

            <Reveal className="how-band">
              <div className="how-inner">
                <div className="how-copy">
                  <span>HOW IT WORKS</span>
                  <h2>Three taps.<br />Then start recording.</h2>
                  <p>No manual. No 14-minute video. {brand.name} works out the ideal way to shoot your scene, then fits it to what your camera can actually do.</p>
                </div>
                <ol className="how-steps">
                  <li><i>01</i><strong>Pick your camera</strong><small>{cameras.length} capability profiles, from action cameras to cinema bodies.</small></li>
                  <li><i>02</i><strong>Pick the shot</strong><small>{scenes.length} scenes, each with its own shooting strategy.</small></li>
                  <li><i>03</i><strong>Set the conditions</strong><small>Light, movement and how the camera is mounted.</small></li>
                </ol>
              </div>
              <div className="how-stats">
                <div><b>{cameras.length}</b><small>Cameras</small></div>
                <div><b>{scenes.length}</b><small>Scenes</small></div>
                <div><b>{recipes.length}</b><small>Recipes</small></div>
                <div><b>0</b><small>Impossible settings</small></div>
              </div>
            </Reveal>

            {saved.length > 0 && (
              <Reveal className="home-section">
                <div className="section-heading"><div><span>RECENT</span><h2>Use a saved setup</h2></div><button onClick={() => navTo("bag")}>All saved setups <ArrowRight size={16} /></button></div>
                <div className="shoot-again">
                  <div className="shoot-again-icon"><Camera size={22} /></div>
                  <div><small>LAST SAVED SETUP</small><strong>{saved[0].name}</strong><span>{lightOptions.find((item) => item.id === saved[0].scenario.light)?.name} · {platformOptions.find((item) => item.id === saved[0].scenario.platform)?.name ?? "Personal"}</span></div>
                  <button onClick={() => loadSaved(saved[0])}>Load <Play size={15} fill="currentColor" /></button>
                </div>
              </Reveal>
            )}
          </div>
        )}

        {view === "flow" && (
          <div className="flow-view page-width-narrow">
            <div className="flow-topbar">
              <button className="icon-button" onClick={() => step === 1 ? navTo("home") : setStep(step - 1)} aria-label="Go back"><ArrowLeft size={20} /></button>
              <div className="progress-copy"><span>STEP {step} OF 3</span><strong>{step === 1 ? "Your camera" : step === 2 ? "Your scene" : "Your conditions"}</strong></div>
              <div className="progress-track"><i style={{ width: `${step * 33.333}%` }} /></div>
            </div>

            {step === 1 && (
              <section className="flow-panel">
                <div className="flow-heading"><span className="step-icon"><Camera size={23} /></span><div><h1>Which camera are you using?</h1><p>We&apos;ll only show settings your exact camera supports.</p></div></div>
                <label className="search-field"><Search size={18} /><input autoFocus value={cameraQuery} onChange={(event) => setCameraQuery(event.target.value)} placeholder="Search cameras, e.g. osmo or hero…" /><kbd>⌘ K</kbd></label>
                {bag.length > 0 && !cameraQuery && (
                  <div className="picker-block"><div className="picker-label"><Camera size={14} /> MY CAMERA BAG</div><div className="camera-grid compact-grid">{bag.map((id) => getCamera(id)).filter(Boolean).map((item) => item && <CameraCard key={item.id} item={item} selected={cameraId === item.id} inBag onChoose={() => setCameraId(item.id)} onBag={() => toggleBag(item.id)} />)}</div></div>
                )}
                {!cameraQuery && (
                  <div className="filter-rail" role="tablist" aria-label="Filter cameras">
                    <button className={cameraFilter === "all" ? "active" : ""} onClick={() => setCameraFilter("all")}>All <b>{cameras.length}</b></button>
                    {categoryOrder.filter((key) => cameras.some((item) => item.category === key)).map((key) => (
                      <button key={key} className={cameraFilter === key ? "active" : ""} onClick={() => setCameraFilter(key)}>{categoryLabels[key]}</button>
                    ))}
                    <span className="filter-divider" aria-hidden="true" />
                    {cameraBrands.map((name) => (
                      <button key={name} className={cameraFilter === `brand:${name}` ? "active" : ""} onClick={() => setCameraFilter(`brand:${name}`)}>{name}</button>
                    ))}
                  </div>
                )}
                <div className="picker-block"><div className="picker-label"><Search size={14} /> {cameraQuery ? `${filteredCameras.length} MATCHES` : `${filteredCameras.length} CAMERAS`}</div><div className="camera-grid">{filteredCameras.map((item) => <CameraCard key={item.id} item={item} selected={cameraId === item.id} inBag={bag.includes(item.id)} onChoose={() => setCameraId(item.id)} onBag={() => toggleBag(item.id)} />)}</div>{filteredCameras.length === 0 && <p className="no-results">No camera matches that. Try a model name like &ldquo;a7&rdquo;, &ldquo;osmo&rdquo; or &ldquo;hero&rdquo;.</p>}</div>
                <div className="flow-footer"><span>{camera.manufacturer} {camera.model} selected</span><button className="primary-button" onClick={() => setStep(2)}>Choose my scene <ArrowRight size={18} /></button></div>
              </section>
            )}

            {step === 2 && (
              <section className="flow-panel">
                <div className="flow-heading"><span className="step-icon"><Compass size={23} /></span><div><h1>What are you shooting?</h1><p>Pick the closest match. You can fine-tune it next.</p></div></div>
                <label className="search-field"><Search size={18} /><input value={sceneQuery} onChange={(event) => setSceneQuery(event.target.value)} placeholder="Search fishing, night, vlog…" /></label>
                {!sceneQuery && <div className="group-tabs" role="tablist">{sceneGroups.map((group) => <button key={group.id} className={sceneGroup === group.id ? "active" : ""} onClick={() => setSceneGroup(group.id)}>{group.name}</button>)}</div>}
                <div className="scene-grid">{filteredScenes.map((item, index) => <button key={item.id} className={`scene-card ${sceneId === item.id ? "selected" : ""}`} onClick={() => chooseScene(item.id)}><span className="scene-card-top"><span className="scene-monogram">{item.name.split(/\s|\//).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase()}</span><span className="scene-frame-no">{String(index + 1).padStart(2, "0")}</span></span><strong>{item.name}</strong><span className="scene-tech light">{sceneTechLine(item).slice(0, 2).map((token) => <em key={token}>{token}</em>)}</span>{sceneId === item.id && <i><Check size={13} /></i>}</button>)}</div>
                <div className="flow-footer"><span>{scene.name} selected</span><button className="primary-button" onClick={() => setStep(3)}>Add conditions <ArrowRight size={18} /></button></div>
              </section>
            )}

            {step === 3 && (
              <section className="flow-panel conditions-panel">
                <div className="flow-heading"><span className="step-icon"><CloudSun size={23} /></span><div><h1>What are the conditions?</h1><p>Three quick choices make the recommendation much sharper.</p></div></div>
                <ChoiceGroup title="Light" eyebrow="1" options={lightOptions} value={light} onChange={(id) => setLight(id as LightId)} />
                <ChoiceGroup title="Movement" eyebrow="2" options={movementOptions} value={movement} onChange={(id) => setMovement(id as MovementId)} />
                <ChoiceGroup title="Camera position" eyebrow="3" options={mountOptions} value={mount} onChange={(id) => setMount(id as MountId)} />
                <div className="advanced-wrap">
                  <button className="advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)}><span><SlidersHorizontal size={17} /> Make my recommendation even better</span><ChevronDown size={18} className={showAdvanced ? "rotated" : ""} /></button>
                  {showAdvanced && <div className="advanced-content">
                    <CompactChoice title="Where is it going?" options={platformOptions} value={platform} onChange={(id) => setPlatform(id as PlatformId)} />
                    <CompactChoice title="Editing level" options={editingOptions} value={editing} onChange={(id) => setEditing(id as EditingId)} />
                    <CompactChoice title="Your priority" options={priorityOptions} value={priority} onChange={(id) => setPriority(id as PriorityId)} />
                    <CompactChoice title="Audio" options={audioPrefOptions} value={audioPref} onChange={(id) => setAudioPref(id as AudioPrefId)} />
                    <div className="compact-choice"><h3>Accessories you have</h3><div className="chip-wrap">{accessoryOptions.map((item) => <button key={item.id} className={accessories.includes(item.id) ? "selected" : ""} onClick={() => toggleAccessory(item.id)}>{accessories.includes(item.id) && <Check size={13} />}{item.name}</button>)}</div></div>
                  </div>}
                </div>
                <div className="flow-footer"><span>{camera.model} · {scene.name}</span><button className="primary-button ready-button" onClick={finish}><Focus size={18} /> Build my setup</button></div>
              </section>
            )}
          </div>
        )}

        {view === "result" && (
          <div className="result-view page-width-narrow">
            <div className="result-nav">
              <button onClick={() => startFlow(3)}><ArrowLeft size={17} /> Change conditions</button>
              <div><button onClick={saveSetup}><Bookmark size={17} /> Save</button><button onClick={shareSetup}><Share2 size={17} /> Share</button></div>
            </div>
            <section className="ready-intro">
              <div className="focus-brackets"><span /><Focus size={25} /><span /></div>
              <span>SETUP READY</span>
              <h1>Use these settings.</h1>
              <p>They have been checked against your camera and the conditions you selected.</p>
            </section>

            <section className="recommendation-card">
              <div className="ticket-top">
                <div><small>RECOMMENDED FOR</small><h2>{scene.name}</h2><p>{camera.manufacturer} {camera.model}</p></div>
                <div className={`confidence-badge ${result.confidence}`}><CircleCheck size={17} /><span><small>CONFIDENCE</small>{confidenceCopy(result.confidence)}</span></div>
              </div>
              <div className="condition-strip">
                <span>Light · {lightOptions.find((item) => item.id === light)?.name}</span>
                <span>Motion · {movementOptions.find((item) => item.id === movement)?.name}</span>
                <span>Mount · {mountOptions.find((item) => item.id === mount)?.name}</span>
                <span>Output · {platformOptions.find((item) => item.id === platform)?.name}</span>
              </div>
              <div className="ticket-cut"><i /><span>RECOMMENDED SETUP</span><i /></div>
              <div className="settings-grid">{result.settings.map((line) => <SettingTile key={line.key} line={line} />)}</div>
              <div className="why-box"><span><Lightbulb size={19} /></span><div><small>WHY THIS WORKS</small><p>{result.whyItWorks}</p></div></div>
              {result.dontForget && <div className="dont-forget"><CircleAlert size={19} /><div><small>DON&apos;T FORGET</small><strong>{result.dontForget}</strong></div></div>}
            </section>

            {result.warnings.length > 0 && <div className="warnings">{result.warnings.map((warning) => <p key={warning}><CircleAlert size={17} />{warning}</p>)}</div>}

            <section className="result-section">
              <div className="result-section-heading"><div><span>ADJUST THE RESULT</span><h2>Change the priority</h2></div><p>The setup updates immediately.</p></div>
              <div className="tweak-grid">{tweakOptions.map((item) => <button key={item.id} className={tweaks.includes(item.id) ? "selected" : ""} onClick={() => toggleTweak(item.id)}>{tweaks.includes(item.id) ? <Check size={15} /> : <SlidersHorizontal size={15} />}{item.name}</button>)}</div>
            </section>

            <Reveal className="mistake-card">
              <div className="mistake-title"><span>!</span><div><small>BEFORE RECORDING</small><h2>Things to check</h2></div></div>
              <div className="mistake-list">{result.mistakes.slice(0, 3).map((mistake, index) => <div key={mistake}><i>0{index + 1}</i><p>{mistake}</p></div>)}</div>
            </Reveal>

            {result.advantages.length > 0 && <section className="advantage-card"><Star size={22} fill="currentColor" /><div><small>CAMERA ADVANTAGE</small><h3>{result.advantages[0].name}</h3><p>{result.advantages[0].desc}</p></div></section>}

            <section className="result-section pro-section">
              <button className="pro-toggle" onClick={() => setShowPro(!showPro)}><span><Settings2 size={19} /><span><strong>Show pro settings</strong><small>Every relevant setting, explained simply</small></span></span><ChevronDown size={19} className={showPro ? "rotated" : ""} /></button>
              {showPro && <div className="pro-content">
                <div className="pro-settings">{result.proSettings.map((line, index) => <SettingTile key={`${line.key}-${index}`} line={line} detail />)}</div>
                {result.accessories.length > 0 && <div className="accessory-callout"><Package size={19} /><div><small>ACCESSORY NOTES</small>{result.accessories.map((tip) => <p key={tip.text}>{tip.text}</p>)}</div></div>}
                <div className="setup-paths"><div className="setup-path-heading"><Camera size={19} /><div><small>ON-CAMERA GUIDE</small><h3>How to set this</h3></div></div>{result.howToSet.map((item, index) => <div className="setup-step" key={item.step}><i>{index + 1}</i><span><strong>{item.step}</strong>{item.path && <small>{item.path}</small>}</span></div>)}</div>
              </div>}
            </section>

            <section className="result-section what-if-section">
              <div className="result-section-heading"><div><span>COMPARE OPTIONS</span><h2>What changes if…</h2></div></div>
              <div className="what-if-options">{whatIfChoices.map((item) => <button key={item.id} className={whatIf === item.id ? "selected" : ""} onClick={() => setWhatIf(item.id)}>{item.label}<ChevronRight size={15} /></button>)}</div>
              {whatIf && <div className="what-if-answer"><HelpCircle size={20} /><p>{whatIfAnswer(camera, scene, scenario, result, whatIf)}</p></div>}
            </section>

            <div className="result-actions"><button className="primary-button" onClick={saveSetup}><Bookmark size={18} /> Save this setup</button><button className="secondary-button" onClick={() => startFlow(2)}>Choose another shot</button></div>
            <section className={`data-provenance ${camera.confidence}`}>
              <div className="provenance-head">
                <ShieldCheck size={18} />
                <div>
                  <small>DATA PROVENANCE</small>
                  <h3>Where these specs come from</h3>
                </div>
                <span className={`confidence-chip ${camera.confidence}`}>{camera.confidence === "verified" ? "VERIFIED" : camera.confidence === "high" ? "HIGH CONFIDENCE" : "NOT VERIFIED"}</span>
              </div>
              <dl className="provenance-grid">
                <div><dt>Camera</dt><dd>{camera.manufacturer} {camera.model}</dd></div>
                <div><dt>Sensor</dt><dd>{camera.sensor}</dd></div>
                <div><dt>Last reviewed</dt><dd>{camera.lastVerified}</dd></div>
                <div><dt>Source</dt><dd>{camera.officialSource ?? "Not recorded"}</dd></div>
                {camera.firmwareChecked && <div><dt>Firmware</dt><dd>{camera.firmwareChecked}</dd></div>}
              </dl>
              {camera.verifyNote && <p className="provenance-note"><CircleAlert size={15} /> {camera.verifyNote}</p>}
              <p className="provenance-footer">
                Every setting above was filtered against this profile — {brand.name} will not suggest a mode your camera cannot select.
              </p>
            </section>
          </div>
        )}

        {view === "recipes" && (
          <div className="library-view page-width">
            <section className="library-hero"><span>CAMERA-SPECIFIC RECIPES</span><h1>Tested starting points.</h1><p>Each recipe is checked against the selected camera before the settings are shown.</p></section>
            <div className="recipe-toolbar"><div><BadgeCheck size={17} /> {recipes.filter((item) => item.verified).length} verified recipes</div><button onClick={() => startFlow(1)}><Plus size={16} /> Build custom</button></div>
            <div className="recipe-grid">{recipes.map((recipe) => {
              const recipeCamera = getCamera(recipe.cameraId);
              return <article className="recipe-card" key={recipe.id}><div className="recipe-card-top"><span className="recipe-number">{recipe.id.split("-").slice(-1)[0].slice(0, 2).toUpperCase()}</span>{recipe.verified && <i><BadgeCheck size={14} /> VERIFIED</i>}</div><h2>{recipe.name}</h2><p>{recipe.note}</p><div className="recipe-meta"><span>{recipeCamera?.model ?? "Camera coming soon"}</span><span>{lightOptions.find((item) => item.id === recipe.scenario.light)?.name}</span></div><button disabled={!recipeCamera} onClick={() => loadRecipe(recipe)}>{recipeCamera ? "Load recipe" : "Coming soon"}<ArrowRight size={16} /></button></article>;
            })}</div>
          </div>
        )}

        {view === "bag" && (
          <div className="bag-view page-width">
            <section className="library-hero compact-hero"><span>YOUR KIT</span><h1>My Camera Bag</h1><p>Keep your gear and saved setups ready—even when the signal isn&apos;t.</p></section>
            <div className="bag-columns">
              <section className="bag-panel"><div className="bag-panel-heading"><div><Camera size={19} /><span><small>OWNED GEAR</small><h2>My cameras</h2></span></div><b>{bag.length}</b></div><div className="bag-camera-list">{bag.map((id) => getCamera(id)).filter(Boolean).map((item) => item && <div key={item.id}><span className={`mini-camera tone-${item.category}`}><CameraArt category={item.category} /></span><div><strong>{item.manufacturer} {item.model}</strong><small>{categoryLabels[item.category]} · {item.confidence} profile</small></div><button onClick={() => { setCameraId(item.id); startFlow(2); }}>Use <ChevronRight size={15} /></button></div>)}</div><button className="add-gear" onClick={() => startFlow(1)}><Plus size={16} /> Add another camera</button></section>
              <section className="bag-panel"><div className="bag-panel-heading"><div><Bookmark size={19} /><span><small>SAVED ON THIS DEVICE</small><h2>Saved setups</h2></span></div><b>{saved.length}</b></div>{saved.length === 0 ? <div className="empty-state"><Bookmark size={28} /><strong>No saved setups yet</strong><p>Get a recommendation, then save it here for one-tap access.</p><button onClick={() => startFlow(1)}>Get my first setup</button></div> : <div className="saved-list">{saved.map((item) => <div key={item.id}><span><Camera size={17} /></span><div><strong>{item.name}</strong><small>{lightOptions.find((option) => option.id === item.scenario.light)?.name} · {mountOptions.find((option) => option.id === item.scenario.mount)?.name}</small></div><button onClick={() => loadSaved(item)} aria-label={`Load ${item.name}`}><Play size={15} fill="currentColor" /></button><button className="remove-saved" onClick={() => setSaved((current) => current.filter((savedItem) => savedItem.id !== item.id))} aria-label={`Delete ${item.name}`}><X size={15} /></button></div>)}</div>}</section>
            </div>
            <section className="all-gear"><div className="section-heading"><div><span>SUPPORTED CAMERAS</span><h2>Add to your bag</h2></div></div><div className="camera-grid">{cameras.map((item) => <CameraCard key={item.id} item={item} selected={false} inBag={bag.includes(item.id)} onChoose={() => { setCameraId(item.id); startFlow(2); }} onBag={() => toggleBag(item.id)} />)}</div></section>
          </div>
        )}

        {view === "learn" && (
          <div className="learn-view page-width">
            <section className="library-hero"><span>PLAIN-LANGUAGE GUIDES</span><h1>Understand the setting.</h1><p>Short explanations for the controls that make a visible difference.</p></section>
            <div className="learn-grid">{learnCards.map(({ title, time, icon: Icon, text }) => <article key={title} className="learn-card"><div><Icon size={22} /><span>{time}</span></div><h2>{title}</h2><p>{text}</p></article>)}</div>
            <Reveal className="fps-lab"><div><span>QUICK VISUAL GUIDE</span><h2>Frame rate at a glance</h2><p>More frames make motion smoother—and give you more room to slow it down.</p></div><div className="fps-track">{[{ fps: 24, label: "Cinematic" }, { fps: 30, label: "Everyday" }, { fps: 60, label: "Smooth action" }, { fps: 120, label: "Slow motion" }].map((item) => <div key={item.fps}><span style={{ "--dots": item.fps / 12 } as React.CSSProperties}>{Array.from({ length: item.fps / 12 }).map((_, index) => <i key={index} />)}</span><strong>{item.fps}<small> FPS</small></strong><p>{item.label}</p></div>)}</div></Reveal>
          </div>
        )}
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <CamMark />
            <strong>{brand.wordmark}</strong>
            <p>{brand.tagline}</p>
          </div>
          <div className="footer-cols">
            <div>
              <h3>Product</h3>
              <button onClick={() => startFlow(1)}>Get my settings</button>
              <button onClick={() => navTo("recipes")}>Recipes</button>
              <button onClick={() => navTo("bag")}>My camera bag</button>
              <button onClick={() => navTo("learn")}>Learn</button>
            </div>
            <div>
              <h3>Cameras</h3>
              {cameraBrands.slice(0, 5).map((name) => (
                <button key={name} onClick={() => { setCameraFilter(`brand:${name}`); setCameraQuery(""); startFlow(1); }}>{name}</button>
              ))}
            </div>
            <div>
              <h3>Data</h3>
              <span>{cameras.length} capability profiles</span>
              <span>{cameras.filter((c) => c.confidence === "verified").length} verified</span>
              <span>{cameras.filter((c) => c.confidence === "high").length} high confidence</span>
              <span>Last review {cameras.reduce((latest, c) => (c.lastVerified > latest ? c.lastVerified : latest), "")}</span>
              <Link href="/credits">Photo credits &amp; sources</Link>
            </div>
          </div>
        </div>

        <div className="footer-disclaimer">
          <p>
            <strong>{brand.name} is an independent informational guide.</strong> It is not
            affiliated with, endorsed by, sponsored by or otherwise connected to DJI, GoPro,
            Insta360, Sony, Canon, Nikon, Fujifilm, Panasonic or any other manufacturer.
          </p>
          <p>
            Camera names, model numbers and feature names are trademarks of their respective
            owners and are used here only to identify the equipment a recommendation applies to.
            Capability data is compiled from publicly published specifications. Settings are
            guidance rather than a guarantee, so always confirm them on your own camera.
          </p>
        </div>

        <div className="footer-base">
          <span>{brand.domain}</span>
          <span>Independent guide. No manufacturer affiliation.</span>
        </div>
      </footer>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <button className={view === "home" ? "active" : ""} onClick={() => navTo("home")}><Home size={20} /><span>Home</span></button>
        <button className={view === "recipes" ? "active" : ""} onClick={() => navTo("recipes")}><Bookmark size={20} /><span>Recipes</span></button>
        <button className="mobile-shoot" onClick={() => startFlow(1)}><span><Aperture size={24} /></span><small>Shoot</small></button>
        <button className={view === "bag" ? "active" : ""} onClick={() => navTo("bag")}><Camera size={20} /><span>Bag</span></button>
        <button className={view === "learn" ? "active" : ""} onClick={() => navTo("learn")}><Lightbulb size={20} /><span>Learn</span></button>
      </nav>
    </div>
  );
}

function CameraCard({ item, selected, inBag, onChoose, onBag }: { item: (typeof cameras)[number]; selected: boolean; inBag: boolean; onChoose: () => void; onBag: () => void }) {
  return (
    <div className={`camera-card ${selected ? "selected" : ""}`}>
      <button className="camera-select" onClick={onChoose}>
        <span className={`camera-visual tone-${item.category}`}>
          <CameraArt category={item.category} />
          {item.popular && <span className="popular-pill">POPULAR</span>}
        </span>
        <span className="camera-copy">
          <small>{item.manufacturer.toUpperCase()}</small>
          <strong>{item.model}</strong>
          <em>
            {categoryLabels[item.category]}
            {item.confidence === "unverified" && <b className="unverified-flag">NOT VERIFIED</b>}
          </em>
          <span className="camera-sensor">{item.sensor}</span>
        </span>
        {selected && <span className="selected-check"><Check size={14} /></span>}
      </button>
      <button className={`heart-button ${inBag ? "saved" : ""}`} onClick={onBag} aria-label={inBag ? `Remove ${item.model} from bag` : `Add ${item.model} to bag`}><Heart size={16} fill={inBag ? "currentColor" : "none"} /></button>
    </div>
  );
}

function ChoiceGroup({ title, eyebrow, options, value, onChange }: { title: string; eyebrow: string; options: { id: string; name: string; emoji?: string }[]; value: string; onChange: (id: string) => void }) {
  return (
    <div className="choice-group">
      <h2><span>{eyebrow}</span>{title}</h2>
      <div className="choice-grid">{options.map((item) => <button key={item.id} className={value === item.id ? "selected" : ""} onClick={() => onChange(item.id)} aria-pressed={value === item.id}><span className="choice-mark">{item.name.slice(0, 2).toUpperCase()}</span><strong>{item.name}</strong>{value === item.id && <i><Check size={12} /></i>}</button>)}</div>
    </div>
  );
}

function CompactChoice({ title, options, value, onChange }: { title: string; options: { id: string; name: string }[]; value: string; onChange: (id: string) => void }) {
  return <div className="compact-choice"><h3>{title}</h3><div className="chip-wrap">{options.map((item) => <button key={item.id} className={value === item.id ? "selected" : ""} onClick={() => onChange(item.id)}>{value === item.id && <Check size={13} />}{item.name}</button>)}</div></div>;
}
