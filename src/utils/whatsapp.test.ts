import assert from "node:assert/strict";
import { test } from "node:test";

import { normaliseWhatsappNumber, whatsappUrl } from "./whatsapp";

test("the separators people type are stripped", () => {
  for (const input of [
    "+92 300 1234567",
    "+92-300-1234567",
    "+92 (300) 1234567",
    "  +923001234567  ",
    "923001234567",
    "92.300.1234567",
    "92/300/1234567",
  ]) {
    assert.equal(normaliseWhatsappNumber(input), "923001234567", input);
  }
});

test("a local number with a trunk zero is refused", () => {
  assert.equal(normaliseWhatsappNumber("03001234567"), null);
  assert.equal(normaliseWhatsappNumber("0300 123 4567"), null);
  assert.equal(normaliseWhatsappNumber("+0300123456"), null);
});

test("anything that is not a number is refused", () => {
  for (const input of [
    "https://wa.me/923001234567",
    "wa.me/923001234567",
    "@myrestaurant",
    "call me",
    "+92 300 CALLNOW",
    "++923001234567",
    "92 300 12345 67x",
  ]) {
    assert.equal(normaliseWhatsappNumber(input), null, input);
  }
});

test("lengths outside E.164 are refused", () => {
  assert.equal(normaliseWhatsappNumber("1234567"), null, "7 digits is too short");
  assert.equal(normaliseWhatsappNumber("12345678"), "12345678", "8 digits is the floor");
  assert.equal(normaliseWhatsappNumber("123456789012345"), "123456789012345", "15 is the ceiling");
  assert.equal(normaliseWhatsappNumber("1234567890123456"), null, "16 digits is too long");
});

test("empty and missing values are not an error", () => {
  assert.equal(normaliseWhatsappNumber(""), null);
  assert.equal(normaliseWhatsappNumber("   "), null);
  assert.equal(normaliseWhatsappNumber(null), null);
  assert.equal(normaliseWhatsappNumber(undefined), null);
});

test("the link is wa.me with bare digits", () => {
  assert.equal(whatsappUrl("+92 300 1234567"), "https://wa.me/923001234567");
  const url = whatsappUrl("+44 (0) 7700 900123");
  assert.ok(url === null || /^https:\/\/wa\.me\/\d+$/.test(url), url ?? "null");
});

test("an unusable stored value yields no link rather than a broken one", () => {
  assert.equal(whatsappUrl("03001234567"), null);
  assert.equal(whatsappUrl("not a number"), null);
  assert.equal(whatsappUrl(null), null);
});
