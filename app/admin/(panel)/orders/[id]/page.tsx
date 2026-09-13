"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  Printer,
  ReceiptText,
  ShoppingCart,
  User,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { PageHeader } from "@/components/admin/PageHeader";
import { Badge, OrderStatusBadge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { Select } from "@/components/admin/ui/Field";
import { Modal } from "@/components/admin/ui/Modal";
import { ShippingLabel, dispatchReference } from "@/components/admin/ShippingLabel";
import { EmptyState } from "@/components/admin/ui/States";
import { formatDate, formatINR } from "@/lib/admin/format";
import { listVariants } from "@/lib/admin/motion";
import { useAdminStore } from "@/lib/admin/store";
import type { OrderStatus } from "@/lib/admin/types";

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "returned", label: "Returned" },
];

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { orders, customers, setOrderStatus, notify } = useAdminStore();
  const [labelOpen, setLabelOpen] = useState(false);

  const order = orders.find((entry) => entry.id === params.id);
  const customer = customers.find((entry) => entry.id === order?.customerId);

  if (!order) {
    return (
      <EmptyState
        icon={<ShoppingCart size={24} aria-hidden="true" />}
        title="Order not found"
        message="This order reference does not exist in the current data set."
        actionLabel="Back to orders"
        onAction={() => router.push("/admin/orders")}
      />
    );
  }

  const units = order.lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible">
      <PageHeader
        eyebrow={`Placed ${formatDate(order.placedAt, true)}`}
        title={order.id}
        description={`${units} items for ${order.customerName}`}
        actions={
          <>
            <Button variant="ghost" onClick={() => router.push("/admin/orders")}>
              <ArrowLeft size={15} aria-hidden="true" />
              All orders
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer size={15} aria-hidden="true" />
              Invoice
            </Button>
          </>
        }
      />

      <div className="a-split">
        <div className="a-stack">
          <Card
            title="Fulfilment"
            description="Move the order along — the customer sees each step on their tracking page."
            actions={<OrderStatusBadge status={order.status} />}
          >
            <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 0 }}>
              {order.timeline.map((step, index) => (
                <li key={step.label} style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 12 }}>
                  <div style={{ display: "grid", justifyItems: "center", gap: 0 }}>
                    <motion.span
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.06 }}
                      style={{
                        width: 26,
                        height: 26,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: "50%",
                        background: step.done ? "var(--green)" : "var(--surface-2)",
                        color: step.done ? "#fff" : "var(--ink-mute)",
                        fontSize: "0.66rem",
                        fontWeight: 800,
                      }}
                    >
                      {step.done ? <Check size={13} aria-hidden="true" /> : index + 1}
                    </motion.span>
                    {index < order.timeline.length - 1 ? (
                      <span
                        style={{
                          width: 2,
                          flex: 1,
                          minHeight: 26,
                          background: step.done ? "var(--green)" : "var(--line)",
                        }}
                      />
                    ) : null}
                  </div>
                  <div style={{ paddingBottom: index < order.timeline.length - 1 ? 18 : 0 }}>
                    <strong style={{ fontSize: "0.84rem", color: step.done ? "var(--ink)" : "var(--ink-mute)" }}>
                      {step.label}
                    </strong>
                    <p className="a-muted" style={{ fontSize: "0.72rem" }}>
                      {step.done ? formatDate(step.at, true) : "Not yet"}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="a-row" style={{ marginTop: 18, gap: 10, flexWrap: "wrap" }}>
              <Select
                label="Update status"
                value={order.status}
                options={statusOptions}
                onChange={(event) => {
                  setOrderStatus(order.id, event.target.value as OrderStatus);
                  notify("Order updated", "success", `${order.id} is now ${event.target.value}.`);
                }}
              />
            </div>
          </Card>

          <Card title="Items" description={`${units} units in this order`} flush>
            <div className="a-table-wrap">
              <table className="a-table a-table--cards">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Variant</th>
                    <th style={{ textAlign: "right" }}>Qty</th>
                    <th style={{ textAlign: "right" }}>Price</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.lines.map((line, index) => (
                    <tr key={`${line.sku}-${index}`}>
                      <td data-label="Product">
                        <div className="a-cell-product">
                          <span className="a-thumb">
                            {line.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={line.imageUrl} alt="" loading="lazy" />
                            ) : null}
                          </span>
                          <span className="a-cell-product__copy">
                            <Link href={`/admin/products/${line.productId}`} className="a-cell-product__name">
                              {line.name}
                            </Link>
                            <span className="a-cell-product__meta">{line.sku}</span>
                          </span>
                        </div>
                      </td>
                      <td data-label="Variant">
                        <span className="a-cell-product__meta">
                          {line.size} · {line.color}
                        </span>
                      </td>
                      <td data-label="Qty" className="a-table__num">
                        {line.quantity}
                      </td>
                      <td data-label="Price" className="a-table__num">
                        {formatINR(line.price)}
                      </td>
                      <td data-label="Total" className="a-table__num">
                        <strong>{formatINR(line.price * line.quantity)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="a-stack a-sticky">
          <Card title="Payment">
            <dl style={{ display: "grid", gap: 11, margin: 0 }}>
              {[
                ["Subtotal", formatINR(order.subtotal)],
                ["Discount", order.discount ? `− ${formatINR(order.discount)}` : "—"],
                ["Shipping", order.shipping ? formatINR(order.shipping) : "Free"],
                ...(order.advancePaid
                  ? ([
                      ["Advance paid (UPI)", `− ${formatINR(order.advancePaid)}`],
                      ["Collect on delivery", formatINR(order.total - order.advancePaid)],
                    ] as [string, string][])
                  : []),
              ].map(([label, value]) => (
                <div key={label} className="a-row a-row--between">
                  <dt className="a-muted" style={{ fontSize: "0.78rem" }}>
                    {label}
                  </dt>
                  <dd className="a-num" style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600 }}>
                    {value}
                  </dd>
                </div>
              ))}
              <div
                className="a-row a-row--between"
                style={{ paddingTop: 11, borderTop: "1px solid var(--line-soft)" }}
              >
                <dt style={{ fontWeight: 800, fontSize: "0.8rem" }}>Total</dt>
                <dd className="a-num" style={{ margin: 0, fontFamily: "var(--display)", fontSize: "1.1rem" }}>
                  {formatINR(order.total)}
                </dd>
              </div>
            </dl>

            <div className="a-row" style={{ marginTop: 15, gap: 8, flexWrap: "wrap" }}>
              <Badge tone={order.paid ? "success" : order.advancePaid ? "info" : "warning"} dot>
                {order.paid ? "Paid" : order.advancePaid ? "Advance paid" : "Payment due"}
              </Badge>
              <Badge tone="quiet">
                <CreditCard size={12} aria-hidden="true" />
                {order.payment.toUpperCase()}
              </Badge>
              {order.couponCode ? <Badge tone="yellow">{order.couponCode}</Badge> : null}
            </div>
          </Card>

          <Card title="Customer">
            <div className="a-stack" style={{ gap: 11 }}>
              <div className="a-row" style={{ gap: 11 }}>
                <span className="admin-avatar">{order.customerName.slice(0, 1)}</span>
                <span style={{ display: "grid", gap: 2 }}>
                  <strong style={{ fontSize: "0.85rem" }}>{order.customerName}</strong>
                  <span className="a-muted" style={{ fontSize: "0.72rem" }}>
                    {customer ? `${customer.orders} orders · ${formatINR(customer.spend)} lifetime` : "Guest checkout"}
                  </span>
                </span>
              </div>

              <a className="a-row" href={`mailto:${order.email}`} style={{ gap: 9, fontSize: "0.78rem" }}>
                <Mail size={14} aria-hidden="true" />
                {order.email}
              </a>
              <a className="a-row" href={`tel:${order.phone}`} style={{ gap: 9, fontSize: "0.78rem" }}>
                <Phone size={14} aria-hidden="true" />
                {order.phone}
              </a>

              {customer ? (
                <Link className="a-btn a-btn--outline a-btn--sm" href={`/admin/customers/${customer.id}`}>
                  <User size={13} aria-hidden="true" />
                  View profile
                </Link>
              ) : null}
            </div>
          </Card>

          <Card title="Delivery address">
            <p style={{ display: "flex", gap: 9, fontSize: "0.82rem", lineHeight: 1.6 }}>
              <MapPin size={15} aria-hidden="true" style={{ flex: "none", marginTop: 3, color: "var(--ink-mute)" }} />
              <span>
                {order.address.line1}
                <br />
                {order.address.area}
                <br />
                {order.address.city}, {order.address.state}
                <br />
                {order.address.pincode}
              </span>
            </p>
            <Button variant="outline" size="sm" full style={{ marginTop: 13 }} onClick={() => setLabelOpen(true)}>
              <ReceiptText size={13} aria-hidden="true" />
              Generate shipping label
            </Button>
          </Card>
        </div>
      </div>

      <Modal
        open={labelOpen}
        onClose={() => setLabelOpen(false)}
        title="Shipping label"
        description={`${order.id} · ${order.customerName}`}
        width={520}
        footer={
          <>
            <Button variant="ghost" onClick={() => setLabelOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                window.print();
                notify("Label sent to print", "success", `${order.id} · ${dispatchReference(order.id)}`);
              }}
            >
              <Printer size={14} aria-hidden="true" />
              Print label
            </Button>
          </>
        }
      >
        <ShippingLabel order={order} />
      </Modal>
    </motion.div>
  );
}
