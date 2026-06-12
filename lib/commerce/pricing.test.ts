import { describe, expect, it } from "vitest";
import { computeTotals, type PricedLine } from "./pricing";

function line(
  unitPriceInPaise: number,
  quantity: number,
  gstRate: string | null,
): PricedLine {
  return { unitPriceInPaise, quantity, gstRate };
}

describe("computeTotals", () => {
  it("null GST rate contributes no tax", () => {
    const t = computeTotals([line(45999_00, 1, null)]);
    expect(t.subtotalInPaise).toBe(45999_00);
    expect(t.taxInPaise).toBe(0);
    expect(t.totalInPaise).toBe(45999_00);
  });

  it("0% GST contributes no tax", () => {
    const t = computeTotals([line(10000, 2, "0.00")]);
    expect(t.taxInPaise).toBe(0);
    expect(t.totalInPaise).toBe(20000);
  });

  it("12% GST on a single line", () => {
    // 250.00 × 2 = 500.00; 12% = 60.00
    const t = computeTotals([line(25000, 2, "12.00")]);
    expect(t.subtotalInPaise).toBe(50000);
    expect(t.taxInPaise).toBe(6000);
    expect(t.totalInPaise).toBe(56000);
  });

  it("18% GST on a single line", () => {
    const t = computeTotals([line(99900, 1, "18.00")]);
    expect(t.taxInPaise).toBe(Math.round(99900 * 0.18)); // 17982
    expect(t.totalInPaise).toBe(99900 + 17982);
  });

  it("rounds tax per line, then sums (multi-line rounding)", () => {
    // Each line: 33 paise × 1 at 18% = 5.94 paise → rounds to 6 per line.
    // Per-line rounding: 6 + 6 = 12. (Summed-then-rounded would also be 12
    // here, so use values where they genuinely diverge below.)
    const a = computeTotals([line(33, 1, "18.00"), line(33, 1, "18.00")]);
    expect(a.taxInPaise).toBe(12);

    // 2.5 paise tax per line (rounds to 3 each): per-line = 6;
    // sum-then-round would give round(5.0) = 5.
    const b = computeTotals([
      line(25, 1, "10.00"), // 2.5 → 3
      line(25, 1, "10.00"), // 2.5 → 3
    ]);
    expect(b.taxInPaise).toBe(6);
  });

  it("mixed rates across lines", () => {
    const t = computeTotals([
      line(10000, 1, "12.00"), // tax 1200
      line(20000, 1, "18.00"), // tax 3600
      line(5000, 1, null), // tax 0
    ]);
    expect(t.subtotalInPaise).toBe(35000);
    expect(t.taxInPaise).toBe(4800);
    expect(t.totalInPaise).toBe(39800);
  });

  it("applies discount and shipping; total clamps at zero", () => {
    const t = computeTotals([line(10000, 1, null)], {
      shippingInPaise: 5000,
      discountInPaise: 2000,
    });
    expect(t.totalInPaise).toBe(13000);

    const clamped = computeTotals([line(1000, 1, null)], {
      discountInPaise: 99999,
    });
    expect(clamped.totalInPaise).toBe(0);
  });

  it("rejects invalid inputs", () => {
    expect(() => computeTotals([line(100.5, 1, null)])).toThrow(/unit price/i);
    expect(() => computeTotals([line(-1, 1, null)])).toThrow(/unit price/i);
    expect(() => computeTotals([line(100, 0, null)])).toThrow(/quantity/i);
    expect(() => computeTotals([line(100, 1.5, null)])).toThrow(/quantity/i);
    expect(() => computeTotals([line(100, 1, "abc")])).toThrow(/gst/i);
    expect(() => computeTotals([line(100, 1, "101")])).toThrow(/gst/i);
    expect(() => computeTotals([line(100, 1, "-5")])).toThrow(/gst/i);
  });
});
