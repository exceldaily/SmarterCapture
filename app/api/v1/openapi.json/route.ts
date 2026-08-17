import { NextResponse } from "next/server";
import { openapiSpec } from "@/lib/gateway/openapi";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(openapiSpec, {
    headers: {
      "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "access-control-allow-origin": "*",
    },
  });
}
