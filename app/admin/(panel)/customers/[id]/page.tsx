"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Crown, Mail, MapPin, Phone, ShoppingBag, Users } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";

import { PageHeader } from "@/components/admin/PageHeader";
import { Badge, OrderStatusBadge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { EmptyState } from "@/components/admin/ui/States";
import { formatDate, formatINR, formatRelative } from "@/lib/admin/format";
import { listVariants } from "@/lib/admin/motion";
import { useAdminStore } from "@/lib/admin/store";

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { customers, orders } = useAdminStore();

  const customer = customers.find((entry) => entry.id === params.id);
  const customerOrders = useMemo(
    () => orders.filter((order) => order.customerId === params.id),
    [orders, params.id],
  );

  if (!customer) {
    return (
      <EmptyState
        icon={<Users size={24} aria-hidden="true" />}
        title="Customer not found"
        message="This profile is not part of the current data set."
        actionLabel="Back to customers"
        onAction={() => router.push("/admin/customers")}
      />
    );
  }

  const realSpend = customerOrders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + order.total, 0);

  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible">
      <PageHeader
        eyebrow={`Customer since ${formatDate(customer.joinedAt)}`}
        title={customer.name}
        description={`${customer.city}, ${customer.state}`}
        actions={
          <>
            <Button variant="ghost" onClick={() => router.push("/admin/customers")}>
              <ArrowLeft size={15} aria-hidden="true" />
              All customers
            </Button>
            <Button variant="outline" onClick={() => window.open(`mailto:${customer.email}`)}>
              <Mail size={15} aria-hidden="true" />
              Email customer
            </Button>
          </>
        }
      />

      <div className="a-split">
        <Card title="Order history" description={`${customerOrders.length} orders on record`} flush>
          {customerOrders.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag size={22} aria-hidden="true" />}
              title="No orders yet"
              message="This customer has an account but has not checked out."
            />
          ) : (
            <div className="a-table-wrap">
              <table className="a-table a-table--cards">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Items</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                    <th>Placed</th>
                  </tr>
                </thead>
                <tbody>
                  {customerOrders.map((order) => (
                    <tr key={order.id}>
                      <td data-label="Order">
                        <Link href={`/admin/orders/${order.id}`} style={{ fontWeight: 700 }}>
                          {order.id}
                        </Link>
                      </td>
                      <td data-label="Items">
                        <span className="a-cell-product__meta">
                          {order.lines.map((line) => line.name).join(", ").slice(0, 48)}
                          {order.lines.map((line) => line.name).join(", ").length > 48 ? "…" : ""}
                        </span>
                      </td>
                      <td data-label="Status">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td data-label="Total" className="a-table__num">
                        <strong>{formatINR(order.total)}</strong>
                      </td>
                      <td data-label="Placed" className="a-muted" style={{ fontSize: "0.74rem" }}>
                        {formatRelative(order.placedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="a-stack a-sticky">
          <Card title="Profile">
            <div className="a-stack" style={{ gap: 13 }}>
              <div className="a-row" style={{ gap: 12 }}>
                <span className="admin-avatar" style={{ width: 44, height: 44, fontSize: "0.95rem" }}>
                  {customer.name.slice(0, 1)}
                </span>
                <span style={{ display: "grid", gap: 4 }}>
                  <strong style={{ fontSize: "0.92rem" }}>{customer.name}</strong>
                  <Badge tone={customer.tier === "vip" ? "yellow" : customer.tier === "regular" ? "info" : "quiet"}>
                    {customer.tier === "vip" ? <Crown size={11} aria-hidden="true" /> : null}
                    {customer.tier}
                  </Badge>
                </span>
              </div>

              <a className="a-row" href={`mailto:${customer.email}`} style={{ gap: 9, fontSize: "0.78rem" }}>
                <Mail size={14} aria-hidden="true" />
                {customer.email}
              </a>
              <a className="a-row" href={`tel:${customer.phone}`} style={{ gap: 9, fontSize: "0.78rem" }}>
                <Phone size={14} aria-hidden="true" />
                {customer.phone}
              </a>
              <span className="a-row" style={{ gap: 9, fontSize: "0.78rem" }}>
                <MapPin size={14} aria-hidden="true" />
                {customer.city}, {customer.state}
              </span>
            </div>
          </Card>

          <Card title="Value">
            <dl className="a-meta-grid">
              <div>
                <dt>Lifetime spend</dt>
                <dd>{formatINR(realSpend)}</dd>
              </div>
              <div>
                <dt>Orders</dt>
                <dd>{customerOrders.length}</dd>
              </div>
              <div>
                <dt>Average order</dt>
                <dd>{customerOrders.length ? formatINR(realSpend / customerOrders.length) : "—"}</dd>
              </div>
              <div>
                <dt>Last order</dt>
                <dd>{customer.lastOrderAt ? formatRelative(customer.lastOrderAt) : "Never"}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
