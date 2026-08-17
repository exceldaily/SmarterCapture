import { scenes } from "@/lib/camcue/data/scenes";
import { serializeScene, DATA_VERSION } from "@/lib/gateway/core";
import { logAgentEvent, ok, preflight, rateLimit, requestId } from "@/lib/gateway/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

export async function GET(request: Request) {
  const rid = requestId();
  const limited = rateLimit(request, rid);
  if (limited) return limited;
  logAgentEvent(request, rid, "scenarios_list");
  return ok(
    { scenarios: scenes.map(serializeScene), total: scenes.length, data_version: DATA_VERSION },
    rid,
    { cache: "static", etag: `"scenarios-${DATA_VERSION}"` },
  );
}
