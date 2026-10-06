"use client";

import { formatINR } from "@/lib/admin/format";
import { hasStoreAddress, storeAddressLine, STORE_IDENTITY } from "@/lib/store-identity";
import type { Order } from "@/lib/admin/types";

/**
 * Where undelivered parcels come back to. Read from lib/store-identity.ts rather than
 * written here, so the invoice and this label can never disagree.
 *
 * If it isn't filled in, the label says so in plain sight instead of printing a
 * plausible-looking address: a wrong return address sends failed deliveries to a
 * stranger, which is worse than an obviously incomplete label.
 */

/**
 * Internal dispatch reference, derived from the order id so the same order always
 * prints the same number. This is not a courier AWB — the courier assigns that when
 * the shipment is booked through their API.
 */
export function dispatchReference(orderId: string) {
  const digits = orderId.replace(/\D/g, "") || "0";
  const checksum = digits
    .split("")
    .reduce((sum, digit, index) => sum + Number(digit) * (index % 2 ? 3 : 1), 0);
  return `MIT-${digits}-${String(checksum % 97).padStart(2, "0")}`;
}

export function ShippingLabel({ order }: { order: Order }) {
  const units = order.lines.reduce((sum, line) => sum + line.quantity, 0);
  const collectOnDelivery = order.payment === "cod" && !order.paid;
  const amountToCollect = Math.max(0, order.total - (order.advancePaid ?? 0));
  const placed = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(order.placedAt));

  return (
    <div className="ship-label" id="shipping-label">
      <header className="ship-label__head">
        <span className="ship-label__mark" aria-hidden="true">
          MI
        </span>
        <div>
          <strong>MI TRENDS</strong>
          <span>Shipping label</span>
        </div>
        <div className="ship-label__order">
          <span>Order</span>
          <strong>{order.id}</strong>
        </div>
      </header>

      <section className="ship-label__block">
        <span className="ship-label__caption">Deliver to</span>
        <p className="ship-label__to">
          <strong>{order.customerName}</strong>
          {order.address.line1}
          <br />
          {order.address.area}
          <br />
          {order.address.city}, {order.address.state}
          <br />
          <strong className="ship-label__pin">{order.address.pincode}</strong>
          <br />
          {order.phone}
        </p>
      </section>

      <section className={`ship-label__payment ${collectOnDelivery ? "is-cod" : ""}`.trim()}>
        {collectOnDelivery ? (
          <>
            <span>{order.advancePaid ? "Collect balance (advance paid)" : "Cash on delivery — collect"}</span>
            <strong>{formatINR(amountToCollect)}</strong>
          </>
        ) : (
          <>
            <span>Prepaid — do not collect cash</span>
            <strong>{formatINR(order.total)} paid</strong>
          </>
        )}
      </section>

      <section className="ship-label__grid">
        <div>
          <span className="ship-label__caption">Dispatch ref</span>
          <p className="ship-label__ref">{dispatchReference(order.id)}</p>
        </div>
        <div>
          <span className="ship-label__caption">Order date</span>
          <p>{placed}</p>
        </div>
        <div>
          <span className="ship-label__caption">Items</span>
          <p>
            {units} {units === 1 ? "unit" : "units"}
          </p>
        </div>
      </section>

      <section className="ship-label__block">
        <span className="ship-label__caption">Contents</span>
        <table className="ship-label__items">
          <tbody>
            {order.lines.map((line, index) => (
              <tr key={`${line.sku}-${index}`}>
                <td>{line.sku}</td>
                <td>
                  {line.name}
                  <span>
                    {line.size} · {line.color}
                  </span>
                </td>
                <td>×{line.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="ship-label__foot">
        <span className="ship-label__caption">Return to</span>
        {hasStoreAddress() ? (
          <p>
            {STORE_IDENTITY.name}, {storeAddressLine()}
            {STORE_IDENTITY.phone ? ` · ${STORE_IDENTITY.phone}` : ""}
          </p>
        ) : (
          <p style={{ color: "#c7271d", fontWeight: 700 }}>
            RETURN ADDRESS NOT SET — add it in lib/store-identity.ts before shipping.
          </p>
        )}
        <p className="ship-label__note">
          No courier barcode on this label — the AWB and its barcode are issued by the courier when
          the shipment is booked.
        </p>
      </footer>
    </div>
  );
}
