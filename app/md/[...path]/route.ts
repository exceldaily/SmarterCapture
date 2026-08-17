import { cameraIndexMarkdown, cameraMarkdown, scenarioIndexMarkdown, scenarioMarkdown } from "@/lib/gateway/markdown";
import { logAgentEvent, rateLimit, requestId } from "@/lib/gateway/http";

export const runtime = "nodejs";

function markdown(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "access-control-allow-origin": "*",
    },
  });
}

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const rid = requestId();
  const limited = rateLimit(request, rid);
  if (limited) return limited;

  const { path } = await context.params;
  // Strict allow-list routing: no traversal, no dynamic lookup beyond known data.
  const [head, slug, ...rest] = path.map((p) => p.toLowerCase()).filter((p) => /^[a-z0-9-]+$/.test(p));
  if (rest.length || !head) return markdown("# Not found\n\nSee /md/cameras or /md/scenarios.", 404);

  logAgentEvent(request, rid, "markdown", { path: path.join("/") });

  if (head === "cameras" && !slug) return markdown(cameraIndexMarkdown());
  if (head === "cameras" && slug) {
    const body = cameraMarkdown(slug);
    return body ? markdown(body) : markdown(`# Unknown camera\n\nSee /md/cameras for the supported list.`, 404);
  }
  if (head === "scenarios" && !slug) return markdown(scenarioIndexMarkdown());
  if (head === "scenarios" && slug) {
    const body = scenarioMarkdown(slug);
    return body ? markdown(body) : markdown(`# Unknown scenario\n\nSee /md/scenarios for the supported list.`, 404);
  }
  return markdown("# Not found\n\nSee /md/cameras or /md/scenarios.", 404);
}
