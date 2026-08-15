import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function unauthorized() {
  return new Response("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Smarter Capture Admin", charset="UTF-8"' },
  });
}

export function proxy(request: NextRequest) {
  const expectedUser = process.env.ADMIN_ACCESS_USER;
  const expectedPassword = process.env.ADMIN_ACCESS_PASSWORD;

  // A deployment with no admin credentials must not expose sourcing economics.
  if (!expectedUser || !expectedPassword) return new Response("Not found", { status: 404 });

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Basic ")) return unauthorized();

  try {
    const [user, ...passwordParts] = atob(authorization.slice(6)).split(":");
    const password = passwordParts.join(":");
    if (user !== expectedUser || password !== expectedPassword) return unauthorized();
  } catch {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = { matcher: "/admin/:path*" };
