/**
 * Single source of truth for splitting a cart into its two checkout paths.
 * Mirrored server-side by /api/orders/instant (online — instant items only)
 * and /api/orders (WhatsApp quote — quote items only).
 *
 * Model — every product is exactly one purchase mode:
 *   • instant → "Available": pay online now (Razorpay).
 *   • quote   → "Get a quote": our team confirms the final price on WhatsApp.
 *
 * A cart is split by mode and each group checks out on its own. A mixed cart
 * therefore pays online for its available items AND requests a quote for the
 * rest — neither path is ever blocked by the other, so there are no dead-ends.
 *
 * | Cart composition      | Pay online (instant group) | WhatsApp (quote group) |
 * |-----------------------|----------------------------|------------------------|
 * | all available         | yes                        | —                      |
 * | all quote             | —                          | yes                    |
 * | mixed                 | yes (available items)      | yes (quote items)      |
 * | empty                 | —                          | —                      |
 */

export type CheckoutItemMode = {
  purchaseMode: "instant" | "quote";
  /** Quote items only — true means no firm price until the team confirms. */
  priceIsIndicative: boolean;
};

export type CheckoutGroups<T> = {
  /** Instant ("Available") items — pay online now. */
  online: T[];
  /** Quote items — request a price via WhatsApp. */
  quote: T[];
};

/**
 * Partition any cart-like list into its online and quote groups. Generic so it
 * works for full cart items in the UI and the trimmed shapes on the server.
 */
export function partitionCheckout<T extends { purchaseMode: "instant" | "quote" }>(
  items: T[],
): CheckoutGroups<T> {
  const online: T[] = [];
  const quote: T[] = [];
  for (const item of items) {
    (item.purchaseMode === "quote" ? quote : online).push(item);
  }
  return { online, quote };
}
