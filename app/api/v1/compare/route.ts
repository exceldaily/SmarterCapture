import { runRecommendation } from "@/lib/gateway/core";
import { fail, logAgentEvent, ok, preflight, rateLimit, readJsonBody, requestId } from "@/lib/gateway/http";
import { compareSchema } from "@/lib/gateway/schemas";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

export async function POST(request: Request) {
  const rid = requestId();
  const limited = rateLimit(request, rid);
  if (limited) return limited;

  const { body, error } = await readJsonBody(request, rid);
  if (error) return error;

  const parsed = compareSchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      rid, 400, "invalid_input",
      parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; "),
    );
  }

  const { cameras: cameraInputs, ...shared } = parsed.data;
  logAgentEvent(request, rid, "compare", { cameras: cameraInputs });

  const results = cameraInputs.map((camera) => {
    const outcome = runRecommendation({ camera, ...shared });
    return outcome.error
      ? { camera_input: camera, error: outcome.error, message: outcome.message }
      : { camera_input: camera, recommendation: outcome.result };
  });

  if (results.every((r) => "error" in r && r.error)) {
    return fail(rid, 404, "no_cameras_resolved", "None of the requested cameras are supported. Use GET /api/v1/cameras.");
  }
  return ok({ comparison: results, request_id: rid }, rid);
}
