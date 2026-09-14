import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  centsToNumeric,
  checkRefundAmount,
  REFUND_ERRORS,
  refundableCents,
  refundStateOf,
  toCents,
} from "./refunds";

describe("toCents", () => {
  it("reads the numeric strings the database returns", () => {
    assert.equal(toCents("50.00"), 5000);
    assert.equal(toCents("0.05"), 5);
  });

  it("rounds rather than truncating a float", () => {
    assert.equal(toCents(19.99), 1999);
    assert.equal(toCents("0.1"), 10);
  });

  it("treats missing or unparseable money as zero", () => {
    assert.equal(toCents(null), 0);
    assert.equal(toCents(undefined), 0);
    assert.equal(toCents("not money"), 0);
  });
});

describe("refundStateOf", () => {
  it("is none when nothing has been refunded", () => {
    assert.equal(refundStateOf("50.00", "0"), "none");
  });

  it("is partial for part of the captured amount", () => {
    assert.equal(refundStateOf("50.00", "20.00"), "partial");
  });

  it("is full once the refunded amount reaches what was paid", () => {
    assert.equal(refundStateOf("50.00", "50.00"), "full");
  });

  it("does not report partial for a booking that was never paid", () => {
    assert.equal(refundStateOf("0", "0"), "none");
  });
});

describe("refundableCents", () => {
  it("is what is left after earlier refunds", () => {
    assert.equal(refundableCents("50.00", "20.00"), 3000);
  });

  it("never goes negative on an inconsistent row", () => {
    assert.equal(refundableCents("50.00", "80.00"), 0);
  });
});

describe("checkRefundAmount", () => {
  it("accepts a partial refund and reports the resulting state", () => {
    const result = checkRefundAmount("20.00", "50.00", "0");
    assert.deepEqual(result, { ok: true, cents: 2000, state: "partial" });
  });

  it("reports full when the refund clears the remaining balance", () => {
    const result = checkRefundAmount("30.00", "50.00", "20.00");
    assert.deepEqual(result, { ok: true, cents: 3000, state: "full" });
  });

  it("refuses to refund a booking that never captured money", () => {
    assert.deepEqual(checkRefundAmount("10.00", "0", "0"), {
      ok: false,
      error: REFUND_ERRORS.nothingPaid,
    });
  });

  it("refuses a second refund once fully refunded", () => {
    assert.deepEqual(checkRefundAmount("10.00", "50.00", "50.00"), {
      ok: false,
      error: REFUND_ERRORS.fullyRefunded,
    });
  });

  it("refuses more than the remaining balance", () => {
    assert.deepEqual(checkRefundAmount("40.00", "50.00", "20.00"), {
      ok: false,
      error: REFUND_ERRORS.tooLarge,
    });
  });

  it("refuses zero and negative amounts", () => {
    assert.equal(checkRefundAmount("0", "50.00", "0").ok, false);
    assert.equal(checkRefundAmount("-10", "50.00", "0").ok, false);
  });

  it("allows the exact remaining balance", () => {
    assert.equal(checkRefundAmount("50.00", "50.00", "0").ok, true);
  });
});

describe("centsToNumeric", () => {
  it("produces the two-decimal string the numeric column expects", () => {
    assert.equal(centsToNumeric(2000), "20.00");
    assert.equal(centsToNumeric(5), "0.05");
  });
});
