import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

function logoImageHosts(): string[] {
  return (process.env.LOGO_IMAGE_HOSTS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function logoImgSrc(): string[] {
  return logoImageHosts().map((host) => (/^https?:\/\//i.test(host) ? host : `https://${host}`));
}

function logoRemotePatterns(): { protocol: "http" | "https"; hostname: string }[] {
  return logoImgSrc().flatMap((source) => {
    const match = source.match(/^(https?):\/\/([^/]+)/i);
    if (!match) {
      return [];
    }
    return [
      {
        protocol: match[1].toLowerCase() as "http" | "https",
        hostname: match[2],
      },
    ];
  });
}

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  ["img-src 'self' data: blob: https: http:", ...logoImgSrc()].join(" "),
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  ...(isProduction
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  poweredByHeader: false,
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "*.ngrok-free.dev",
    "*.ngrok-free.app",
    "*.ngrok.app",
    "*.ngrok.io",
  ],
  images: {
    remotePatterns: logoRemotePatterns(),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    const apiUrl = process.env.API_URL?.replace(/\/$/, "");
    if (!apiUrl) {
      return [];
    }
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
