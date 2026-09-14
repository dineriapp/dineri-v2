/**
 * Social link validation.
 *
 * The URL branch used to accept any well-formed domain, so a venue's own
 * website pasted into the Facebook field validated, saved, and then rendered as
 * the Facebook icon linking off-platform. Two rows in production had already
 * done this. Handles are unchanged - only pasted links are checked against the
 * platform they were pasted into.
 *
 * Run with:
 *   npx tsx --test "src/app/(dashboard)/dashboard/(with-sidebar)/settings/social/schema.test.ts"
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { SocialLinksSchema } from "./schema";

type Field = "instagram" | "facebook" | "tiktok" | "x_twitter" | "youtube" | "linkedin";

const accepts = (field: Field, value: string) =>
  SocialLinksSchema.safeParse({ [field]: value }).success;

test("the reported bug: another site's URL in a social field is refused", () => {
  assert.equal(accepts("facebook", "https://my-restaurant.com"), false);
  assert.equal(accepts("facebook", "https://my-restaurant.com/facebook"), false);
  assert.equal(accepts("linkedin", "https://shumail.dev"), false);
  assert.equal(accepts("tiktok", "https://tailwindcss.com/brand"), false);
});

test("one platform's URL is refused in another platform's field", () => {
  assert.equal(accepts("instagram", "https://facebook.com/me"), false);
  assert.equal(accepts("x_twitter", "https://instagram.com/me"), false);
  assert.equal(accepts("youtube", "https://linkedin.com/company/me"), false);
});

test("handles still work exactly as they did", () => {
  assert.equal(accepts("facebook", "myvenue"), true);
  assert.equal(accepts("instagram", "dineri.app"), true, "dots are legal in a handle");
  assert.equal(accepts("tiktok", "my_venue-01"), true);
  assert.equal(accepts("youtube", ""), true, "empty clears the field");

  assert.equal(accepts("facebook", "my venue"), false);
  assert.equal(accepts("facebook", "my@venue"), false);
});

test("genuine profile links are accepted, with or without a scheme", () => {
  const good: [Field, string][] = [
    ["facebook", "https://facebook.com/myvenue"],
    ["facebook", "https://www.facebook.com/myvenue"],
    ["facebook", "facebook.com/myvenue"],
    ["facebook", "https://fb.me/myvenue"],
    ["instagram", "https://instagram.com/myvenue"],
    ["tiktok", "https://www.tiktok.com/@myvenue"],
    ["x_twitter", "https://x.com/myvenue"],
    ["x_twitter", "https://twitter.com/myvenue"],
    ["youtube", "https://youtube.com/@myvenue"],
    ["youtube", "https://youtu.be/abc123"],
    ["linkedin", "https://linkedin.com/company/myvenue"],
  ];
  for (const [field, value] of good) {
    assert.equal(accepts(field, value), true, `${field} should accept ${value}`);
  }
});

test("platform subdomains are accepted", () => {
  assert.equal(accepts("facebook", "https://m.facebook.com/myvenue"), true);
  assert.equal(accepts("facebook", "https://de-de.facebook.com/myvenue"), true);
  assert.equal(accepts("tiktok", "https://vm.tiktok.com/ZMabc/"), true);
  assert.equal(accepts("youtube", "https://music.youtube.com/channel/abc"), true);
});

test("lookalike hosts do not slip through", () => {
  // The check is anchored to a dot boundary, so neither a prefix nor a
  // deeper-domain suffix can impersonate the real host.
  assert.equal(accepts("facebook", "https://notfacebook.com/me"), false);
  assert.equal(accepts("facebook", "https://facebook.com.evil.test/me"), false);
  assert.equal(accepts("facebook", "https://evil.test/facebook.com"), false);
  assert.equal(accepts("instagram", "https://instagram.com.attacker.test/x"), false);
});

test("link shorteners that can wrap outbound links are refused", () => {
  assert.equal(accepts("x_twitter", "https://t.co/abc"), false);
  assert.equal(accepts("linkedin", "https://lnkd.in/abc"), false);
});

test("a bare domain is not a profile", () => {
  assert.equal(accepts("facebook", "https://facebook.com"), false);
  assert.equal(accepts("facebook", "https://facebook.com/"), false);
  assert.equal(accepts("instagram", "instagram.com/"), false);
});

test("only http and https are accepted", () => {
  assert.equal(accepts("facebook", "javascript://facebook.com/%0aalert(1)"), false);
  assert.equal(accepts("facebook", "ftp://facebook.com/x"), false);
  assert.equal(accepts("facebook", "http://facebook.com/myvenue"), true);
});

test("every field is validated, not just the ones with a known bug", () => {
  const fields: Field[] = ["instagram", "facebook", "tiktok", "x_twitter", "youtube", "linkedin"];
  for (const field of fields) {
    assert.equal(
      accepts(field, "https://unrelated-site.test/profile"),
      false,
      `${field} must reject an off-platform link`,
    );
  }
});

test("values are trimmed before they are judged", () => {
  assert.equal(accepts("facebook", "  https://facebook.com/myvenue  "), true);
  assert.equal(accepts("facebook", "   "), true, "whitespace only is an empty field");
});

test("whatsapp takes a number, not a handle or a link", () => {
  const ok = (v: string) => SocialLinksSchema.safeParse({ whatsapp: v }).success;

  assert.equal(ok(""), true, "optional");
  assert.equal(ok("+92 300 1234567"), true);
  assert.equal(ok("923001234567"), true);

  // A local number saves fine but dead-ends on wa.me, so it is refused here.
  assert.equal(ok("03001234567"), false);
  // The other fields take handles and URLs; this one must not.
  assert.equal(ok("@myrestaurant"), false);
  assert.equal(ok("https://wa.me/923001234567"), false);
  assert.equal(ok("wa.me/923001234567"), false);
});

test("whatsapp is independent of the other social fields", () => {
  const parsed = SocialLinksSchema.safeParse({
    whatsapp: "+92 300 1234567",
    instagram: "myrestaurant",
  });
  assert.equal(parsed.success, true);
});
