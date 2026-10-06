"use client";

import { formatDate, formatINR } from "@/lib/admin/format";
import { amountInWords, storeAddressLine, STORE_IDENTITY } from "@/lib/store-identity";
import type { Order } from "@/lib/admin/types";

/**
 * The printable invoice.
 *
 * Rendered off-screen and only made visible by the print stylesheet (see admin.css),
 * so printing produces the invoice on its own rather than a screenshot of the admin UI.
 * Laid out in millimetres against A4 and styled inline — print styles that live in a
 * shared sheet get overridden by the panel's own rules too easily.
 */

const PAYMENT_LABELS: Record<Order["payment"], string> = {
  upi: "UPI",
  card: "Card",
  netbanking: "Net banking",
  cod: "Cash on Delivery",
};

const INK = "#171717";
const MUTED = "#6b6560";
const LINE = "#d9d4cd";

export function Invoice({ order }: { order: Order }) {
  const isCod = order.payment === "cod";
  const amountPaid = isCod && !order.paid ? 0 : order.total;
  const balanceDue = order.total - amountPaid;
  const units = order.lines.reduce((sum, line) => sum + line.quantity, 0);

  const cell: React.CSSProperties = { padding: "7px 8px", fontSize: "9.5pt", verticalAlign: "top" };
  const headCell: React.CSSProperties = {
    ...cell,
    fontSize: "7.5pt",
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: MUTED,
    borderBottom: `1px solid ${INK}`,
  };
  const label: React.CSSProperties = {
    fontSize: "7.5pt",
    fontWeight: 700,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    color: MUTED,
    margin: "0 0 4px",
  };

  return (
    <div
      id="invoice-sheet"
      style={{
        width: "190mm",
        padding: "0",
        background: "#fff",
        color: INK,
        fontFamily: "Helvetica, Arial, sans-serif",
        lineHeight: 1.45,
      }}
    >
      {/* Masthead */}
      <table style={{ width: "100%", borderCollapse: "collapse", borderBottom: `2px solid ${INK}` }}>
        <tbody>
          <tr>
            <td style={{ padding: "0 0 12px", verticalAlign: "top" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo.png"
                alt={STORE_IDENTITY.name}
                style={{ height: "14mm", width: "auto", maxWidth: "85mm", display: "block", marginBottom: "2.5mm" }}
              />
              <div style={{ fontSize: "8pt", color: MUTED, marginTop: 2 }}>{STORE_IDENTITY.tagline}</div>
              <div style={{ fontSize: "8pt", color: MUTED, marginTop: 6, lineHeight: 1.6 }}>
                {storeAddressLine() ? <>{storeAddressLine()}<br /></> : null}
                {STORE_IDENTITY.website}
                {STORE_IDENTITY.email ? <> · {STORE_IDENTITY.email}</> : null}
                {STORE_IDENTITY.phone ? <> · {STORE_IDENTITY.phone}</> : null}
                {STORE_IDENTITY.gstin ? <><br />GSTIN: {STORE_IDENTITY.gstin}</> : null}
              </div>
            </td>
            <td style={{ padding: "0 0 12px", verticalAlign: "top", textAlign: "right", width: "60mm" }}>
              <div style={{ fontSize: "13pt", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Invoice
              </div>
              <div style={{ fontSize: "8.5pt", marginTop: 8, lineHeight: 1.7 }}>
                <div><span style={{ color: MUTED }}>Invoice no.&nbsp;</span><strong>{order.id}</strong></div>
                <div><span style={{ color: MUTED }}>Order date&nbsp;</span>{formatDate(order.placedAt)}</div>
                <div><span style={{ color: MUTED }}>Status&nbsp;</span>
                  <span style={{ textTransform: "capitalize" }}>{order.status}</span>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Parties */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10mm" }}>
        <tbody>
          <tr>
            <td style={{ width: "50%", verticalAlign: "top", paddingRight: "8mm" }}>
              <p style={label}>Billed to</p>
              <div style={{ fontSize: "10pt", fontWeight: 700 }}>{order.customerName}</div>
              <div style={{ fontSize: "9pt", color: MUTED, marginTop: 3, lineHeight: 1.6 }}>
                {order.email}
                <br />
                {order.phone}
              </div>
            </td>
            <td style={{ width: "50%", verticalAlign: "top" }}>
              <p style={label}>Delivery address</p>
              <div style={{ fontSize: "9pt", lineHeight: 1.65 }}>
                {order.address.line1}
                <br />
                {order.address.area}
                <br />
                {order.address.city}, {order.address.state} {order.address.pincode}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Items */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "9mm" }}>
        <thead>
          <tr>
            <th style={{ ...headCell, width: "9mm", textAlign: "left" }}>#</th>
            <th style={{ ...headCell, textAlign: "left" }}>Item</th>
            <th style={{ ...headCell, width: "18mm", textAlign: "center" }}>Qty</th>
            <th style={{ ...headCell, width: "28mm", textAlign: "right" }}>Rate</th>
            <th style={{ ...headCell, width: "30mm", textAlign: "right" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.lines.map((line, index) => (
            <tr key={`${line.sku}-${line.size}-${index}`}>
              <td style={{ ...cell, borderBottom: `1px solid ${LINE}`, color: MUTED }}>{index + 1}</td>
              <td style={{ ...cell, borderBottom: `1px solid ${LINE}` }}>
                <div style={{ fontWeight: 600 }}>{line.name}</div>
                <div style={{ fontSize: "8pt", color: MUTED, marginTop: 2 }}>
                  {line.color} · Size {line.size} · SKU {line.sku}
                </div>
              </td>
              <td style={{ ...cell, borderBottom: `1px solid ${LINE}`, textAlign: "center" }}>{line.quantity}</td>
              <td style={{ ...cell, borderBottom: `1px solid ${LINE}`, textAlign: "right" }}>{formatINR(line.price)}</td>
              <td style={{ ...cell, borderBottom: `1px solid ${LINE}`, textAlign: "right", fontWeight: 600 }}>
                {formatINR(line.price * line.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "6mm" }}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: "top", paddingRight: "10mm" }}>
              <p style={label}>Amount in words</p>
              <div style={{ fontSize: "9pt", fontWeight: 600, maxWidth: "95mm" }}>{amountInWords(order.total)}</div>

              <p style={{ ...label, marginTop: "7mm" }}>Payment</p>
              <div style={{ fontSize: "9pt", lineHeight: 1.7 }}>
                <div>
                  <span style={{ color: MUTED }}>Method&nbsp;</span>
                  {PAYMENT_LABELS[order.payment]}
                </div>
                <div>
                  <span style={{ color: MUTED }}>Status&nbsp;</span>
                  <strong style={{ color: balanceDue > 0 ? "#8a5a12" : "#1b6b3e" }}>
                    {balanceDue > 0 ? "Pending — payable on delivery" : "Paid in full"}
                  </strong>
                </div>
                <div>
                  <span style={{ color: MUTED }}>Units&nbsp;</span>
                  {units}
                </div>
              </div>
            </td>

            <td style={{ width: "72mm", verticalAlign: "top" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ ...cell, color: MUTED }}>Subtotal</td>
                    <td style={{ ...cell, textAlign: "right" }}>{formatINR(order.subtotal)}</td>
                  </tr>
                  {order.discount > 0 && (
                    <tr>
                      <td style={{ ...cell, color: MUTED }}>
                        Discount{order.couponCode ? ` (${order.couponCode})` : ""}
                      </td>
                      <td style={{ ...cell, textAlign: "right", color: "#1b6b3e" }}>−{formatINR(order.discount)}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ ...cell, color: MUTED }}>Shipping</td>
                    <td style={{ ...cell, textAlign: "right" }}>
                      {order.shipping > 0 ? formatINR(order.shipping) : "Free"}
                    </td>
                  </tr>
                  {(order.codFee ?? 0) > 0 && (
                    <tr>
                      <td style={{ ...cell, color: MUTED }}>COD handling fee</td>
                      <td style={{ ...cell, textAlign: "right" }}>{formatINR(order.codFee!)}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ ...cell, borderTop: `1px solid ${INK}`, fontWeight: 800, fontSize: "11pt" }}>Total</td>
                    <td style={{ ...cell, borderTop: `1px solid ${INK}`, textAlign: "right", fontWeight: 800, fontSize: "11pt" }}>
                      {formatINR(order.total)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ ...cell, color: MUTED }}>Amount paid</td>
                    <td style={{ ...cell, textAlign: "right" }}>{formatINR(amountPaid)}</td>
                  </tr>
                  {balanceDue > 0 && (
                    <tr>
                      <td style={{ ...cell, fontWeight: 700, color: "#8a5a12" }}>Due on delivery</td>
                      <td style={{ ...cell, textAlign: "right", fontWeight: 700, color: "#8a5a12" }}>
                        {formatINR(balanceDue)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Footer */}
      <div style={{ marginTop: "12mm", paddingTop: "4mm", borderTop: `1px solid ${LINE}`, fontSize: "8pt", color: MUTED, lineHeight: 1.7 }}>
        Returns and exchanges are accepted within 30 days, unworn and tagged — see{" "}
        {STORE_IDENTITY.website}/info/returns. This is a computer-generated invoice and does not
        require a signature.
        <div style={{ marginTop: "3mm", color: INK, fontWeight: 600 }}>
          Thank you for shopping with {STORE_IDENTITY.name}.
        </div>
      </div>
    </div>
  );
}
