import { serializeCameraFull, resolveCamera, DATA_VERSION } from "@/lib/gateway/core";
import { fail, logAgentEvent, ok, preflight, rateLimit, requestId } from "@/lib/gateway/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const rid = requestId();
  const limited = rateLimit(request, rid);
  if (limited) return limited;

  const { slug } = await context.params;
  if (typeof slug !== "string" || slug.length > 80) {
    return fail(rid, 400, "invalid_slug", "Camera slug is malformed.");
  }
  logAgentEvent(request, rid, "camera_detail", { slug });

  const cam = resolveCamera(slug);
  if (!cam) {
    return fail(rid, 404, "unknown_camera", `No supported camera matches "${slug}". Use GET /api/v1/cameras for the supported list.`);
  }
  return ok(
    { camera: serializeCameraFull(cam), data_version: DATA_VERSION },
    rid,
    { cache: "static", etag: `"cam-${cam.id}-${cam.lastVerified}"` },
  );
}
