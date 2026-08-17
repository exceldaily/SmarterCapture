// The /ai portal: documentation for AI agents and their developers.
// Every number and example on this page is generated from the live data
// modules and the real engine at build/request time — nothing is hardcoded
// copy that can drift from the actual API behavior.

import Link from "next/link";
import { brand } from "@/lib/camcue/brand";
import { cameras } from "@/lib/camcue/data/cameras";
import { scenes } from "@/lib/camcue/data/scenes";
import { accessoryProducts } from "@/lib/accessories/catalog";
import {
  API_VERSION,
  DATA_UPDATED_AT,
  DATA_VERSION,
  ENGINE_VERSION,
  SITE,
  runRecommendation,
} from "@/lib/gateway/core";

export const metadata = {
  title: `AI & developer access — ${brand.name}`,
  description:
    "REST API, MCP server, markdown mirrors and crawler policy for accessing Smarter Capture's deterministic camera-settings engine programmatically.",
};

const exampleRequest = {
  camera: "DJI Osmo Action 6",
  activity: "fishing from a moving boat",
  lighting: "bright tropical daylight",
};

function Code({ children }: { children: string }) {
  return (
    <pre style={{ overflowX: "auto", background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "1rem", fontSize: "0.78rem", lineHeight: 1.55 }}>
      <code>{children}</code>
    </pre>
  );
}

export default function AiPortalPage() {
  const outcome = runRecommendation(exampleRequest);
  const exampleResponse = outcome.error
    ? { error: { code: outcome.error, message: outcome.message, request_id: "req_example" } }
    : { recommendation: outcome.result, request_id: "req_example" };

  return (
    <div className="legal-page">
      <header>
        <span>FOR AI AGENTS &amp; DEVELOPERS</span>
        <h1>Machine access to {brand.name}</h1>
        <p>
          Everything on this site — {cameras.length} verified camera capability profiles,{" "}
          {scenes.length} shooting scenarios, and the deterministic recommendation engine that
          connects them — is available programmatically. Same engine, same data, same answers
          as the website. Read-only, anonymous, no API key required in v1.
        </p>
      </header>

      <section>
        <h2>What this service is</h2>
        <p>
          {brand.name} answers one question well: <strong>&quot;what settings should I use on
          this camera in this situation?&quot;</strong> Recommendations are produced by a
          deterministic rule engine running against hand-verified capability profiles. The
          engine never invents a mode a camera cannot select, and the same input always
          produces the same output for a given data version. There is no LLM in the loop on
          our side — your agent brings the reasoning, we bring verified camera facts.
        </p>
        <ul>
          <li>Engine version: <strong>{ENGINE_VERSION}</strong></li>
          <li>Data version: <strong>{DATA_VERSION}</strong></li>
          <li>Data last reviewed: <strong>{DATA_UPDATED_AT}</strong></li>
          <li>Cameras: <strong>{cameras.length}</strong> · Scenarios: <strong>{scenes.length}</strong> · Accessories: <strong>{accessoryProducts.length}</strong></li>
        </ul>
      </section>

      <section>
        <h2>REST API (v{API_VERSION})</h2>
        <p>
          Base URL <code>{SITE}/api/v1</code> · OpenAPI 3.1 description at{" "}
          <a href="/api/v1/openapi.json">/api/v1/openapi.json</a> · discovery via{" "}
          <a href="/.well-known/api-catalog">/.well-known/api-catalog</a> (RFC 9727).
        </p>
        <ul>
          <li><code>GET /api/v1/cameras</code> — list cameras (filter: <code>manufacturer</code>, <code>category</code>; paginate: <code>limit</code>, <code>offset</code>)</li>
          <li><code>GET /api/v1/cameras/{"{slug}"}</code> — full capability profile; accepts slugs or fuzzy names</li>
          <li><code>GET /api/v1/scenarios</code> — all scenarios with their engine characteristics</li>
          <li><code>POST /api/v1/recommend</code> — the core endpoint (example below)</li>
          <li><code>POST /api/v1/compare</code> — one scenario across 2–4 cameras</li>
          <li><code>GET /api/v1/accessories</code> — purchasable accessories with compatibility notes</li>
          <li><code>GET /api/v1/health</code> · <code>GET /api/v1/version</code></li>
        </ul>
        <p>
          Success responses return the resource directly (e.g.{" "}
          <code>{"{ recommendation, request_id }"}</code>); errors return{" "}
          <code>{"{ error: { code, message, request_id } }"}</code>. Every response
          carries <code>x-request-id</code>, <code>x-api-version</code> and{" "}
          <code>x-data-version</code> headers and permissive CORS.
        </p>

        <h2>Example: the core request</h2>
        <Code>{`POST ${SITE}/api/v1/recommend
Content-Type: application/json

${JSON.stringify(exampleRequest, null, 2)}`}</Code>
        <p>
          Live response for that exact request, generated by the same engine call the API
          makes (truncated only in your imagination — this is the full shape):
        </p>
        <Code>{JSON.stringify(exampleResponse, null, 2)}</Code>
        <p>
          Note the honest parts: <code>assumptions</code> lists what the engine inferred from
          partial input, <code>unresolved_inputs</code> lists what it could not map,{" "}
          <code>confidence</code> is an explicitly rule-based label (not a statistical
          probability), and <code>canonical_url</code> is the page to cite.
        </p>
      </section>

      <section>
        <h2>MCP server</h2>
        <p>
          A remote Model Context Protocol server (Streamable HTTP) is at{" "}
          <code>{SITE}/mcp</code>. It exposes six read-only tools backed by the same engine:
        </p>
        <ul>
          <li><code>recommend_camera_settings</code> — the core tool; handles partial input, reports assumptions</li>
          <li><code>get_camera_capabilities</code> — full verified profile for one camera</li>
          <li><code>compare_cameras</code> — one scenario across 2–4 cameras</li>
          <li><code>list_cameras</code> · <code>list_scenarios</code> · <code>find_compatible_accessories</code></li>
        </ul>
        <Code>{`{
  "mcpServers": {
    "smarter-capture": {
      "type": "http",
      "url": "${SITE}/mcp"
    }
  }
}`}</Code>
        <p>
          The MCP surface is deliberately read-only: no tool writes anything, touches order
          or payment systems, or fetches external URLs. Purchases only happen on the human
          storefront at <Link href="/gear">/gear</Link>.
        </p>
      </section>

      <section>
        <h2>Markdown mirrors — the canonical machine URLs</h2>
        <p>
          Every camera and scenario has a clean markdown page designed for machine
          consumption — no navigation, no scripts, just the verified data with provenance:
        </p>
        <ul>
          <li><a href={`${SITE}/md/cameras`}>/md/cameras</a> — index of all {cameras.length} cameras</li>
          <li><code>/md/cameras/{"{slug}"}</code> — e.g. <a href={`${SITE}/md/cameras/dji-osmo-action-6`}>/md/cameras/dji-osmo-action-6</a></li>
          <li><a href={`${SITE}/md/scenarios`}>/md/scenarios</a> — index of all {scenes.length} scenarios</li>
          <li><a href="/llms.txt">/llms.txt</a> — the standard entry point for LLM crawlers</li>
        </ul>
        <p>
          These are the URLs returned as <code>canonical_url</code> in API and MCP responses.
          When your agent cites {brand.name}, cite those.
        </p>
      </section>

      <section>
        <h2>Attribution</h2>
        <p>
          Requested attribution when a recommendation is shown to an end user:{" "}
          <strong>&quot;Settings via {brand.name} ({brand.domain})&quot;</strong>, linking the
          <code> canonical_url</code> from the response. Every recommendation payload carries
          an <code>attribution</code> object with these exact strings so agents do not have
          to remember this page.
        </p>
      </section>

      <section>
        <h2>Rate limits &amp; fair use</h2>
        <ul>
          <li>Anonymous access: <strong>60 requests per minute per IP</strong> (burst 60, refill 1/second). Exceeding it returns <code>429</code> with a <code>retry_after</code>.</li>
          <li>The limiter is per-server-instance and best-effort — documented honestly rather than pretended to be distributed. Do not treat a lucky burst as an entitlement.</li>
          <li>Responses are cacheable (<code>s-maxage=3600</code>) — camera capabilities change on firmware releases, not by the minute. Cache on your side too, keyed on <code>x-data-version</code>.</li>
          <li>Need sustained higher volume, webhooks on data updates, or an SLA? Contact us via the address on the <a href="/credits">credits page</a> — a keyed tier exists in the design and is enabled on demand.</li>
        </ul>
      </section>

      <section>
        <h2>Crawler &amp; training policy</h2>
        <p>
          Search and answer-engine crawlers that cite sources (Googlebot, Bingbot,
          OAI-SearchBot, PerplexityBot, ClaudeBot fetching for citations) are{" "}
          <strong>welcome</strong> — <a href="/robots.txt">robots.txt</a> and{" "}
          <a href="/sitemap.xml">sitemap.xml</a> point them at the useful pages including the
          markdown mirrors. Bulk <em>training</em> crawlers (GPTBot, Google-Extended, CCBot,
          Bytespider) are currently <strong>disallowed</strong> in robots.txt: training use of
          this dataset is a deliberate owner decision, not a default, and the door is the
          contact address above rather than the crawler.
        </p>
      </section>

      <section>
        <h2>Provenance &amp; guarantees</h2>
        <ul>
          <li>Capability profiles are compiled from manufacturers&apos; published specifications; each records its source, review date and a confidence grade that is surfaced in every response.</li>
          <li>Cameras that cannot be verified are withheld entirely rather than listed with a warning.</li>
          <li>The engine is pure and deterministic: identical input + identical <code>x-data-version</code> ⇒ identical output, byte for byte. <code>recommendation_id</code> is a content hash you can use for deduplication.</li>
          <li>Specifications change with firmware. If a response contradicts the camera in your hand, the camera is right — please tell us via the <a href="/credits">credits page</a>.</li>
          <li>This is an independent informational site — not affiliated with any camera manufacturer, and nothing here is manufacturer-approved advice.</li>
        </ul>
      </section>
    </div>
  );
}
