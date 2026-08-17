import { accessoryProducts } from "@/lib/accessories/catalog";
import { serializeAccessory, DATA_VERSION } from "@/lib/gateway/core";
import { logAgentEvent, ok, preflight, rateLimit, requestId } from "@/lib/gateway/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

export async function GET(request: Request) {
  const rid = requestId();
  const limited = rateLimit(request, rid);
  if (limited) return limited;
  logAgentEvent(request, rid, "accessories_list");
  const accessories = accessoryProducts.map((p) => serializeAccessory(p.id)).filter(Boolean);
  return ok(
    { accessories, total: accessories.length, data_version: DATA_VERSION },
    rid,
    { cache: "static", etag: `"accessories-${DATA_VERSION}"` },
  );
}
