import type { OrderStatus } from "@/lib/db/schema";

/**
 * Single source of truth for order lifecycle moves, enforced in app code.
 *
 * Three flows share one table (`orders.type`):
 *  - standard (legacy WhatsApp): pending → confirmed → in_production → shipped → delivered
 *  - instant (online payment):   pending_payment → paid → confirmed → … → delivered
 *  - quote:                      enquiry → quoted → approved|rejected;
 *                                approved → confirmed → in_production → ready → shipped → delivered
 * Any non-terminal status can be cancelled.
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  // standard flow
  pending: ["confirmed", "cancelled"],
  // instant flow
  pending_payment: ["paid", "cancelled"],
  paid: ["confirmed", "in_production", "cancelled"],
  // quote flow
  enquiry: ["quoted", "cancelled"],
  quoted: ["approved", "rejected", "cancelled"],
  approved: ["confirmed", "cancelled"],
  rejected: [],
  // shared production pipeline
  confirmed: ["in_production", "shipped", "cancelled"],
  in_production: ["ready", "shipped", "cancelled"],
  ready: ["shipped", "delivered", "cancelled"],
  shipped: ["delivered", "cancelled"],
  // terminal
  delivered: [],
  cancelled: [],
};

export class IllegalTransitionError extends Error {
  constructor(from: OrderStatus, to: OrderStatus) {
    super(
      `Cannot move order from "${from}" to "${to}". Allowed: ${
        ALLOWED_TRANSITIONS[from].length > 0
          ? ALLOWED_TRANSITIONS[from].join(", ")
          : "none (terminal status)"
      }`,
    );
  }
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) throw new IllegalTransitionError(from, to);
}
