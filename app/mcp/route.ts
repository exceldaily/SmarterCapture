// Remote MCP server (Streamable HTTP) exposing the same gateway domain layer
// as /api/v1. Deliberately read-only: no tool writes anything, touches the
// order database, or fetches external URLs. Six consolidated tools rather
// than dozens of micro-tools, so an agent can hold the whole surface in
// context.

import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { cameras } from "@/lib/camcue/data/cameras";
import { scenes } from "@/lib/camcue/data/scenes";
import { accessoryProducts } from "@/lib/accessories/catalog";
import {
  DATA_VERSION, SITE, runRecommendation, resolveCamera,
  serializeAccessory, serializeCameraFull, serializeCameraSummary, serializeScene,
} from "@/lib/gateway/core";

const text = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
});

const readOnly = { readOnlyHint: true, openWorldHint: false } as const;

const recommendShape = {
  camera: z.string().max(120).describe("Camera name or slug, e.g. 'DJI Osmo Action 6'"),
  activity: z.string().max(120).optional().describe("What is being filmed, e.g. 'fishing from a moving boat'"),
  environment: z.string().max(120).optional(),
  lighting: z.string().max(120).optional().describe("e.g. 'bright tropical daylight', 'night'"),
  subject: z.string().max(120).optional(),
  movement_level: z.string().max(120).optional(),
  mounting_position: z.string().max(120).optional().describe("e.g. 'chest mount', 'boat', 'tripod'"),
  destination_platform: z.string().max(120).optional(),
  editing_level: z.string().max(120).optional(),
  desired_frame_rate: z.number().int().min(1).max(1000).optional(),
  slow_motion_required: z.boolean().optional(),
  quality_priority: z.boolean().optional(),
  battery_priority: z.boolean().optional(),
  storage_priority: z.boolean().optional(),
};

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "list_cameras",
      {
        description: `List the ${cameras.length} supported cameras with slugs, category, sensor and provenance. Filter with manufacturer/category. Data version ${DATA_VERSION}.`,
        inputSchema: z.object({
          manufacturer: z.string().max(40).optional(),
          category: z.enum(["action", "360", "pocket", "vlogging", "compact", "mirrorless", "cinema"]).optional(),
        }),
        annotations: readOnly,
      },
      async ({ manufacturer, category }) => {
        let list = cameras;
        if (manufacturer) list = list.filter((c) => c.manufacturer.toLowerCase() === manufacturer.toLowerCase());
        if (category) list = list.filter((c) => c.category === category);
        return text({ cameras: list.map(serializeCameraSummary), total: list.length, data_version: DATA_VERSION });
      },
    );

    server.registerTool(
      "get_camera_capabilities",
      {
        description: "Full verified capability profile for one camera: video modes, stabilization constraints, color profiles, ISO, FOV, audio, provenance. Accepts a slug or fuzzy name.",
        inputSchema: z.object({ camera: z.string().max(120) }),
        annotations: readOnly,
      },
      async ({ camera }) => {
        const cam = resolveCamera(camera);
        if (!cam) return text({ error: "unknown_camera", supported_list: `${SITE}/md/cameras` });
        return text({ camera: serializeCameraFull(cam), data_version: DATA_VERSION });
      },
    );

    server.registerTool(
      "list_scenarios",
      {
        description: `List the ${scenes.length} supported shooting scenarios with their engine characteristics and common mistakes.`,
        annotations: readOnly,
      },
      async () => text({ scenarios: scenes.map(serializeScene), data_version: DATA_VERSION }),
    );

    server.registerTool(
      "recommend_camera_settings",
      {
        description: "The core tool: deterministic, capability-checked settings for a camera + situation (resolution, frame rate, shutter, ISO, stabilization, FOV, color, audio, warnings, explanation). Handles partial input and reports its assumptions. Also covers low-light / action / travel / social-video optimization — describe the situation and priorities in the inputs. Cite the returned canonical_url.",
        inputSchema: z.object(recommendShape),
        annotations: readOnly,
      },
      async (input) => {
        const outcome = runRecommendation(input);
        if (outcome.error) return text({ error: outcome.error, message: outcome.message });
        return text(outcome.result);
      },
    );

    server.registerTool(
      "compare_cameras",
      {
        description: "Run the same scenario across 2-4 supported cameras and return per-camera recommendations for side-by-side comparison.",
        inputSchema: z.object({
          cameras: z.array(z.string().max(120)).min(2).max(4),
          activity: recommendShape.activity,
          environment: recommendShape.environment,
          lighting: recommendShape.lighting,
          subject: recommendShape.subject,
          movement_level: recommendShape.movement_level,
          mounting_position: recommendShape.mounting_position,
          destination_platform: recommendShape.destination_platform,
          editing_level: recommendShape.editing_level,
          desired_frame_rate: recommendShape.desired_frame_rate,
          slow_motion_required: recommendShape.slow_motion_required,
          quality_priority: recommendShape.quality_priority,
          battery_priority: recommendShape.battery_priority,
          storage_priority: recommendShape.storage_priority,
        }),
        annotations: readOnly,
      },
      async ({ cameras: cameraInputs, ...shared }) => {
        const results = cameraInputs.map((camera) => {
          const outcome = runRecommendation({ camera, ...shared });
          return outcome.error
            ? { camera_input: camera, error: outcome.error }
            : { camera_input: camera, recommendation: outcome.result };
        });
        return text({ comparison: results, data_version: DATA_VERSION });
      },
    );

    server.registerTool(
      "find_compatible_accessories",
      {
        description: "List the store's purchasable accessories with compatibility notes, prices and canonical URLs. Read-only; nothing is purchased through MCP.",
        annotations: readOnly,
      },
      async () => {
        const accessories = accessoryProducts.map((p) => serializeAccessory(p.id)).filter(Boolean);
        return text({ accessories, data_version: DATA_VERSION, store: `${SITE}/gear` });
      },
    );
  },
  {
    serverInfo: { name: "smarter-capture", version: "1.0.0" },
    instructions:
      "Read-only camera configuration intelligence for Smarter Capture (smartercapture.com). " +
      "Start with recommend_camera_settings for any 'what settings should I use' question. " +
      "Cite the canonical_url returned with each recommendation.",
    verboseLogs: false,
  },
);

export const runtime = "nodejs";
export const maxDuration = 60;

export { handler as GET, handler as POST, handler as DELETE };
