import type { OrderDoc } from "@/lib/db/models";

/**
 * Order confirmation email.
 *
 * Built with tables and inline styles on purpose: Gmail, Outlook and most mobile mail
 * apps strip <style> blocks, flexbox and grid, so anything "modern" collapses into an
 * unreadable column. The brand colours are the storefront's own tokens, hard-coded here
 * because CSS variables don't survive an email client either.
 */

const INK = "#171717";
const RED = "#e5482b";
const PAPER = "#fffdf9";
const LINE = "#ddd9d2";
const MUTED = "#716b64";

const money = (value: number) => `Rs. ${value.toLocaleString("en-IN")}`;

const PAYMENT_LABELS: Record<OrderDoc["payment"], string> = {
  upi: "UPI",
  card: "Card",
  netbanking: "Net banking",
  cod: "Cash on Delivery",
};

/** Escapes anything that came from a customer before it goes into HTML. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function estimatedDelivery(placedAt: string): string {
  const date = new Date(placedAt);
  date.setDate(date.getDate() + 5);
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export function orderConfirmationSubject(order: OrderDoc): string {
  return `Order confirmed — ${order._id} · MI TRENDS`;
}

/** Plain-text fallback, for clients that refuse HTML and for spam scoring. */
export function orderConfirmationText(order: OrderDoc, siteUrl: string): string {
  const isCod = order.payment === "cod";
  const lines = order.lines
    .map((line) => `  - ${line.name} (${line.color}, ${line.size}) x${line.quantity} — ${money(line.price * line.quantity)}`)
    .join("\n");

  return [
    `Thanks for your order, ${order.customerName}.`,
    ``,
    `Order ${order._id}`,
    `Placed on ${formatDate(order.placedAt)}`,
    `Estimated delivery: ${estimatedDelivery(order.placedAt)}`,
    ``,
    `WHAT YOU ORDERED`,
    lines,
    ``,
    `Subtotal: ${money(order.subtotal)}`,
    ...(order.discount > 0 ? [`Discount${order.couponCode ? ` (${order.couponCode})` : ""}: -${money(order.discount)}`] : []),
    `Shipping: ${order.shipping > 0 ? money(order.shipping) : "Free"}`,
    ...(order.codFee > 0 ? [`COD handling fee: ${money(order.codFee)}`] : []),
    `Order total: ${money(order.total)}`,
    ``,
    `Payment method: ${PAYMENT_LABELS[order.payment]}`,
    isCod
      ? `Payment status: Pending — pay ${money(order.total)} to the courier on delivery. Amount paid so far: Rs. 0.`
      : `Payment status: Paid — ${money(order.total)} received. Thank you.`,
    ``,
    `DELIVERY ADDRESS`,
    `${order.customerName}`,
    `${order.address.line1}`,
    `${order.address.area}`,
    `${order.address.city}, ${order.address.state} ${order.address.pincode}`,
    `Phone: ${order.phone}`,
    ``,
    `Track your order: ${siteUrl}/info/track-order`,
    `Returns & refunds: ${siteUrl}/info/returns`,
    ``,
    `MI TRENDS — Made to be noticed`,
  ].join("\n");
}

export function orderConfirmationHtml(order: OrderDoc, siteUrl: string): string {
  const isCod = order.payment === "cod";

  const itemRows = order.lines
    .map((line) => {
      const image = line.imageUrl ? `${siteUrl}${line.imageUrl}` : "";
      return `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid ${LINE};vertical-align:top;width:72px;">
          ${
            image
              ? `<img src="${esc(image)}" width="64" height="85" alt="" style="display:block;width:64px;height:85px;object-fit:cover;border-radius:4px;background:#efebe5;border:0;" />`
              : `<div style="width:64px;height:85px;border-radius:4px;background:#efebe5;"></div>`
          }
        </td>
        <td style="padding:14px 12px;border-bottom:1px solid ${LINE};vertical-align:top;">
          <div style="font-size:14px;font-weight:700;color:${INK};line-height:1.3;">${esc(line.name)}</div>
          <div style="font-size:12px;color:${MUTED};padding-top:4px;">${esc(line.color)} &middot; Size ${esc(line.size)}</div>
          <div style="font-size:12px;color:${MUTED};padding-top:2px;">Qty ${line.quantity}</div>
        </td>
        <td style="padding:14px 0;border-bottom:1px solid ${LINE};vertical-align:top;text-align:right;font-size:14px;font-weight:700;color:${INK};white-space:nowrap;">
          ${money(line.price * line.quantity)}
        </td>
      </tr>`;
    })
    .join("");

  const summaryRow = (label: string, value: string, bold = false, color = INK) => `
    <tr>
      <td style="padding:5px 0;font-size:${bold ? "15px" : "13px"};color:${bold ? INK : MUTED};font-weight:${bold ? "800" : "400"};">${esc(label)}</td>
      <td style="padding:5px 0;font-size:${bold ? "15px" : "13px"};color:${color};font-weight:${bold ? "800" : "600"};text-align:right;white-space:nowrap;">${value}</td>
    </tr>`;

  // COD gets its own callout — the shopper needs to know to keep cash ready.
  const paymentBlock = isCod
    ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;border:1px solid #f0d9a8;border-radius:8px;background:#fdf6e7;">
      <tr>
        <td style="padding:16px 18px;">
          <div style="font-size:14px;font-weight:800;color:#7a5618;">Pay ${money(order.total)} on delivery</div>
          <div style="font-size:13px;color:#7a5618;line-height:1.6;padding-top:6px;">
            Nothing has been charged yet. Please keep ${money(order.total)} ready for the courier — the
            ${money(order.codFee)} handling fee is already included in this amount.
          </div>
        </td>
      </tr>
    </table>`
    : `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;border:1px solid #cfe8d6;border-radius:8px;background:#eef7f1;">
      <tr>
        <td style="padding:16px 18px;">
          <div style="font-size:14px;font-weight:800;color:#1b6b3e;">Payment received — ${money(order.total)}</div>
          <div style="font-size:13px;color:#1b6b3e;line-height:1.6;padding-top:6px;">
            Paid by ${esc(PAYMENT_LABELS[order.payment])}. Nothing more to pay on delivery.
          </div>
        </td>
      </tr>
    </table>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(orderConfirmationSubject(order))}</title>
</head>
<body style="margin:0;padding:0;background:${PAPER};">
  <!-- Preview text shown in the inbox list, hidden in the body itself -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Order ${esc(order._id)} confirmed — ${order.lines.length} item${order.lines.length === 1 ? "" : "s"}, ${money(order.total)}.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};">
    <tr>
      <td align="center" style="padding:28px 14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:22px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:900;letter-spacing:-0.02em;color:${INK};">
                    MI TRENDS
                  </td>
                  <td style="text-align:right;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:${RED};">
                    Order confirmed
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border:1px solid ${LINE};border-radius:12px;padding:28px 24px;font-family:Arial,Helvetica,sans-serif;">

              <div style="font-size:24px;font-weight:900;color:${INK};line-height:1.2;letter-spacing:-0.02em;">
                Thanks, ${esc(order.customerName.split(" ")[0] || order.customerName)}.
              </div>
              <div style="font-size:14px;color:${MUTED};line-height:1.6;padding-top:8px;">
                We've got your order and we're getting it ready. You'll hear from us again when it ships.
              </div>

              <!-- Order meta -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;border-top:1px solid ${LINE};border-bottom:1px solid ${LINE};">
                <tr>
                  <td style="padding:14px 0;width:50%;vertical-align:top;">
                    <div style="font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};">Order number</div>
                    <div style="font-size:14px;font-weight:800;color:${INK};padding-top:4px;">${esc(order._id)}</div>
                  </td>
                  <td style="padding:14px 0;width:50%;vertical-align:top;">
                    <div style="font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};">Order date</div>
                    <div style="font-size:14px;font-weight:800;color:${INK};padding-top:4px;">${esc(formatDate(order.placedAt))}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 14px;vertical-align:top;">
                    <div style="font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};">Payment method</div>
                    <div style="font-size:14px;font-weight:800;color:${INK};padding-top:4px;">${esc(PAYMENT_LABELS[order.payment])}</div>
                  </td>
                  <td style="padding:0 0 14px;vertical-align:top;">
                    <div style="font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};">Estimated delivery</div>
                    <div style="font-size:14px;font-weight:800;color:${INK};padding-top:4px;">${esc(estimatedDelivery(order.placedAt))}</div>
                  </td>
                </tr>
              </table>

              ${paymentBlock}

              <!-- Items -->
              <div style="font-size:10px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${MUTED};padding:26px 0 2px;">
                What you ordered
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${itemRows}
              </table>

              <!-- Totals -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                ${summaryRow("Subtotal", money(order.subtotal))}
                ${order.discount > 0 ? summaryRow(order.couponCode ? `Discount (${order.couponCode})` : "Discount", `-${money(order.discount)}`, false, "#1b6b3e") : ""}
                ${summaryRow("Shipping", order.shipping > 0 ? money(order.shipping) : "Free")}
                ${order.codFee > 0 ? summaryRow("COD handling fee", money(order.codFee)) : ""}
                <tr><td colspan="2" style="padding-top:10px;border-top:1px solid ${LINE};"></td></tr>
                ${summaryRow("Order total", money(order.total), true)}
                ${summaryRow("Amount paid", isCod ? money(0) : money(order.total), false, isCod ? MUTED : "#1b6b3e")}
                ${isCod ? summaryRow("Due on delivery", money(order.total), false, "#7a5618") : ""}
              </table>

              <!-- Address -->
              <div style="font-size:10px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${MUTED};padding:26px 0 8px;">
                Delivery address
              </div>
              <div style="font-size:14px;color:${INK};line-height:1.7;">
                <strong>${esc(order.customerName)}</strong><br />
                ${esc(order.address.line1)}<br />
                ${esc(order.address.area)}<br />
                ${esc(order.address.city)}, ${esc(order.address.state)} ${esc(order.address.pincode)}<br />
                <span style="color:${MUTED};">${esc(order.phone)}</span>
              </div>

              <!-- CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:26px;">
                <tr>
                  <td style="background:${INK};border-radius:6px;">
                    <a href="${esc(siteUrl)}/info/track-order" style="display:inline-block;padding:14px 26px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;color:#ffffff;text-decoration:none;">
                      Track this order
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:22px 6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${MUTED};line-height:1.7;">
              Questions about this order? Just reply to this email, or read our
              <a href="${esc(siteUrl)}/info/returns" style="color:${INK};">Return &amp; Refund Policy</a>,
              <a href="${esc(siteUrl)}/info/shipping" style="color:${INK};">Shipping Policy</a> and
              <a href="${esc(siteUrl)}/info/terms" style="color:${INK};">Terms</a>.
              <div style="padding-top:12px;color:#a09a93;">MI TRENDS — Made to be noticed</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
