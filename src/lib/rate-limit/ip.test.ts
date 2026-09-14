import assert from "node:assert/strict";
import { test } from "node:test";

import {
  proxyTrustConfigFromEnv,
  resolveClientIpWith,
  UNKNOWN_IP,
  UNTRUSTED_IP,
  type ProxyTrustConfig,
} from "./ip";

const h = (init: Record<string, string> = {}) => new Headers(init);

const UNTRUSTED_CONFIG: ProxyTrustConfig = {
  trustProxy: false,
  trustedProxies: 1,
  ipHeader: "x-forwarded-for",
  proxySecretHeader: "x-proxy-auth",
  proxySecret: null,
};

const trusted = (over: Partial<ProxyTrustConfig> = {}): ProxyTrustConfig => ({
  ...UNTRUSTED_CONFIG,
  trustProxy: true,
  ...over,
});

test("C-01: with trust disabled a forged X-Forwarded-For cannot mint a fresh bucket", () => {
  const a = resolveClientIpWith(h({ "x-forwarded-for": "9.9.9.1" }), UNTRUSTED_CONFIG);
  const b = resolveClientIpWith(h({ "x-forwarded-for": "9.9.9.2" }), UNTRUSTED_CONFIG);
  const none = resolveClientIpWith(h(), UNTRUSTED_CONFIG);

  assert.equal(a.bucket, UNTRUSTED_IP);
  assert.equal(a.trusted, false);
  assert.equal(a.bucket, b.bucket);
  assert.equal(a.bucket, none.bucket);
});

test("C-01: with trust disabled x-real-ip is ignored as well", () => {
  const r = resolveClientIpWith(h({ "x-real-ip": "9.9.9.9" }), UNTRUSTED_CONFIG);
  assert.equal(r.bucket, UNTRUSTED_IP);
  assert.equal(r.trusted, false);
});

test("C-01: an unset environment resolves to trust-disabled", () => {
  const config = proxyTrustConfigFromEnv({});
  assert.equal(config.trustProxy, false);
  assert.equal(
    resolveClientIpWith(h({ "x-forwarded-for": "9.9.9.1" }), config).bucket,
    UNTRUSTED_IP,
  );
});

test("depth 1: the rightmost hop wins over anything the caller prepends", () => {
  const r = resolveClientIpWith(
    h({ "x-forwarded-for": "9.9.9.1, 203.0.113.7" }),
    trusted({ trustedProxies: 1 }),
  );
  assert.equal(r.bucket, "203.0.113.7");
  assert.equal(r.trusted, true);
});

test("depth 2: selection is anchored at the configured depth", () => {
  const r = resolveClientIpWith(
    h({ "x-forwarded-for": "9.9.9.1, 203.0.113.7, 198.51.100.4" }),
    trusted({ trustedProxies: 2 }),
  );
  assert.equal(r.bucket, "203.0.113.7");
});

test("a chain shorter than the configured depth is rejected, not guessed at", () => {
  const r = resolveClientIpWith(
    h({ "x-forwarded-for": "9.9.9.1" }),
    trusted({ trustedProxies: 2 }),
  );
  assert.equal(r.bucket, UNTRUSTED_IP);
  assert.equal(r.trusted, false);
});

test("x-real-ip is honoured only when the forwarded header is absent", () => {
  const r = resolveClientIpWith(h({ "x-real-ip": "203.0.113.7" }), trusted());
  assert.equal(r.bucket, "203.0.113.7");

  const conflicting = resolveClientIpWith(
    h({ "x-forwarded-for": "garbage", "x-real-ip": "9.9.9.9" }),
    trusted(),
  );
  assert.equal(conflicting.bucket, UNTRUSTED_IP);
});

test("no address anywhere resolves to the shared unknown bucket", () => {
  assert.equal(resolveClientIpWith(h(), trusted()).bucket, UNKNOWN_IP);
});

test("proxy secret: a request straight to the app port is untrusted", () => {
  const config = trusted({ proxySecret: "s3cret-value" });

  assert.equal(
    resolveClientIpWith(h({ "x-forwarded-for": "9.9.9.1" }), config).bucket,
    UNTRUSTED_IP,
  );
  assert.equal(
    resolveClientIpWith(h({ "x-forwarded-for": "9.9.9.1", "x-proxy-auth": "wrong" }), config)
      .bucket,
    UNTRUSTED_IP,
  );

  const viaProxy = resolveClientIpWith(
    h({ "x-forwarded-for": "203.0.113.7", "x-proxy-auth": "s3cret-value" }),
    config,
  );
  assert.equal(viaProxy.bucket, "203.0.113.7");
  assert.equal(viaProxy.trusted, true);
});

test("proxy secret: a near-miss of the same length is still rejected", () => {
  const config = trusted({ proxySecret: "abcdef" });
  const r = resolveClientIpWith(
    h({ "x-forwarded-for": "203.0.113.7", "x-proxy-auth": "abcdeg" }),
    config,
  );
  assert.equal(r.bucket, UNTRUSTED_IP);
});

test("IPv6 is bucketed to /64 so one allocation cannot be rotated through", () => {
  const config = trusted();
  const a = resolveClientIpWith(h({ "x-forwarded-for": "2001:db8:1:2:aaaa::1" }), config);
  const b = resolveClientIpWith(h({ "x-forwarded-for": "2001:db8:1:2:bbbb::9" }), config);
  assert.equal(a.bucket, b.bucket);

  const other = resolveClientIpWith(h({ "x-forwarded-for": "2001:db8:1:3::1" }), config);
  assert.notEqual(a.bucket, other.bucket);
});

test("ports are stripped from IPv4 and bracketed IPv6", () => {
  const config = trusted();
  assert.equal(
    resolveClientIpWith(h({ "x-forwarded-for": "203.0.113.7:51234" }), config).bucket,
    "203.0.113.7",
  );
  assert.equal(
    resolveClientIpWith(h({ "x-forwarded-for": "[2001:db8:1:2::1]:443" }), config).bucket,
    "2001:db8:1:2",
  );
});

test("malformed entries never fall back to a caller-supplied value", () => {
  const config = trusted();
  for (const value of ["not-an-ip, also-bad", "999.1.1.1", "  ,  ,  "]) {
    assert.equal(
      resolveClientIpWith(h({ "x-forwarded-for": value }), config).bucket,
      UNTRUSTED_IP,
      `expected "${value}" to be untrusted`,
    );
  }
});

test("depth is clamped to a sane range", () => {
  assert.equal(proxyTrustConfigFromEnv({ RATE_LIMIT_TRUSTED_PROXIES: "0" }).trustedProxies, 1);
  assert.equal(proxyTrustConfigFromEnv({ RATE_LIMIT_TRUSTED_PROXIES: "-3" }).trustedProxies, 1);
  assert.equal(proxyTrustConfigFromEnv({ RATE_LIMIT_TRUSTED_PROXIES: "999" }).trustedProxies, 10);
  assert.equal(proxyTrustConfigFromEnv({ RATE_LIMIT_TRUSTED_PROXIES: "2" }).trustedProxies, 2);
});

test("only explicit affirmatives enable trust", () => {
  for (const value of ["true", "TRUE", "1", "yes"]) {
    assert.equal(
      proxyTrustConfigFromEnv({ RATE_LIMIT_TRUST_PROXY: value }).trustProxy,
      true,
      `expected "${value}" to enable trust`,
    );
  }
  for (const value of ["false", "0", "no", "", "maybe"]) {
    assert.equal(
      proxyTrustConfigFromEnv({ RATE_LIMIT_TRUST_PROXY: value }).trustProxy,
      false,
      `expected "${value}" to leave trust disabled`,
    );
  }
});
