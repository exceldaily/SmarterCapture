// Purposeful Markdown representations of the knowledge base — the canonical
// machine URLs referenced by every API and MCP response. Generated from the
// same data modules as everything else: no scraped HTML, no navigation noise.

import { brand } from "@/lib/camcue/brand";
import { cameras, categoryLabels, getCamera } from "@/lib/camcue/data/cameras";
import { getScene, scenes } from "@/lib/camcue/data/scenes";
import { DATA_UPDATED_AT, DATA_VERSION, SITE, cameraCanonicalUrl, sceneCanonicalUrl } from "./core";

const footer = (canonical: string, updated: string) =>
  `\n---\n\nCanonical URL: ${canonical}\nSource: ${brand.name} (${SITE})\nData version: ${DATA_VERSION}\nLast updated: ${updated}\nAPI: ${SITE}/api/v1/openapi.json · MCP: ${SITE}/mcp\n`;

export function cameraIndexMarkdown(): string {
  const rows = cameras
    .map((c) => `| [${c.manufacturer} ${c.model}](${cameraCanonicalUrl(c.id)}) | ${categoryLabels[c.category]} | ${c.sensor} | ${c.confidence} | ${c.lastVerified} |`)
    .join("\n");
  return `# Supported Cameras — ${brand.name}

${cameras.length} cameras with verified capability profiles. Recommendations are only ever produced from these profiles.

| Camera | Category | Sensor | Confidence | Reviewed |
|---|---|---|---|---|
${rows}
${footer(`${SITE}/md/cameras`, DATA_UPDATED_AT)}`;
}

export function cameraMarkdown(slug: string): string | null {
  const cam = getCamera(slug);
  if (!cam) return null;
  const modes = cam.videoModes
    .map((m) => `| ${m.res} | ${m.fps.join(", ")} | ${(m.aspect ?? ["16:9"]).join(", ")} | ${m.note ?? ""} |`)
    .join("\n");
  const stab = cam.stabilization
    .map((s) => `- **${s.name}** (strength ${s.strength}/3)${s.maxFps ? ` — up to ${s.maxFps} FPS` : ""}${s.resExclude?.length ? ` — not at ${s.resExclude.join("/")}` : ""}${s.crop ? " — crops the image" : ""}${s.note ? ` — ${s.note}` : ""}`)
    .join("\n");
  const colors = cam.colorProfiles
    .map((p) => `- **${p.name}** — ${p.bitDepth}-bit${p.log ? ", log (for grading)" : ""}${p.note ? ` — ${p.note}` : ""}`)
    .join("\n");
  const fov = cam.fovModes?.length
    ? cam.fovModes.map((f) => `- **${f.name}** — ${f.distortion} distortion${f.note ? ` — ${f.note}` : ""}`).join("\n")
    : "Lens-dependent (interchangeable-lens body).";

  return `# ${cam.manufacturer} ${cam.model}

${categoryLabels[cam.category]} camera · ${cam.sensor} · profile confidence: **${cam.confidence}**${cam.officialSource ? ` · source: ${cam.officialSource}` : ""}

## Video modes

| Resolution | Frame rates | Aspect | Note |
|---|---|---|---|
${modes}

## Stabilization

${stab}

## Color profiles

${colors}

## Field of view

${fov}

## Exposure

- ISO range: ${cam.iso.min}–${cam.iso.max}${cam.recommendedIsoCeiling ? ` (recommended ceilings — bright: ${cam.recommendedIsoCeiling.bright}, normal: ${cam.recommendedIsoCeiling.normal}, low light: ${cam.recommendedIsoCeiling.low})` : ""}
- Manual shutter: ${cam.shutterControl ? "yes" : "no"}
- Aperture: ${cam.aperture ? (cam.aperture.type === "fixed" ? `fixed ${cam.aperture.value}` : cam.aperture.value ?? "variable (lens-dependent)") : "n/a"}
- Built-in ND: ${cam.builtInNd ? "yes" : "no"}

## Notable

${cam.specialFeatures.map((f) => `- **${f.name}** — ${f.desc}`).join("\n") || "-"}

Strengths: ${cam.strengths.join("; ")}.
Weaknesses: ${cam.weaknesses.join("; ")}.
${cam.verifyNote ? `\n> Verification note: ${cam.verifyNote}\n` : ""}
## Get a recommendation

POST ${SITE}/api/v1/recommend with \`{"camera": "${cam.id}", "activity": "...", "lighting": "..."}\`
${footer(cameraCanonicalUrl(cam.id), cam.lastVerified)}`;
}

export function scenarioIndexMarkdown(): string {
  const groups = new Map<string, typeof scenes>();
  for (const s of scenes) {
    groups.set(s.group, [...(groups.get(s.group) ?? []), s]);
  }
  const body = [...groups.entries()]
    .map(([group, list]) =>
      `## ${group[0].toUpperCase()}${group.slice(1)}\n\n` +
      list.map((s) => `- [${s.name}](${sceneCanonicalUrl(s.id)}) — typical motion: ${s.motion}${s.night ? ", low light" : ""}${s.water ? ", around water" : ""}`).join("\n"),
    )
    .join("\n\n");
  return `# Supported Scenarios — ${brand.name}

${scenes.length} shooting scenarios, each carrying the shooting characteristics the recommendation engine consumes.

${body}
${footer(`${SITE}/md/scenarios`, DATA_UPDATED_AT)}`;
}

export function scenarioMarkdown(id: string): string | null {
  const scene = getScene(id);
  if (!scene) return null;
  return `# Scenario: ${scene.name}

Group: ${scene.group} · typical motion: **${scene.motion}** · slow-motion value: ${scene.slowMoValue}/3${scene.cinematicBias ? " · cinematic (24p) bias" : ""}${scene.water ? " · involves water" : ""}${scene.talking ? " · speech is critical" : ""}

Typical defaults: lighting **${scene.defaultLight ?? "varies"}**, mount **${scene.defaultMount ?? "varies"}**.

## Don't mess this up

${scene.mistakes.map((m) => `- ${m}`).join("\n")}

## Get camera-specific settings

POST ${SITE}/api/v1/recommend with \`{"camera": "<your camera>", "activity": "${scene.id}"}\` — the engine fits this scenario's ideal strategy to the exact camera's verified capabilities.
${footer(sceneCanonicalUrl(scene.id), DATA_UPDATED_AT)}`;
}
