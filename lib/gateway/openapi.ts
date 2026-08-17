// OpenAPI 3.1 description of /api/v1. Hand-authored, and held truthful by
// scripts/validate.ts, which asserts every documented path has a matching
// route file on disk (and that no v1 route exists undocumented).

import { API_VERSION, DATA_VERSION, SITE } from "./core";

const recommendInputSchema = {
  type: "object",
  required: ["camera"],
  additionalProperties: false,
  properties: {
    camera: { type: "string", maxLength: 120, description: "Camera name or slug, e.g. 'DJI Osmo Action 6'." },
    activity: { type: "string", maxLength: 120, description: "What is being filmed, e.g. 'fishing from a moving boat'." },
    scenario: { type: "string", maxLength: 120, description: "Alias of activity." },
    environment: { type: "string", maxLength: 120 },
    lighting: { type: "string", maxLength: 120, description: "e.g. 'bright tropical daylight', 'night'." },
    subject: { type: "string", maxLength: 120 },
    movement_level: { type: "string", maxLength: 120, description: "stationary | slow | moderate | fast | extreme (free text accepted)." },
    mounting_position: { type: "string", maxLength: 120 },
    desired_resolution: { type: "string", maxLength: 120, description: "Advisory." },
    desired_frame_rate: { type: "integer", minimum: 1, maximum: 1000, description: "Advisory; >=100 implies slow-motion priority." },
    destination_platform: { type: "string", maxLength: 120 },
    quality_priority: { type: "boolean" },
    battery_priority: { type: "boolean" },
    storage_priority: { type: "boolean" },
    editing_level: { type: "string", maxLength: 120 },
    slow_motion_required: { type: "boolean" },
  },
} as const;

export const openapiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Smarter Capture Camera Configuration API",
    version: API_VERSION,
    description:
      "Deterministic camera-settings recommendations for supported cameras and scenarios. " +
      "All recommendations are capability-checked against verified camera profiles; the API never invents modes a camera cannot select. " +
      `Current data version: ${DATA_VERSION}. Read-only and anonymous in v1.`,
    contact: { url: `${SITE}/ai` },
  },
  servers: [{ url: `${SITE}/api/v1` }],
  paths: {
    "/cameras": {
      get: {
        operationId: "listCameras",
        summary: "List supported cameras",
        parameters: [
          { name: "manufacturer", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string", description: "action | 360 | pocket | vlogging | compact | mirrorless | cinema" } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 100 } },
          { name: "offset", in: "query", schema: { type: "integer", minimum: 0, default: 0 } },
        ],
        responses: { "200": { description: "Camera summaries with pagination." } },
      },
    },
    "/cameras/{slug}": {
      get: {
        operationId: "getCameraCapabilities",
        summary: "Full verified capability profile for one camera",
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" }, description: "Slug or fuzzy camera name." }],
        responses: { "200": { description: "Full capability profile." }, "404": { description: "Unknown camera." } },
      },
    },
    "/scenarios": {
      get: {
        operationId: "listScenarios",
        summary: "List supported shooting scenarios",
        responses: { "200": { description: "All scenarios with their shooting DNA." } },
      },
    },
    "/recommend": {
      post: {
        operationId: "recommendCameraSettings",
        summary: "Get a structured settings recommendation",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RecommendInput" } } },
        },
        responses: {
          "200": { description: "Structured recommendation with provenance, assumptions, warnings and attribution." },
          "400": { description: "Invalid input." },
          "404": { description: "Unknown camera." },
        },
      },
    },
    "/compare": {
      post: {
        operationId: "compareCameraSettings",
        summary: "Run the same scenario across 2-4 cameras",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CompareInput" } } },
        },
        responses: { "200": { description: "Per-camera recommendations." } },
      },
    },
    "/accessories": {
      get: {
        operationId: "listAccessories",
        summary: "List purchasable accessories with compatibility notes",
        responses: { "200": { description: "Accessory list." } },
      },
    },
    "/health": {
      get: { operationId: "health", summary: "Service health", responses: { "200": { description: "Status." } } },
    },
    "/version": {
      get: { operationId: "version", summary: "API, engine and data versions", responses: { "200": { description: "Versions." } } },
    },
  },
  components: {
    schemas: {
      RecommendInput: recommendInputSchema,
      CompareInput: {
        allOf: [
          { type: "object", required: ["cameras"], properties: { cameras: { type: "array", minItems: 2, maxItems: 4, items: { type: "string" } } } },
          { ...recommendInputSchema, required: [] },
        ],
      },
      Error: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              request_id: { type: "string" },
            },
          },
        },
      },
    },
  },
} as const;
