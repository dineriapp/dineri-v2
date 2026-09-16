import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { routeRequest, type HostRouterConfig } from "./host-router";

const DUAL: HostRouterConfig = {
  platformHost: "dineri.app",
  platformOrigin: "https://dineri.app",
  venueHost: "dine.bio",
  venueOrigin: "https://dine.bio",
};

const SINGLE: HostRouterConfig = {
  platformHost: "dineri.app",
  platformOrigin: "https://dineri.app",
  venueHost: null,
  venueOrigin: null,
};

const route = (host: string, path: string, search = "", config = DUAL) =>
  routeRequest(host, path, search, config);

describe("venue host", () => {
  it("rewrites a slug at the root to the /r/ route", () => {
    assert.deepEqual(route("dine.bio", "/food-mac"), { kind: "rewrite", to: "/r/food-mac" });
  });

  it("rewrites every venue sub-page", () => {
    for (const sub of [
      "/menu",
      "/menu/order/success",
      "/reserve",
      "/reserve/success",
      "/track-order",
    ]) {
      assert.deepEqual(
        route("dine.bio", `/food-mac${sub}`),
        { kind: "rewrite", to: `/r/food-mac${sub}` },
        sub,
      );
    }
  });

  it("keeps the query string through the rewrite", () => {
    assert.deepEqual(route("dine.bio", "/food-mac", "?utm_source=qr&utm_medium=qr"), {
      kind: "rewrite",
      to: "/r/food-mac?utm_source=qr&utm_medium=qr",
    });
  });

  it("tolerates a trailing slash", () => {
    assert.deepEqual(route("dine.bio", "/food-mac/menu/"), {
      kind: "rewrite",
      to: "/r/food-mac/menu",
    });
  });

  it("sends the bare domain to the platform, permanently", () => {
    assert.deepEqual(route("dine.bio", "/"), {
      kind: "redirect",
      to: "https://dineri.app/",
      status: 301,
    });
  });

  it("sends platform paths to the platform, temporarily", () => {
    for (const path of ["/pricing", "/dashboard", "/sign-in"]) {
      assert.deepEqual(
        route("dine.bio", path),
        { kind: "redirect", to: `https://dineri.app${path}`, status: 302 },
        path,
      );
    }
  });

  it("never rewrites a reserved word into a venue page", () => {
    for (const reserved of ["api", "admin", "dashboard", "sign-in", "images", "_next"]) {
      assert.notEqual(
        route("dine.bio", `/${reserved}`).kind,
        "rewrite",
        `${reserved} must not be treated as a slug`,
      );
    }
  });

  it("passes assets, metadata files and APIs straight through", () => {
    for (const path of [
      "/_next/static/chunks/main.js",
      "/api/qr/scan/abc",
      "/robots.txt",
      "/sitemap.xml",
      "/favicon.ico",
      "/images/logo.png",
    ]) {
      assert.deepEqual(route("dine.bio", path), { kind: "next" }, path);
    }
  });

  it("does not rewrite an unknown venue sub-page into a 404 under /r/", () => {
    const d = route("dine.bio", "/food-mac/nope");
    assert.equal(d.kind, "redirect");
    assert.equal(d.status, 302);
  });

  it("canonicalises a legacy /r/ path pasted onto the venue host", () => {
    assert.deepEqual(route("dine.bio", "/r/food-mac/menu", "?a=1"), {
      kind: "redirect",
      to: "https://dine.bio/food-mac/menu?a=1",
      status: 301,
    });
  });

  it("ignores the port and case of the host header", () => {
    assert.equal(route("DINE.BIO:443", "/food-mac").kind, "rewrite");
  });
});

describe("platform host", () => {
  it("redirects every /r/ page to its venue-host twin, permanently, query intact", () => {
    assert.deepEqual(route("dineri.app", "/r/food-mac/menu", "?utm_source=qr"), {
      kind: "redirect",
      to: "https://dine.bio/food-mac/menu?utm_source=qr",
      status: 301,
    });
  });

  it("drops a trailing slash from the redirect target", () => {
    assert.deepEqual(route("dineri.app", "/r/food-mac/"), {
      kind: "redirect",
      to: "https://dine.bio/food-mac",
      status: 301,
    });
  });

  it("leaves platform pages alone", () => {
    assert.deepEqual(route("dineri.app", "/pricing"), { kind: "next" });
    assert.deepEqual(route("dineri.app", "/dashboard/menu"), { kind: "next" });
  });
});

describe("unknown host", () => {
  it("is treated as the platform and never redirected", () => {
    assert.deepEqual(route("127.0.0.1:3000", "/api/health"), { kind: "next" });
    assert.deepEqual(route("dineri-website-abc123", "/"), { kind: "next" });
  });
});

describe("single-host mode (NEXT_PUBLIC_VENUE_SITE_URL unset)", () => {
  it("serves /r/ pages on the platform, exactly as before", () => {
    assert.deepEqual(route("dineri.app", "/r/food-mac", "", SINGLE), { kind: "next" });
    assert.deepEqual(route("dineri.app", "/r/food-mac/menu", "", SINGLE), { kind: "next" });
  });

  it("never redirects anything", () => {
    for (const path of ["/", "/r/food-mac", "/pricing"]) {
      assert.notEqual(route("dine.bio", path, "", SINGLE).kind, "redirect", path);
      assert.notEqual(route("dineri.app", path, "", SINGLE).kind, "redirect", path);
    }
  });
});
