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
};

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
  placedVia: string;
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
    placedVia: row.placedVia,
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
