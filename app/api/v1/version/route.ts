import { API_VERSION, DATA_UPDATED_AT, DATA_VERSION, ENGINE_VERSION, SITE } from "@/lib/gateway/core";
import { ok, preflight, requestId } from "@/lib/gateway/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

export async function GET() {
  const rid = requestId();
  return ok(
    {
      api_version: API_VERSION,
      engine_version: ENGINE_VERSION,
      data_version: DATA_VERSION,
      data_last_reviewed: DATA_UPDATED_AT,
      documentation: `${SITE}/ai`,
      openapi: `${SITE}/api/v1/openapi.json`,
      mcp: `${SITE}/mcp`,
    },
    rid,
    { cache: "static" },
  );
}
