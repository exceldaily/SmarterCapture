import { NextResponse } from "next/server";
import { API_VERSION, SITE } from "@/lib/gateway/core";

export const runtime = "nodejs";

// API discovery catalog in the RFC 9727 linkset shape.
export async function GET() {
  return NextResponse.json(
    {
      linkset: [
        {
          anchor: `${SITE}/api/v1`,
          "service-desc": [{ href: `${SITE}/api/v1/openapi.json`, type: "application/openapi+json" }],
          "service-doc": [{ href: `${SITE}/ai`, type: "text/html" }],
          "service-meta": [
            { href: `${SITE}/api/v1/version`, title: "Version and data freshness" },
            { href: `${SITE}/api/v1/health`, title: "Status" },
          ],
          title: "Smarter Capture Camera Configuration API",
          version: API_VERSION,
        },
        {
          anchor: `${SITE}/mcp`,
          title: "Smarter Capture MCP server (Streamable HTTP, read-only tools)",
          "service-doc": [{ href: `${SITE}/ai`, type: "text/html" }],
        },
      ],
    },
    {
      headers: {
        "content-type": "application/linkset+json",
        "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "access-control-allow-origin": "*",
      },
    },
  );
}
