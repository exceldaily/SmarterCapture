import { runRecommendation } from "@/lib/gateway/core";
import { fail, logAgentEvent, ok, preflight, rateLimit, readJsonBody, requestId } from "@/lib/gateway/http";
import { recommendSchema } from "@/lib/gateway/schemas";

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

  const parsed = recommendSchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      rid, 400, "invalid_input",
      parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; "),
      { schema: "/api/v1/openapi.json#/components/schemas/RecommendInput" },
    );
  }

  logAgentEvent(request, rid, "recommend", { camera: parsed.data.camera });

  const outcome = runRecommendation(parsed.data);
  if (outcome.error) {
    return fail(rid, 404, outcome.error, outcome.message);
  }
  return ok({ recommendation: outcome.result, request_id: rid }, rid);
}
