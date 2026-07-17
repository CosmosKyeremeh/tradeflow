import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Only the browser-side document upload (DocumentsSection.tsx) talks to
// Supabase directly from the client; everything else goes through Server
// Actions. That's the one origin connect-src needs beyond 'self'.
function supabaseOrigin() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return "";
  }
}

// No nonce-based strict CSP here: Next's streamed RSC payload and font
// optimization both rely on inline <script>/<style> tags, so script-src and
// style-src need 'unsafe-inline' regardless. A nonce (via proxy.ts) would
// close that gap but forces every route into dynamic rendering -- a bigger,
// riskier change than this pass warrants. What's below still blocks framing,
// restricts fetch/asset origins, and stops arbitrary third-party script/object
// loading.
function cspHeader() {
  const connectExtra = [supabaseOrigin(), isDev ? "ws://localhost:*" : ""]
    .filter(Boolean)
    .join(" ");

  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    `connect-src 'self' ${connectExtra}`.trim(),
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader() },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          ...(isDev
            ? []
            : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
        ],
      },
      {
        // Never let a CDN/proxy cache the service worker itself -- clients
        // must always fetch the latest version to pick up updates.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
