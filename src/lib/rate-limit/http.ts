import "server-only";

import { NextResponse } from "next/server";

import type { RateLimitResult } from "./core";

export const RATE_LIMIT_MESSAGE = "Too many requests. Please slow down and try again shortly.";

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.resetAt),
  };

  if (!result.allowed) {
    headers["Retry-After"] = String(result.retryAfterSeconds);
  }

  return headers;
}

export function tooManyRequestsJson(result: RateLimitResult, message = RATE_LIMIT_MESSAGE) {
  return NextResponse.json(
    { success: false, error: message },
    { status: 429, headers: rateLimitHeaders(result) },
  );
}

export function tooManyRequestsPage(result: RateLimitResult) {
  const body = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Too many requests</title>
<style>
  :root { color-scheme: light dark; }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center;
    padding: 2rem; text-align: center;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    background: #fafaf9; color: #1c1917;
  }
  main { max-width: 32rem; }
  h1 { font-size: 1.5rem; margin: 0 0 0.75rem; letter-spacing: -0.02em; }
  p { margin: 0 0 1.5rem; line-height: 1.6; color: #57534e; }
  a {
    display: inline-block; padding: 0.625rem 1.25rem; border-radius: 0.5rem;
    background: #1c1917; color: #fafaf9; text-decoration: none; font-weight: 500;
  }
  @media (prefers-color-scheme: dark) {
    body { background: #0c0a09; color: #fafaf9; }
    p { color: #a8a29e; }
    a { background: #fafaf9; color: #0c0a09; }
  }
</style>
</head>
<body>
<main>
  <h1>Too many requests</h1>
  <p>You&rsquo;ve made a lot of requests in a short time. Please wait about ${result.retryAfterSeconds} second${result.retryAfterSeconds === 1 ? "" : "s"} and try again.</p>
  <a href="/">Back to safety</a>
</main>
</body>
</html>`;

  return new NextResponse(body, {
    status: 429,
    headers: {
      ...rateLimitHeaders(result),
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export function isServerActionRequest(request: Request): boolean {
  return request.headers.has("next-action");
}

export function isPrefetchRequest(request: Request): boolean {
  return request.headers.get("next-router-prefetch") === "1";
}

export function prefersJson(request: Request, pathname: string): boolean {
  if (pathname.startsWith("/api/")) return true;
  if (isServerActionRequest(request)) return true;
  if (request.headers.get("rsc") === "1") return true;

  const accept = request.headers.get("accept") ?? "";
  return accept !== "" && !accept.includes("text/html") && !accept.includes("*/*");
}
