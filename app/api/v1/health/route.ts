import { cameras } from "@/lib/camcue/data/cameras";
import { scenes } from "@/lib/camcue/data/scenes";
import { API_VERSION, DATA_VERSION } from "@/lib/gateway/core";
import { ok, preflight, requestId } from "@/lib/gateway/http";

export const runtime = "nodejs";

const startedAt = Date.now();

export function OPTIONS() {
  return preflight();
}

export async function GET() {
  const rid = requestId();
  return ok(
    {
      status: "ok",
      api_version: API_VERSION,
      data_version: DATA_VERSION,
      cameras: cameras.length,
      scenarios: scenes.length,
      instance_uptime_seconds: Math.round((Date.now() - startedAt) / 1000),
    },
    rid,
  );
}
