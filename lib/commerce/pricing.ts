/**
 * Money math for orders. Integer paise everywhere — never floats for money.
 *
 * GST note: `gstRate` is a percent string from the DB (e.g. "18.00") or null.
 * Null/zero rates contribute no tax, so catalogues without GST data keep
 * today's behaviour (total = subtotal − discount). Tax is rounded per line,
 * then summed (standard invoice practice). The CGST/SGST vs IGST split is an
 * invoicing concern — store `placeOfSupplyState` now, split when invoicing lands.
 */

export type PricedLine = {
  unitPriceInPaise: number;
  quantity: number;
  /** Percent, e.g. "18.00" (numeric column) — null means no tax. */
  gstRate: string | null;
};

export type OrderTotals = {
  subtotalInPaise: number;
  taxInPaise: number;
  shippingInPaise: number;
  totalInPaise: number;
};

export function computeTotals(
  lines: PricedLine[],
  opts: { shippingInPaise?: number; discountInPaise?: number } = {},
): OrderTotals {
  const shippingInPaise = Math.max(0, Math.trunc(opts.shippingInPaise ?? 0));
  const discountInPaise = Math.max(0, Math.trunc(opts.discountInPaise ?? 0));

  let subtotalInPaise = 0;
  let taxInPaise = 0;

  for (const line of lines) {
    if (!Number.isInteger(line.unitPriceInPaise) || line.unitPriceInPaise < 0) {
      throw new Error(`Invalid unit price: ${line.unitPriceInPaise}`);
    }
    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      throw new Error(`Invalid quantity: ${line.quantity}`);
    }
    const lineTotal = line.unitPriceInPaise * line.quantity;
    subtotalInPaise += lineTotal;

    const rate = line.gstRate === null ? 0 : Number(line.gstRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      throw new Error(`Invalid GST rate: ${line.gstRate}`);
    }
    if (rate > 0) {
      taxInPaise += Math.round((lineTotal * rate) / 100);
    }
  }

  const totalInPaise = Math.max(
    0,
    subtotalInPaise + taxInPaise + shippingInPaise - discountInPaise,
  );

  return { subtotalInPaise, taxInPaise, shippingInPaise, totalInPaise };
}
