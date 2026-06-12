import { describe, expect, it } from "vitest";
import {
  ALLOWED_TRANSITIONS,
  assertTransition,
  canTransition,
  IllegalTransitionError,
} from "./status";

describe("order status transitions", () => {
  it("instant flow happy path", () => {
    expect(canTransition("pending_payment", "paid")).toBe(true);
    expect(canTransition("paid", "confirmed")).toBe(true);
    expect(canTransition("confirmed", "in_production")).toBe(true);
    expect(canTransition("in_production", "shipped")).toBe(true);
    expect(canTransition("shipped", "delivered")).toBe(true);
  });

  it("quote flow happy path", () => {
    expect(canTransition("enquiry", "quoted")).toBe(true);
    expect(canTransition("quoted", "approved")).toBe(true);
    expect(canTransition("quoted", "rejected")).toBe(true);
    expect(canTransition("approved", "confirmed")).toBe(true);
    expect(canTransition("in_production", "ready")).toBe(true);
    expect(canTransition("ready", "delivered")).toBe(true);
  });

  it("standard (WhatsApp) flow happy path", () => {
    expect(canTransition("pending", "confirmed")).toBe(true);
  });

  it("rejects cross-flow jumps", () => {
    // instant order cannot enter the quote approval pipeline
    expect(canTransition("pending_payment", "approved")).toBe(false);
    // an un-quoted enquiry cannot ship
    expect(canTransition("enquiry", "shipped")).toBe(false);
    expect(canTransition("paid", "quoted")).toBe(false);
    expect(() => assertTransition("enquiry", "shipped")).toThrow(
      IllegalTransitionError,
    );
  });

  it("rejects skipping payment", () => {
    expect(canTransition("pending_payment", "confirmed")).toBe(false);
    expect(canTransition("pending_payment", "delivered")).toBe(false);
  });

  it("terminal states allow nothing", () => {
    expect(ALLOWED_TRANSITIONS.delivered).toEqual([]);
    expect(ALLOWED_TRANSITIONS.cancelled).toEqual([]);
    expect(ALLOWED_TRANSITIONS.rejected).toEqual([]);
    expect(() => assertTransition("delivered", "cancelled")).toThrow();
  });

  it("every non-terminal status can cancel", () => {
    const terminal = new Set(["delivered", "cancelled", "rejected"]);
    for (const [from, allowed] of Object.entries(ALLOWED_TRANSITIONS)) {
      if (terminal.has(from)) continue;
      expect(allowed, `${from} should allow cancelled`).toContain("cancelled");
    }
  });

  it("error message names the allowed moves", () => {
    expect(() => assertTransition("quoted", "delivered")).toThrow(
      /approved, rejected, cancelled/,
    );
  });
});
