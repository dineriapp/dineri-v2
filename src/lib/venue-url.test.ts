import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import {
  hostnameOf,
  isVenueMode,
  venueDisplayUrl,
  venuePath,
  venueSiteUrl,
  venueUrl,
} from "./venue-url";

const ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL };
});

const setEnv = (overrides: Record<string, string | undefined>) => {
  process.env = { ...ORIGINAL, ...overrides };
};

describe("single-host mode", () => {
  it("is the default when NEXT_PUBLIC_VENUE_SITE_URL is unset", () => {
    setEnv({
      NEXT_PUBLIC_VENUE_SITE_URL: undefined,
      NEXT_PUBLIC_BETTER_AUTH_URL: "https://dineri.app",
    });
    assert.equal(isVenueMode(), false);
    assert.equal(venueSiteUrl(), null);
  });

  it("keeps the /r/ prefix and the platform origin - today's URLs, unchanged", () => {
    setEnv({
      NEXT_PUBLIC_VENUE_SITE_URL: undefined,
      NEXT_PUBLIC_BETTER_AUTH_URL: "https://dineri.app",
    });
    assert.equal(venuePath("food-mac"), "/r/food-mac");
    assert.equal(venuePath("food-mac", "/menu"), "/r/food-mac/menu");
    assert.equal(venueUrl("food-mac", "menu"), "https://dineri.app/r/food-mac/menu");
  });

  it("treats a blank value as unset", () => {
    setEnv({
      NEXT_PUBLIC_VENUE_SITE_URL: "   ",
      NEXT_PUBLIC_BETTER_AUTH_URL: "https://dineri.app",
    });
    assert.equal(isVenueMode(), false);
  });
});

describe("venue mode", () => {
  it("puts the slug at the root of the venue host", () => {
    setEnv({ NEXT_PUBLIC_VENUE_SITE_URL: "https://dine.bio/" });
    assert.equal(venueSiteUrl(), "https://dine.bio");
    assert.equal(venuePath("food-mac"), "/food-mac");
    assert.equal(venuePath("food-mac", "/reserve"), "/food-mac/reserve");
    assert.equal(venueUrl("food-mac"), "https://dine.bio/food-mac");
    assert.equal(venueUrl("food-mac", "menu"), "https://dine.bio/food-mac/menu");
  });

  it("encodes the slug", () => {
    setEnv({ NEXT_PUBLIC_VENUE_SITE_URL: "https://dine.bio" });
    assert.equal(venuePath("café bar"), "/caf%C3%A9%20bar");
  });

  it("refuses localhost or plain http in production", () => {
    for (const bad of ["http://localhost:3000", "http://dine.bio"]) {
      setEnv({ NEXT_PUBLIC_VENUE_SITE_URL: bad, NODE_ENV: "production" });
      assert.throws(() => venueSiteUrl(), /NEXT_PUBLIC_VENUE_SITE_URL/, bad);
    }
  });

  it("allows localhost outside production", () => {
    setEnv({ NEXT_PUBLIC_VENUE_SITE_URL: "http://localhost:3001", NODE_ENV: "development" });
    assert.equal(venueSiteUrl(), "http://localhost:3001");
  });
});

describe("hostnameOf", () => {
  it("extracts a lower-case hostname without the port", () => {
    assert.equal(hostnameOf("https://Dine.BIO:443/x"), "dine.bio");
    assert.equal(hostnameOf(null), "");
    assert.equal(hostnameOf("not a url"), "");
  });
});

describe("venueDisplayUrl", () => {
  it("is the venue URL without its scheme, for address-bar mockups", () => {
    setEnv({ NEXT_PUBLIC_VENUE_SITE_URL: "https://dine.bio" });
    assert.equal(venueDisplayUrl("food-mac"), "dine.bio/food-mac");
    assert.equal(venueDisplayUrl("food-mac", "/menu"), "dine.bio/food-mac/menu");
  });

  it("gives the prefix a merchant types their slug after", () => {
    setEnv({ NEXT_PUBLIC_VENUE_SITE_URL: "https://dine.bio" });
    assert.equal(venueDisplayUrl(""), "dine.bio/");
    setEnv({
      NEXT_PUBLIC_VENUE_SITE_URL: undefined,
      NEXT_PUBLIC_BETTER_AUTH_URL: "https://dineri.app",
    });
    assert.equal(venueDisplayUrl(""), "dineri.app/r/");
  });
});
