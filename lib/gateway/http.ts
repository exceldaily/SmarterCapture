// HTTP plumbing shared by every /api/v1 route: request ids, consistent error
// envelopes, CORS for a public read-only API, cache headers, payload guards
// and a best-effort rate limiter.

import { NextResponse } from "next/server";
import { API_VERSION, DATA_VERSION } from "./core";

export type AgentIdentityKind = "anonymous" | "api_key" | "oauth_client" | "verified_signed_agent";

/**
 * Agent identity abstraction. v1 of the gateway is public and read-only, so
 * every caller is `anonymous`; the shape exists so keys/OAuth/signed-agent
 * recognition can be added without reshaping the request path.
 */
export interface AgentIdentity {
  kind: AgentIdentityKind;
  id: string | null;
}

export function identify(): AgentIdentity {
  return { kind: "anonymous", id: null };
}

export function requestId() {
  return "req_" + crypto.randomUUID().replace(/-/g, "").slice(0, 20);
}

const COMMON_HEADERS = {
  "x-api-version": API_VERSION,
  "x-data-version": DATA_VERSION,
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type, accept",
};

export function ok(
  body: unknown,
  rid: string,
  init?: { cache?: "static" | "none"; status?: number; etag?: string },
) {
  const headers: Record<string, string> = {
    ...COMMON_HEADERS,
    "x-request-id": rid,
    "cache-control":
      init?.cache === "static"
        ? "public, s-maxage=3600, stale-while-revalidate=86400"
        : "no-store",
  };
  if (init?.etag) headers.etag = init.etag;
  return NextResponse.json(body, { status: init?.status ?? 200, headers });
}

export function fail(rid: string, status: number, code: string, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json(
    { error: { code, message, request_id: rid, ...extra } },
    { status, headers: { ...COMMON_HEADERS, "x-request-id": rid, "cache-control": "no-store" } },
  );
}

export function preflight() {
  return new NextResponse(null, { status: 204, headers: COMMON_HEADERS });
}

/** Reject oversized agent payloads before parsing. */
export const MAX_BODY_BYTES = 16 * 1024;

export async function readJsonBody(request: Request, rid: string): Promise<{ body?: unknown; error?: NextResponse }> {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > MAX_BODY_BYTES) {
    return { error: fail(rid, 413, "payload_too_large", `Request bodies are limited to ${MAX_BODY_BYTES} bytes.`) };
  }
  let text: string;
  try {
    text = await request.text();
  } catch {
    return { error: fail(rid, 400, "unreadable_body", "The request body could not be read.") };
  }
  if (text.length > MAX_BODY_BYTES) {
    return { error: fail(rid, 413, "payload_too_large", `Request bodies are limited to ${MAX_BODY_BYTES} bytes.`) };
  }
  try {
    return { body: JSON.parse(text) };
  } catch {
    return { error: fail(rid, 400, "invalid_json", "The request body is not valid JSON.") };
  }
}

// ---------------------------------------------------------------------------
// Rate limiting — honest scope statement:
// This is a per-instance in-memory token bucket. On serverless it limits per
// warm instance, not globally; it exists to blunt floods and accidental
// loops, not as billing-grade enforcement. Distributed limiting is a
// documented deferral until the API has authenticated tiers.
// ---------------------------------------------------------------------------

const BUCKET_CAPACITY = 60; // requests
const REFILL_PER_SECOND = 1; // per client
const buckets = new Map<string, { tokens: number; at: number }>();

export function rateLimit(request: Request, rid: string): NextResponse | null {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const now = Date.now();
  const bucket = buckets.get(ip) ?? { tokens: BUCKET_CAPACITY, at: now };
  bucket.tokens = Math.min(BUCKET_CAPACITY, bucket.tokens + ((now - bucket.at) / 1000) * REFILL_PER_SECOND);
  bucket.at = now;
  if (bucket.tokens < 1) {
    buckets.set(ip, bucket);
    logAgentEvent(request, rid, "rate_limited");
    return fail(rid, 429, "rate_limited", "Too many requests. Steady state allowance is 60/minute per client.", {
      retry_after_seconds: 10,
    });
  }
  bucket.tokens -= 1;
  buckets.set(ip, bucket);
  if (buckets.size > 10_000) buckets.clear(); // memory guard
  return null;
}

// ---------------------------------------------------------------------------
// Agent-aware structured logging (privacy-safe: no IPs stored, UA classified
// into coarse buckets, "unknown" is a valid class). Vercel captures stdout.
// ---------------------------------------------------------------------------

const AGENT_PATTERNS: Array<[RegExp, string]> = [
  [/gptbot/i, "openai-training"],
  [/oai-searchbot/i, "openai-search"],
  [/chatgpt-user/i, "openai-user-browse"],
  [/claudebot/i, "anthropic-index"],
  [/claude-web|claude-user/i, "anthropic-user-browse"],
  [/perplexitybot/i, "perplexity"],
  [/google-extended/i, "google-training"],
  [/googlebot/i, "googlebot"],
  [/bingbot/i, "bingbot"],
  [/ccbot/i, "common-crawl"],
  [/bytespider/i, "bytedance"],
  [/curl|wget|python-requests|httpx|node-fetch|undici/i, "script"],
  [/bot|crawler|spider/i, "unclassified-bot"],
];

export function classifyAgent(userAgent: string | null): string {
  if (!userAgent) return "unknown";
  for (const [re, label] of AGENT_PATTERNS) if (re.test(userAgent)) return label;
  if (/mozilla/i.test(userAgent)) return "browser-or-agent";
  return "unknown";
}

export function logAgentEvent(request: Request, rid: string, event: string, extra?: Record<string, unknown>) {
  try {
    const url = new URL(request.url);
    console.log(
      JSON.stringify({
        t: new Date().toISOString(),
        kind: "gateway",
        event,
        rid,
        path: url.pathname,
        agent_class: classifyAgent(request.headers.get("user-agent")),
        ...extra,
      }),
    );
  } catch {
    // logging must never break a request
  }
}
