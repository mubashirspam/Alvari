import { describe, expect, it } from "vitest";
import { partitionCheckout, type CheckoutItemMode } from "./checkout-options";

const instant: CheckoutItemMode = { purchaseMode: "instant", priceIsIndicative: false };
const quoteFirm: CheckoutItemMode = { purchaseMode: "quote", priceIsIndicative: false };
const quoteIndicative: CheckoutItemMode = { purchaseMode: "quote", priceIsIndicative: true };

describe("partitionCheckout", () => {
  it("empty cart: both groups empty", () => {
    const g = partitionCheckout([]);
    expect(g.online).toHaveLength(0);
    expect(g.quote).toHaveLength(0);
  });

  it("all instant → everything in the online group", () => {
    const g = partitionCheckout([instant, instant]);
    expect(g.online).toHaveLength(2);
    expect(g.quote).toHaveLength(0);
  });

  it("all quote → everything in the quote group (indicative or not)", () => {
    const g = partitionCheckout([quoteFirm, quoteIndicative]);
    expect(g.online).toHaveLength(0);
    expect(g.quote).toHaveLength(2);
  });

  it("mixed → split by mode, both groups populated", () => {
    const g = partitionCheckout([instant, quoteFirm, quoteIndicative]);
    expect(g.online).toEqual([instant]);
    expect(g.quote).toEqual([quoteFirm, quoteIndicative]);
  });

  it("preserves order within each group", () => {
    const a: CheckoutItemMode = { purchaseMode: "instant", priceIsIndicative: false };
    const b: CheckoutItemMode = { purchaseMode: "instant", priceIsIndicative: false };
    const g = partitionCheckout([a, quoteFirm, b]);
    expect(g.online).toEqual([a, b]);
    expect(g.quote).toEqual([quoteFirm]);
  });
});
