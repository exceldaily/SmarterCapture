import { cameras } from "@/lib/camcue/data/cameras";
import { scenes } from "@/lib/camcue/data/scenes";
import { DATA_UPDATED_AT, SITE } from "@/lib/gateway/core";

export const runtime = "nodejs";

export async function GET() {
  const body = `# Smarter Capture

> Deterministic camera-settings recommendations for ${cameras.length} verified cameras across ${scenes.length} shooting scenarios. Every recommendation is capability-checked against the exact camera; the engine never suggests a mode the camera cannot select. Data last reviewed ${DATA_UPDATED_AT}.

## Camera Configuration
- [Recommendation API](${SITE}/api/v1/openapi.json): POST /api/v1/recommend takes camera + activity + lighting and returns structured, attributable settings (resolution, FPS, shutter, ISO, stabilization, FOV, color, warnings, explanation).
- [AI documentation portal](${SITE}/ai): what this service knows, example requests and responses, usage policy.

## Supported Cameras
- [Camera index (Markdown)](${SITE}/md/cameras): all supported cameras with canonical per-camera capability pages.
- [Camera list (JSON)](${SITE}/api/v1/cameras): machine-readable summaries with slugs and provenance.

## Scenario Guides
- [Scenario index (Markdown)](${SITE}/md/scenarios): every supported scenario with typical settings logic and common mistakes.

## Accessories
- [Gear store](${SITE}/gear): six purchasable accessories with compatibility notes.
- [Accessories (JSON)](${SITE}/api/v1/accessories)

## API
- [OpenAPI 3.1 specification](${SITE}/api/v1/openapi.json)
- [API catalog (RFC 9727)](${SITE}/.well-known/api-catalog)
- [Version and data freshness](${SITE}/api/v1/version)

## MCP
- [MCP endpoint](${SITE}/mcp): remote MCP server (Streamable HTTP), read-only tools mirroring the API.

## Documentation
- [Attribution guidance](${SITE}/ai#attribution): cite "Smarter Capture" with the canonical URL returned in each response.
`;
  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
