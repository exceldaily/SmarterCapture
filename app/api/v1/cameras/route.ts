import { cameras } from "@/lib/camcue/data/cameras";
import { serializeCameraSummary, DATA_VERSION } from "@/lib/gateway/core";
import { fail, logAgentEvent, ok, preflight, rateLimit, requestId } from "@/lib/gateway/http";
import { cameraQuerySchema } from "@/lib/gateway/schemas";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

export async function GET(request: Request) {
  const rid = requestId();
  const limited = rateLimit(request, rid);
  if (limited) return limited;
  logAgentEvent(request, rid, "cameras_list");

  const url = new URL(request.url);
  const parsed = cameraQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return fail(rid, 400, "invalid_query", parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  }
  const { manufacturer, category, limit, offset } = parsed.data;

  let list = cameras;
  if (manufacturer) list = list.filter((c) => c.manufacturer.toLowerCase() === manufacturer.toLowerCase());
  if (category) list = list.filter((c) => c.category === category.toLowerCase());

  const page = list.slice(offset, offset + limit);
  return ok(
    {
      cameras: page.map(serializeCameraSummary),
      pagination: { total: list.length, limit, offset, returned: page.length },
      data_version: DATA_VERSION,
    },
    rid,
    { cache: "static", etag: `"cameras-${DATA_VERSION}-${manufacturer ?? ""}-${category ?? ""}-${limit}-${offset}"` },
  );
}
