// Runtime validation schemas, shared verbatim by the REST API and the MCP
// tools so both surfaces accept exactly the same inputs.

import { z } from "zod";

const shortText = z.string().trim().min(1).max(120);

export const recommendSchema = z
  .object({
    camera: shortText.describe("Camera name or slug, e.g. 'DJI Osmo Action 6' or 'dji-osmo-action-6'"),
    activity: shortText.optional().describe("What is being filmed, e.g. 'fishing from a moving boat'"),
    scenario: shortText.optional().describe("Alias of activity"),
    environment: shortText.optional().describe("Environment context, e.g. 'open ocean, salt spray'"),
    lighting: shortText.optional().describe("e.g. 'bright tropical daylight', 'night', 'indoor dim'"),
    subject: shortText.optional().describe("Main subject, e.g. 'fast-moving fish and angler'"),
    movement_level: shortText.optional().describe("stationary | slow | moderate | fast | extreme (free text accepted)"),
    mounting_position: shortText.optional().describe("e.g. 'chest mount', 'boat rail', 'handheld', 'tripod'"),
    desired_resolution: shortText.optional().describe("Advisory, e.g. '4K' or 'highest'"),
    desired_frame_rate: z.number().int().min(1).max(1000).optional().describe("Advisory; >=100 implies slow-motion priority"),
    destination_platform: shortText.optional().describe("e.g. 'YouTube', 'TikTok', 'professional'"),
    quality_priority: z.boolean().optional(),
    battery_priority: z.boolean().optional(),
    storage_priority: z.boolean().optional(),
    editing_level: shortText.optional().describe("none | basic | full color grade"),
    slow_motion_required: z.boolean().optional(),
  })
  .strict();

export const compareSchema = z
  .object({
    cameras: z.array(shortText).min(2).max(4).describe("2-4 camera names or slugs"),
  })
  .merge(recommendSchema.omit({ camera: true }))
  .strict();

export const cameraQuerySchema = z.object({
  manufacturer: z.string().trim().max(40).optional(),
  category: z.string().trim().max(40).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(100),
  offset: z.coerce.number().int().min(0).max(1000).default(0),
});

export type RecommendPayload = z.infer<typeof recommendSchema>;
export type ComparePayload = z.infer<typeof compareSchema>;
