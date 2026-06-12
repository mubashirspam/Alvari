import type {
  OrderItemRow,
  OrderRow,
  OrderStatus,
} from "@/lib/db/schema";

export type { OrderStatus };

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "New",
  confirmed: "Confirmed",
  in_production: "In production",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  pending_payment: "Awaiting payment",
  paid: "Paid",
  enquiry: "Quote enquiry",
  quoted: "Quoted",
  approved: "Quote approved",
  rejected: "Quote rejected",
  ready: "Ready",
};

export const ORDER_TYPE_LABEL: Record<OrderRow["type"], string> = {
  standard: "WhatsApp order",
  instant: "Paid online",
  quote: "Quote order",
};

/** Legacy linear pipeline shown as summary cards on the admin orders page. */
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "in_production",
  "shipped",
  "delivered",
];

function paiseToRupees(paise: number): number {
  return paise / 100;
}

export type OrderItem = {
  id: string;
  productId: string | null;
  productSlug: string;
  productName: string;
  variantId: string | null;
  variantSku: string | null;
  variantName: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  imageUrl: string | null;
};

export function mapOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    productId: row.productId,
    productSlug: row.productSlug,
    productName: row.productName,
    variantId: row.variantId,
    variantSku: row.variantSku,
    variantName: row.variantName,
    unitPrice: paiseToRupees(row.unitPriceInPaise),
    quantity: row.quantity,
    lineTotal: paiseToRupees(row.lineTotalInPaise),
    imageUrl: row.imageUrl,
  };
}

export type Order = {
  id: string;
  shortCode: string;
  userId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  shippingAddress: string;
  notes: string | null;
  subtotal: number;
  total: number;
  status: OrderStatus;
  type: OrderRow["type"];
  tax: number;
  shipping: number;
  quotedTotal: number | null;
  adminNote: string | null;
  placedVia: string;
  referralCode: string | null;
  promoCode: string | null;
  discountInPaise: number;
  isCustomOrder: boolean;
  customDimensions: string | null;
  customWoodType: string | null;
  customFinish: string | null;
  customTimeline: string | null;
  customReferenceImages: string[];
  whatsappOpenedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
};

export function mapOrder(row: OrderRow, items: OrderItemRow[]): Order {
  return {
    id: row.id,
    shortCode: row.shortCode,
    userId: row.userId,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    customerEmail: row.customerEmail,
    shippingAddress: row.shippingAddress,
    notes: row.notes,
    subtotal: paiseToRupees(row.subtotalInPaise),
    total: paiseToRupees(row.totalInPaise),
    status: row.status,
    type: row.type,
    tax: paiseToRupees(row.taxInPaise),
    shipping: paiseToRupees(row.shippingInPaise),
    quotedTotal:
      row.quotedTotalInPaise === null ? null : paiseToRupees(row.quotedTotalInPaise),
    adminNote: row.adminNote,
    placedVia: row.placedVia,
    referralCode: row.referralCode,
    promoCode: row.promoCode,
    discountInPaise: row.discountInPaise,
    isCustomOrder: row.isCustomOrder,
    customDimensions: row.customDimensions,
    customWoodType: row.customWoodType,
    customFinish: row.customFinish,
    customTimeline: row.customTimeline,
    customReferenceImages: row.customReferenceImages ?? [],
    whatsappOpenedAt: row.whatsappOpenedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    items: items.map(mapOrderItem),
  };
}

export function generateShortCode(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 1e6)
    .toString(36)
    .toUpperCase()
    .padStart(5, "0");
  return `ALV-${year}-${seq}`;
}
