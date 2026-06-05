import { Resend } from "resend";
import { env, siteConfig } from "@/lib/env";
import type { Order } from "@/features/orders/types";
import { formatINR } from "@/lib/utils";
import { ORDER_STATUS_LABEL } from "@/features/orders/types";

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(env.RESEND_API_KEY);
  return _resend;
}

const FROM = env.RESEND_FROM_EMAIL ?? `orders@alvari.in`;
const ADMIN_TO = env.ADMIN_EMAIL ?? "admin@alvari.in";

function orderEmailHtml(order: Order, siteUrl: string): string {
  const trackingUrl = `${siteUrl}/orders/${order.shortCode}`;
  const itemRows = order.items
    .map(
      (it) => `
      <tr style="border-bottom:1px solid #eee">
        <td style="padding:10px 8px;font-size:14px">${it.productName}${it.variantName ? ` · ${it.variantName}` : ""}</td>
        <td style="padding:10px 8px;text-align:center;font-size:14px">${it.quantity}</td>
        <td style="padding:10px 8px;text-align:right;font-size:14px">${formatINR(it.lineTotal)}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Order ${order.shortCode}</title></head>
<body style="margin:0;padding:0;background:#f9f5f0;font-family:'Helvetica Neue',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;max-width:600px">
  <!-- Header -->
  <tr><td style="background:#1a1a1a;padding:32px 40px;text-align:center">
    <p style="margin:0;color:#d4a853;font-size:11px;letter-spacing:3px;text-transform:uppercase">Alvari Furniture</p>
    <h1 style="margin:8px 0 0;color:#fff;font-size:28px;font-weight:400">Order Confirmed</h1>
    <p style="margin:8px 0 0;color:#999;font-size:14px">#${order.shortCode}</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:32px 40px">
    <p style="margin:0 0 24px;font-size:15px;color:#333">Hi ${order.customerName},</p>
    <p style="margin:0 0 24px;font-size:15px;color:#555">
      Thank you for your order! We've received your request and our team will contact you on WhatsApp
      (<strong>${order.customerPhone}</strong>) shortly to confirm production details.
    </p>

    <!-- Items table -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:8px;overflow:hidden;margin-bottom:24px">
      <thead><tr style="background:#f9f5f0">
        <th style="padding:10px 8px;text-align:left;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#888;font-weight:600">Item</th>
        <th style="padding:10px 8px;text-align:center;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#888;font-weight:600">Qty</th>
        <th style="padding:10px 8px;text-align:right;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#888;font-weight:600">Amount</th>
      </tr></thead>
      <tbody>${itemRows}</tbody>
      <tfoot><tr style="background:#f9f5f0">
        <td colspan="2" style="padding:12px 8px;text-align:right;font-size:13px;font-weight:600;color:#555">Total</td>
        <td style="padding:12px 8px;text-align:right;font-size:16px;font-weight:700;color:#1a1a1a">${formatINR(order.total)}</td>
      </tr></tfoot>
    </table>

    <!-- Delivery address -->
    <div style="background:#f9f5f0;border-radius:8px;padding:16px;margin-bottom:24px">
      <p style="margin:0 0 6px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#888;font-weight:600">Delivery Address</p>
      <p style="margin:0;font-size:14px;color:#333">${order.shippingAddress}</p>
    </div>

    <!-- Next steps -->
    <div style="border-left:3px solid #d4a853;padding-left:16px;margin-bottom:24px">
      <p style="margin:0 0 8px;font-size:13px;color:#555;font-weight:600">What happens next?</p>
      <ol style="margin:0;padding-left:18px;font-size:13px;color:#666;line-height:1.8">
        <li>Our team will call / WhatsApp you within 2–4 hours</li>
        <li>We'll confirm availability and production timeline</li>
        <li>You'll need to pay 50% advance to confirm production</li>
        <li>Balance due at delivery</li>
      </ol>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin:32px 0">
      <a href="${trackingUrl}" style="display:inline-block;background:#1a1a1a;color:#fff;padding:14px 32px;border-radius:100px;font-size:14px;font-weight:500;text-decoration:none">
        Track Your Order →
      </a>
    </div>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#f9f5f0;padding:20px 40px;text-align:center;border-top:1px solid #eee">
    <p style="margin:0;font-size:12px;color:#999">${siteConfig.name} · ${siteConfig.location}</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

export async function sendOrderConfirmationEmail(
  order: Order,
  siteUrl: string,
): Promise<void> {
  const resend = getResend();
  if (!resend || !order.customerEmail) return;

  try {
    await resend.emails.send({
      from: `Alvari Furniture <${FROM}>`,
      to: order.customerEmail,
      subject: `Order confirmed · #${order.shortCode}`,
      html: orderEmailHtml(order, siteUrl),
    });
  } catch {
    // Email is best-effort; never block the order flow
  }
}

export async function sendAdminOrderAlert(order: Order): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const waLink = `https://wa.me/${order.customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${order.customerName}! Order #${order.shortCode} received.`)}`;

  const html = `<html><body style="font-family:Arial,sans-serif;padding:20px">
    <h2 style="color:#1a1a1a">New Order — #${order.shortCode}</h2>
    <table style="border-collapse:collapse;width:100%;max-width:500px">
      <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;font-weight:600;width:160px">Customer</td><td style="padding:8px;border:1px solid #ddd">${order.customerName}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;font-weight:600">Phone</td><td style="padding:8px;border:1px solid #ddd">${order.customerPhone}</td></tr>
      ${order.customerEmail ? `<tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;font-weight:600">Email</td><td style="padding:8px;border:1px solid #ddd">${order.customerEmail}</td></tr>` : ""}
      <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;font-weight:600">Total</td><td style="padding:8px;border:1px solid #ddd;font-weight:700">${formatINR(order.total)}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;font-weight:600">Address</td><td style="padding:8px;border:1px solid #ddd">${order.shippingAddress}</td></tr>
    </table>
    <h3>Items</h3>
    <ul>${order.items.map((it) => `<li>${it.productName}${it.variantName ? ` · ${it.variantName}` : ""} × ${it.quantity} — ${formatINR(it.lineTotal)}</li>`).join("")}</ul>
    ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ""}
    <p><a href="${waLink}" style="display:inline-block;background:#25D366;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">📱 Message on WhatsApp</a></p>
  </body></html>`;

  try {
    await resend.emails.send({
      from: `Alvari Orders <${FROM}>`,
      to: ADMIN_TO,
      subject: `New order #${order.shortCode} — ${order.customerName} · ${formatINR(order.total)}`,
      html,
    });
  } catch {
    // Best-effort
  }
}
