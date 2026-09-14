/**
 * Traffic source attribution.
 *
 * Every event recorded before this was `direct` (4,796 of 4,796): the QR and
 * social markers were never appended by anything, and the referrer check only
 * looked for Google. These lock in the detection chain and the spoofing shapes
 * that must not slip through.
 *
 * Run with:
 *   npx tsx --test src/utils/trafic-source.test.ts
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { normaliseSource, resolveTrafficSource, type TrafficSignals } from "./trafic-source";
import { QR_TAGS, SHARE_TAGS, withUtm } from "@/lib/analytics/utm";

const SITE_HOST = "dineri.app";

function detect(options: { query?: string; referer?: string; ua?: string; host?: string } = {}) {
  const signals: TrafficSignals = {
    searchParams: new URLSearchParams(options.query ?? ""),
    referer: options.referer ?? null,
    userAgent: options.ua ?? null,
    host: options.host ?? SITE_HOST,
  };
  return resolveTrafficSource(signals);
}

const ref = (host: string) => `https://${host}/some/path?x=1`;

test("no referrer at all is direct", () => {
  assert.equal(detect(), "direct");
});

test("search engine referrers", () => {
  assert.equal(detect({ referer: ref("www.google.com") }), "google");
  assert.equal(detect({ referer: ref("google.com") }), "google");
  assert.equal(detect({ referer: ref("google.co.uk") }), "google", "ccTLD");
  assert.equal(detect({ referer: ref("www.bing.com") }), "bing");
  assert.equal(detect({ referer: ref("duckduckgo.com") }), "duckduckgo");
  assert.equal(detect({ referer: ref("search.yahoo.com") }), "yahoo");
});

test("social referrers", () => {
  assert.equal(detect({ referer: ref("facebook.com") }), "facebook");
  assert.equal(detect({ referer: ref("www.facebook.com") }), "facebook");
  assert.equal(detect({ referer: ref("l.facebook.com") }), "facebook", "link shim");
  assert.equal(detect({ referer: ref("lm.facebook.com") }), "facebook", "mobile link shim");
  assert.equal(detect({ referer: ref("instagram.com") }), "instagram");
  assert.equal(detect({ referer: ref("l.instagram.com") }), "instagram");
  assert.equal(detect({ referer: ref("x.com") }), "x");
  assert.equal(detect({ referer: ref("twitter.com") }), "x", "legacy domain");
  assert.equal(detect({ referer: ref("t.co") }), "x", "shortener");
  assert.equal(detect({ referer: ref("www.tiktok.com") }), "tiktok");
  assert.equal(detect({ referer: ref("linkedin.com") }), "linkedin");
  assert.equal(detect({ referer: ref("lnkd.in") }), "linkedin");
  assert.equal(detect({ referer: ref("reddit.com") }), "reddit");
  assert.equal(detect({ referer: ref("out.reddit.com") }), "reddit");
  assert.equal(detect({ referer: ref("youtube.com") }), "youtube");
  assert.equal(detect({ referer: ref("youtu.be") }), "youtube");
  assert.equal(detect({ referer: ref("pinterest.com") }), "pinterest");
  assert.equal(detect({ referer: ref("pinterest.co.uk") }), "pinterest");
  assert.equal(detect({ referer: ref("snapchat.com") }), "snapchat");
});

test("lookalike hosts do not spoof a source", () => {
  // Anchored on a dot boundary, so neither a prefix nor a deeper domain wins.
  assert.equal(detect({ referer: ref("notfacebook.com") }), "direct");
  assert.equal(detect({ referer: ref("facebook.com.evil.test") }), "direct");
  assert.equal(detect({ referer: ref("notgoogle.com") }), "direct");
  assert.equal(detect({ referer: ref("google.com.evil.test") }), "direct");
  assert.equal(detect({ referer: ref("mygoogle.io") }), "direct");
});

test("unknown referrer domains fall through to direct", () => {
  assert.equal(detect({ referer: ref("some-blog.example") }), "direct");
});

test("in-app browser user agents", () => {
  const whatsapp =
    "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36 WhatsApp/2.24.1.78 A";
  assert.equal(detect({ ua: whatsapp }), "whatsapp");

  const instagram =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 Instagram 302.0.0.23.113";
  assert.equal(detect({ ua: instagram }), "instagram");

  const facebook =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 [FBAN/FBIOS;FBAV/440.0.0.32.117]";
  assert.equal(detect({ ua: facebook }), "facebook");

  const tiktok =
    "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 BytedanceWebview/d8a21c6";
  assert.equal(detect({ ua: tiktok }), "tiktok");

  const telegram = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Telegram-Android/10.5.0";
  assert.equal(detect({ ua: telegram }), "telegram");
});

test("Messenger is not mistaken for Facebook", () => {
  // Messenger's UA also carries FBAN, so order matters.
  const messenger =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 [FBAN/MessengerForiOS;FBAV/440.0]";
  assert.equal(detect({ ua: messenger }), "messenger");
});

test("an ordinary browser is never guessed as an app", () => {
  // The iOS hand-off case: WhatsApp opens Safari and the marker is gone. That
  // must read as direct, never as WhatsApp.
  const safari =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1";
  assert.equal(detect({ ua: safari }), "direct");

  const bot = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
  assert.equal(detect({ ua: bot }), "direct");

  assert.equal(detect({ ua: "" }), "direct");
});

test("utm_source is honoured, including sources we do not know", () => {
  assert.equal(detect({ query: "utm_source=whatsapp" }), "whatsapp");
  assert.equal(detect({ query: "utm_source=facebook&utm_medium=social" }), "facebook");
  assert.equal(detect({ query: "utm_source=newsletter&utm_medium=email" }), "newsletter");
  assert.equal(detect({ query: "utm_source=Partner_Site" }), "partner_site", "lowercased");
  assert.equal(detect({ query: "utm_source=%20qr%20" }), "qr", "trimmed");
});

test("utm_source beats referrer and user agent", () => {
  assert.equal(
    detect({ query: "utm_source=newsletter", referer: ref("www.google.com") }),
    "newsletter",
  );
  assert.equal(
    detect({ query: "utm_source=newsletter", ua: "... WhatsApp/2.24.1.78 A" }),
    "newsletter",
  );
});

test("unusable utm_source falls through instead of being recorded", () => {
  // These would otherwise become Redis hash fields.
  assert.equal(detect({ query: "utm_source=" }), "direct");
  assert.equal(detect({ query: "utm_source=%20%20" }), "direct");
  assert.equal(detect({ query: `utm_source=${"a".repeat(64)}` }), "direct", "too long");
  assert.equal(detect({ query: "utm_source=drop%20table" }), "direct", "illegal characters");
  assert.equal(detect({ query: "utm_source=../../etc" }), "direct");
  // Falling through still reaches the referrer.
  assert.equal(detect({ query: "utm_source=", referer: ref("reddit.com") }), "reddit");
});

test("internal navigation is not an acquisition channel", () => {
  assert.equal(detect({ referer: `https://${SITE_HOST}/r/food-mac` }), "direct");
  assert.equal(
    detect({ referer: `https://${SITE_HOST}/r/food-mac`, host: `${SITE_HOST}:3000` }),
    "direct",
    "host may carry a port",
  );
  // A different host is still external.
  assert.equal(detect({ referer: ref("reddit.com"), host: SITE_HOST }), "reddit");
});

test("legacy internal markers keep working", () => {
  assert.equal(detect({ query: "qr=true" }), "qr");
  assert.equal(detect({ query: "social=true" }), "social");
  assert.equal(detect({ query: "gclid=abc123" }), "google");
});

test("malformed and empty referrers degrade to direct", () => {
  assert.equal(detect({ referer: "" }), "direct");
  assert.equal(detect({ referer: "not a url" }), "direct");
  assert.equal(detect({ referer: "://broken" }), "direct");
});

test("localhost and development referrers are not a channel", () => {
  assert.equal(
    detect({ referer: "http://localhost:3000/r/test", host: "localhost:3000" }),
    "direct",
  );
  assert.equal(detect({ referer: "http://localhost:3000/r/test", host: "dineri.app" }), "direct");
});

test("normaliseSource rejects what must never reach storage", () => {
  assert.equal(normaliseSource(null), null);
  assert.equal(normaliseSource(undefined), null);
  assert.equal(normaliseSource(""), null);
  assert.equal(normaliseSource("   "), null);
  assert.equal(normaliseSource("a".repeat(33)), null);
  assert.equal(normaliseSource("has space"), null);
  assert.equal(normaliseSource("-leading"), null);
  assert.equal(normaliseSource("WhatsApp"), "whatsapp");
  assert.equal(normaliseSource(" qr "), "qr");
});

test("withUtm tags a plain URL", () => {
  const tagged = new URL(withUtm("https://example.com/r/test", QR_TAGS));
  assert.equal(tagged.searchParams.get("utm_source"), "qr");
  assert.equal(tagged.searchParams.get("utm_medium"), "qr");
  assert.equal(tagged.pathname, "/r/test");
});

test("withUtm preserves existing query parameters", () => {
  const tagged = new URL(withUtm("https://example.com/r/test?foo=bar", SHARE_TAGS));
  assert.equal(tagged.searchParams.get("foo"), "bar");
  assert.equal(tagged.searchParams.get("utm_source"), "social");
  assert.equal(tagged.searchParams.get("utm_medium"), "share");
});

test("withUtm preserves both query and fragment", () => {
  const result = withUtm("https://example.com/r/test?foo=bar#section", QR_TAGS);
  const tagged = new URL(result);
  assert.equal(tagged.searchParams.get("foo"), "bar");
  assert.equal(tagged.searchParams.get("utm_source"), "qr");
  assert.equal(tagged.hash, "#section", "fragment must survive");
});

test("withUtm does not override a campaign the merchant already set", () => {
  const result = withUtm("https://example.com/r/test?utm_source=printed-flyer", QR_TAGS);
  const tagged = new URL(result);
  assert.equal(tagged.searchParams.get("utm_source"), "printed-flyer");
  assert.equal(tagged.searchParams.get("utm_medium"), null);
});

test("withUtm leaves an unparsable URL alone", () => {
  assert.equal(withUtm("not a url", QR_TAGS), "not a url");
});

test("a tagged link resolves back to the source that produced it", () => {
  // The round trip that makes the feature work end to end.
  const shared = new URL(withUtm("https://dineri.app/r/food-mac", SHARE_TAGS));
  assert.equal(
    resolveTrafficSource({
      searchParams: shared.searchParams,
      referer: null,
      userAgent: null,
      host: SITE_HOST,
    }),
    "social",
  );

  const scanned = new URL(withUtm("https://dineri.app/r/food-mac?table=4", QR_TAGS));
  assert.equal(scanned.searchParams.get("table"), "4");
  assert.equal(
    resolveTrafficSource({
      searchParams: scanned.searchParams,
      referer: null,
      userAgent: null,
      host: SITE_HOST,
    }),
    "qr",
  );
});
