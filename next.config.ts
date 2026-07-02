import type { NextConfig } from "next";

// CSP is set per-request in middleware.ts (nonce required for next-themes inline script).
// These static headers apply to all routes as a baseline; middleware overrides them on
// dynamic routes where the nonce-bearing CSP header is set.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // The extension download route zips the extension/ directory at runtime;
  // without this the files are not traced into the serverless bundle.
  outputFileTracingIncludes: {
    "/api/extension/download": ["./extension/**/*"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
