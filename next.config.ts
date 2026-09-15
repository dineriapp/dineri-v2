import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const isProduction = process.env.NODE_ENV === "production";

const s3Origin =
  process.env.AWS_BUCKET_NAME && process.env.AWS_BUCKET_REGION
    ? `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com`
    : null;

function contentSecurityPolicy(): string {
  const imageSources = [
    "'self'",
    "data:",
    "blob:",
    s3Origin,
    "https://images.unsplash.com",
    "https://img.youtube.com",
    "https://lh3.googleusercontent.com",
  ].filter(Boolean);

  return [
    "default-src 'self'",
    `img-src ${imageSources.join(" ")}`,
    "font-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline'",
    `connect-src ${["'self'", s3Origin].filter(Boolean).join(" ")}`,
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join("; ");
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy() },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [{ source: "/start", destination: "/sign-up", permanent: false }];
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
