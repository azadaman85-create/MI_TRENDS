"use client";

import { motion } from "framer-motion";
import { Download, Eye, PackageCheck, Truck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/admin/PageHeader";
import { KpiCard } from "@/components/admin/KpiCard";
import { Badge, OrderStatusBadge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { DataTable, type Column } from "@/components/admin/ui/DataTable";
import { Tabs } from "@/components/admin/ui/Tabs";
import { downloadCsv, stamp } from "@/lib/admin/csv";
import { formatDate, formatINR, formatNumber, formatRelative } from "@/lib/admin/format";
import { listVariants } from "@/lib/admin/motion";
import { useAdminStore } from "@/lib/admin/store";
import type { Order, OrderStatus } from "@/lib/admin/types";

const paymentLabels: Record<Order["payment"], string> = {
  upi: "UPI",
  card: "Card",
  netbanking: "Netbanking",
  cod: "COD",
};

export default function OrdersPage() {
  const router = useRouter();
  const { orders, setOrderStatus, notify } = useAdminStore();
  const [status, setStatus] = useState("all");

  const counts = useMemo(() => {
    const by = (value: OrderStatus) => orders.filter((order) => order.status === value).length;
    return {
      all: orders.length,
      pending: by("pending"),
      confirmed: by("confirmed") + by("packed"),
      shipped: by("shipped"),
      delivered: by("delivered"),
      issues: by("cancelled") + by("returned"),
    };
  }, [orders]);

  const filtered = useMemo(() => {
    if (status === "all") return orders;
    if (status === "confirmed") return orders.filter((order) => order.status === "confirmed" || order.status === "packed");
    if (status === "issues") return orders.filter((order) => order.status === "cancelled" || order.status === "returned");
    return orders.filter((order) => order.status === status);
  }, [orders, status]);

  const revenue = filtered.filter((order) => order.status !== "cancelled").reduce((sum, order) => sum + order.total, 0);
  const units = filtered.reduce((sum, order) => sum + order.lines.reduce((count, line) => count + line.quantity, 0), 0);

  const columns: Column<Order>[] = [
    {
      id: "id",
      header: "Order",
      sortValue: (order) => order.id,
      render: (order) => (
        <span style={{ display: "grid", gap: 3 }}>
          <Link href={`/admin/orders/${order.id}`} style={{ fontWeight: 700 }}>
            {order.id}
          </Link>
          <span className="a-cell-product__meta">{formatRelative(order.placedAt)}</span>
        </span>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      sortValue: (order) => order.customerName,
      render: (order) => (
        <span style={{ display: "grid", gap: 3, minWidth: 0 }}>
          <span style={{ fontWeight: 600 }}>{order.customerName}</span>
          <span className="a-cell-product__meta">
            {order.address.city}, {order.address.state}
          </span>
        </span>
      ),
    },
    {
      id: "items",
      header: "Items",
      align: "right",
      sortValue: (order) => order.lines.reduce((sum, line) => sum + line.quantity, 0),
      render: (order) => <span>{order.lines.reduce((sum, line) => sum + line.quantity, 0)}</span>,
    },
    {
      id: "payment",
      header: "Payment",
      sortValue: (order) => order.payment,
      render: (order) => (
        <span style={{ display: "grid", gap: 4 }}>
          <Badge tone={order.payment === "cod" ? "yellow" : "quiet"}>{paymentLabels[order.payment]}</Badge>
          <span className="a-cell-product__meta">{order.paid ? "Paid" : "Due on delivery"}</span>
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortValue: (order) => order.status,
      render: (order) => <OrderStatusBadge status={order.status} />,
    },
    {
      id: "total",
      header: "Total",
      align: "right",
      sortValue: (order) => order.total,
      render: (order) => <strong>{formatINR(order.total)}</strong>,
    },
  ];

  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible">
      <PageHeader
        eyebrow="Selling"
        title="Orders"
        description="Track every order from payment through to delivery, and move them along without leaving the list."
        actions={
          <Button
            variant="outline"
            onClick={() => {
              const rows = filtered.map((order) => ({
                "Order ID": order.id,
                Placed: formatDate(order.placedAt, true),
                Customer: order.customerName,
                Email: order.email,
                Phone: order.phone,
                City: order.address.city,
                State: order.address.state,
                Pincode: order.address.pincode,
                Items: order.lines.reduce((sum, line) => sum + line.quantity, 0),
                Products: order.lines.map((line) => `${line.name} (${line.size}, ×${line.quantity})`).join("; "),
                Payment: paymentLabels[order.payment],
                Paid: order.paid ? "Yes" : "No",
                Status: order.status,
                Coupon: order.couponCode ?? "",
                Subtotal: order.subtotal,
                Discount: order.discount,
                Shipping: order.shipping,
                Total: order.total,
              }));
              const done = downloadCsv(`mitrends-orders-${status}-${stamp()}`, rows);
              notify(
                done ? "Export downloaded" : "Nothing to export",
                done ? "success" : "info",
                done ? `${rows.length} orders saved as CSV.` : "This view has no orders.",
              );
            }}
          >
            <Download size={15} aria-hidden="true" />
            Export CSV
          </Button>
        }
      />

      <motion.div className="a-kpi-grid" data-count="4" variants={listVariants}>
        <KpiCard label="Orders in view" value={formatNumber(filtered.length)} icon={<PackageCheck size={17} aria-hidden="true" />} />
        <KpiCard
          label="Revenue in view"
          value={formatINR(revenue)}
          icon={<Truck size={17} aria-hidden="true" />}
          accent="var(--red)"
          accentSoft="#fdeeeb"
        />
        <KpiCard label="Units" value={formatNumber(units)} icon={<PackageCheck size={17} aria-hidden="true" />} accent="var(--green)" accentSoft="var(--green-soft)" />
        <KpiCard
          label="Awaiting action"
          value={formatNumber(counts.pending)}
          caption="Pending confirmation"
          icon={<Truck size={17} aria-hidden="true" />}
          accent="#8a6100"
          accentSoft="#fff6d4"
        />
      </motion.div>

      <Card flush>
        <div style={{ padding: "0 16px" }}>
          <Tabs
            layoutId="orders-status"
            active={status}
            onChange={setStatus}
            items={[
              { id: "all", label: "All", count: counts.all },
              { id: "pending", label: "Pending", count: counts.pending },
              { id: "confirmed", label: "In progress", count: counts.confirmed },
              { id: "shipped", label: "Shipped", count: counts.shipped },
              { id: "delivered", label: "Delivered", count: counts.delivered },
              { id: "issues", label: "Issues", count: counts.issues },
            ]}
          />
        </div>

        <DataTable
          rows={filtered}
          columns={columns}
          getRowId={(order) => order.id}
          pageSize={20}
          selectable
          searchPlaceholder="Search by order ID, customer or city…"
          searchValue={(order) => `${order.id} ${order.customerName} ${order.email} ${order.address.city}`}
          initialSort={{ column: "id", direction: "desc" }}
          onRowClick={(order) => router.push(`/admin/orders/${order.id}`)}
          emptyTitle="No orders here"
          emptyMessage="Nothing matches this filter. Try a different status tab."
          bulkActions={(ids, clear) => (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  ids.forEach((id) => setOrderStatus(id, "packed"));
                  notify(`${ids.length} orders marked packed`);
                  clear();
                }}
              >
                Mark packed
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  ids.forEach((id) => setOrderStatus(id, "shipped"));
                  notify(`${ids.length} orders marked shipped`);
                  clear();
                }}
              >
                Mark shipped
              </Button>
            </>
          )}
          rowActions={(order) => (
            <Link className="a-row-action" href={`/admin/orders/${order.id}`} aria-label={`Open ${order.id}`} title="Open order">
              <Eye size={15} aria-hidden="true" />
            </Link>
          )}
        />
      </Card>
    </motion.div>
  );
}
