import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

const isDev = process.env.NODE_ENV === "development";

const connectSrc = [
  "'self'",
  "https://*.supabase.co",
  "wss://*.supabase.co",
  ...(isDev
    ? ["http://127.0.0.1:54321", "ws://127.0.0.1:54321", "http://localhost:54321", "ws://localhost:54321"]
    : []),
].join(" ");

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    // nonce covers next-themes FOUC inline script; 'self' covers Next.js bundles
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export async function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  // Forward nonce to route handlers / layouts via request header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = await updateSession(request, requestHeaders);

  response.headers.set("Content-Security-Policy", csp);
  // Other security headers (also set in next.config.ts for static pages)
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
}

export const config = {
  // Exclude static public PWA assets so Chrome can fetch the manifest and
  // service-worker script unauthenticated (required for installability).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw\\.js|sw-register\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
