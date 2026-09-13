"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Boxes,
  Download,
  IndianRupee,
  Package,
  ShoppingCart,
  Timer,
  TriangleAlert,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/admin/PageHeader";
import { KpiCard } from "@/components/admin/KpiCard";
import { AreaChart } from "@/components/admin/charts/AreaChart";
import { BarChart } from "@/components/admin/charts/BarChart";
import { Donut } from "@/components/admin/charts/Donut";
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { Badge, OrderStatusBadge, StockBadge } from "@/components/admin/ui/Badge";
import { Tabs } from "@/components/admin/ui/Tabs";
import { EmptyState } from "@/components/admin/ui/States";
import { LOW_STOCK_THRESHOLD, TODAY, totalStock } from "@/lib/admin/data";
import { downloadCsv, stamp } from "@/lib/admin/csv";
import { formatINR, formatMoneyCompact, formatNumber, formatRelative, percentChange } from "@/lib/admin/format";
import { listVariants } from "@/lib/admin/motion";
import { useAdminStore } from "@/lib/admin/store";
import { useAdminAuth } from "@/lib/admin/auth";

const ranges = [
  { id: "7", label: "7 days" },
  { id: "30", label: "30 days" },
  { id: "90", label: "90 days" },
];

export default function DashboardPage() {
  const { orders, products, customers, reviews, notify } = useAdminStore();
  const { user } = useAdminAuth();
  const [range, setRange] = useState("30");
  const days = Number(range);

  const stats = useMemo(() => {
    const cutoff = new Date(TODAY);
    cutoff.setDate(cutoff.getDate() - days);
    const previousCutoff = new Date(TODAY);
    previousCutoff.setDate(previousCutoff.getDate() - days * 2);

    const billable = orders.filter((order) => order.status !== "cancelled");
    const current = billable.filter((order) => new Date(order.placedAt) >= cutoff);
    const previous = billable.filter((order) => {
      const placed = new Date(order.placedAt);
      return placed >= previousCutoff && placed < cutoff;
    });

    const sum = (list: typeof orders) => list.reduce((total, order) => total + order.total, 0);
    const newCustomers = customers.filter((customer) => new Date(customer.joinedAt) >= cutoff);
    const previousCustomers = customers.filter((customer) => {
      const joined = new Date(customer.joinedAt);
      return joined >= previousCutoff && joined < cutoff;
    });

    // Daily revenue buckets for the chart.
    const buckets = new Map<string, { label: string; value: number }>();
    for (let offset = days - 1; offset >= 0; offset -= 1) {
      const date = new Date(TODAY);
      date.setDate(date.getDate() - offset);
      buckets.set(date.toISOString().slice(0, 10), {
        label: new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(date),
        value: 0,
      });
    }
    for (const order of current) {
      const bucket = buckets.get(order.placedAt.slice(0, 10));
      if (bucket) bucket.value += order.total;
    }

    const unitsByProduct = new Map<number, { name: string; units: number; revenue: number }>();
    for (const order of current) {
      for (const line of order.lines) {
        const entry = unitsByProduct.get(line.productId) ?? { name: line.name, units: 0, revenue: 0 };
        entry.units += line.quantity;
        entry.revenue += line.price * line.quantity;
        unitsByProduct.set(line.productId, entry);
      }
    }

    const statusCounts = current.reduce<Record<string, number>>((acc, order) => {
      acc[order.status] = (acc[order.status] ?? 0) + 1;
      return acc;
    }, {});

    const paymentCounts = current.reduce<Record<string, number>>((acc, order) => {
      acc[order.payment] = (acc[order.payment] ?? 0) + 1;
      return acc;
    }, {});

    return {
      revenue: sum(current),
      revenueChange: percentChange(sum(current), sum(previous)),
      orderCount: current.length,
      orderChange: percentChange(current.length, previous.length),
      customerCount: customers.length,
      customerChange: percentChange(newCustomers.length, previousCustomers.length),
      aov: current.length ? sum(current) / current.length : 0,
      series: Array.from(buckets.values()),
      topProducts: Array.from(unitsByProduct.values()).sort((a, b) => b.units - a.units).slice(0, 6),
      statusCounts,
      paymentCounts,
      pendingOrders: orders.filter((order) => order.status === "pending"),
      lowStock: products.filter((product) => totalStock(product) <= LOW_STOCK_THRESHOLD),
      pendingReviews: reviews.filter((review) => review.status === "pending").length,
    };
  }, [orders, products, customers, reviews, days]);

  const recentOrders = orders.slice(0, 6);

  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible">
      <PageHeader
        eyebrow={`Store overview · last ${days} days`}
        title={`Good morning, ${user?.name.split(" ")[0] ?? "there"}`}
        description="Here is how MI TRENDS is trading today. Numbers update as orders, stock and reviews move."
        actions={
          <>
            <Tabs items={ranges} active={range} onChange={setRange} layoutId="dashboard-range" variant="segment" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const rows = stats.series.map((point) => ({ Date: point.label, Revenue: Math.round(point.value) }));
                const done = downloadCsv(`mitrends-revenue-${days}d-${stamp()}`, rows);
                notify(
                  done ? "Export downloaded" : "Nothing to export",
                  done ? "success" : "info",
                  done ? `Daily revenue for the last ${days} days.` : "No data in this range.",
                );
              }}
            >
              <Download size={14} aria-hidden="true" />
              Export
            </Button>
          </>
        }
      />

      <motion.div className="a-kpi-grid" data-count="6" variants={listVariants}>
        <KpiCard
          label="Revenue"
          value={formatINR(stats.revenue)}
          change={stats.revenueChange}
          caption={`Average order ${formatINR(stats.aov)}`}
          icon={<IndianRupee size={17} aria-hidden="true" />}
          accent="var(--red)"
          accentSoft="#fdeeeb"
        />
        <KpiCard
          label="Orders"
          value={formatNumber(stats.orderCount)}
          change={stats.orderChange}
          caption={`${stats.pendingOrders.length} waiting to be confirmed`}
          icon={<ShoppingCart size={17} aria-hidden="true" />}
          accent="var(--ink)"
        />
        <KpiCard
          label="Customers"
          value={formatNumber(stats.customerCount)}
          change={stats.customerChange}
          caption={`${customers.filter((customer) => customer.tier === "vip").length} on VIP spend`}
          icon={<Users size={17} aria-hidden="true" />}
          accent="#23459c"
          accentSoft="#e8eefb"
        />
        <KpiCard
          label="Products"
          value={formatNumber(products.length)}
          caption={`${products.filter((product) => product.status === "draft").length} drafts unpublished`}
          icon={<Package size={17} aria-hidden="true" />}
          accent="var(--green)"
          accentSoft="var(--green-soft)"
        />
        <KpiCard
          label="Low stock"
          value={formatNumber(stats.lowStock.length)}
          caption={`At or below ${LOW_STOCK_THRESHOLD} units`}
          icon={<TriangleAlert size={17} aria-hidden="true" />}
          accent="#8a6100"
          accentSoft="#fff6d4"
        />
        <KpiCard
          label="Pending orders"
          value={formatNumber(stats.pendingOrders.length)}
          caption={`${stats.pendingReviews} reviews also need a decision`}
          icon={<Timer size={17} aria-hidden="true" />}
          accent="var(--red-dark)"
          accentSoft="#fdeeeb"
        />
      </motion.div>

      <div className="a-split a-split--wide" style={{ marginBottom: 14 }}>
        <Card
          title="Revenue"
          description={`Gross merchandise value across the last ${days} days`}
          actions={
            <span className="a-trend a-trend--up">
              <ArrowUpRight size={12} aria-hidden="true" />
              {formatMoneyCompact(stats.revenue)}
            </span>
          }
        >
          <AreaChart data={stats.series} height={250} />
        </Card>

        <Card title="Order status" description={`${stats.orderCount} orders in range`}>
          <Donut
            centerValue={formatNumber(stats.orderCount)}
            centerLabel="Orders"
            segments={[
              { label: "Delivered", value: stats.statusCounts.delivered ?? 0, color: "#16764a" },
              { label: "Shipped", value: stats.statusCounts.shipped ?? 0, color: "#131313" },
              { label: "Packed", value: stats.statusCounts.packed ?? 0, color: "#2b63d9" },
              { label: "Confirmed", value: stats.statusCounts.confirmed ?? 0, color: "#7aa2e8" },
              { label: "Pending", value: stats.statusCounts.pending ?? 0, color: "#ffd943" },
              { label: "Cancelled / returned", value: (stats.statusCounts.cancelled ?? 0) + (stats.statusCounts.returned ?? 0), color: "#ef3f2f" },
            ]}
          />
        </Card>
      </div>

      <div className="a-split a-split--wide" style={{ marginBottom: 14 }}>
        <Card
          title="Recent orders"
          description="Newest first"
          flush
          actions={
            <Link className="a-btn a-btn--ghost a-btn--sm" href="/admin/orders">
              View all
            </Link>
          }
        >
          <div className="a-table-wrap">
            <table className="a-table a-table--cards">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                  <th>Placed</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td data-label="Order">
                      <Link href={`/admin/orders/${order.id}`} style={{ fontWeight: 700 }}>
                        {order.id}
                      </Link>
                    </td>
                    <td data-label="Customer">{order.customerName}</td>
                    <td data-label="Status">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td data-label="Total" className="a-table__num">
                      {formatINR(order.total)}
                    </td>
                    <td data-label="Placed" className="a-muted" style={{ fontSize: "0.74rem" }}>
                      {formatRelative(order.placedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card
          title="Low stock"
          description="Reorder before these sell out"
          flush
          actions={
            <Link className="a-btn a-btn--ghost a-btn--sm" href="/admin/inventory">
              Inventory
            </Link>
          }
        >
          {stats.lowStock.length === 0 ? (
            <EmptyState
              icon={<Boxes size={22} aria-hidden="true" />}
              title="Stock looks healthy"
              message="No product is under the low-stock threshold right now."
            />
          ) : (
            <ul className="a-list">
              {stats.lowStock.slice(0, 6).map((product) => (
                <li key={product.id}>
                  <span className="a-thumb" style={{ width: 36, height: 46 }}>
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.imageUrl} alt="" />
                    ) : null}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <Link href={`/admin/products/${product.id}`} className="a-cell-product__name" style={{ display: "block" }}>
                      {product.name}
                    </Link>
                    <span className="a-cell-product__meta">{product.sku}</span>
                  </span>
                  <StockBadge units={totalStock(product)} threshold={LOW_STOCK_THRESHOLD} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="a-split a-split--wide">
        <Card title="Best sellers" description={`Units sold in the last ${days} days`}>
          {stats.topProducts.length === 0 ? (
            <EmptyState title="No sales in range" message="Pick a longer window to see best sellers." />
          ) : (
            <BarChart
              data={stats.topProducts.map((entry, index) => ({
                label: entry.name.split(" ").slice(0, 2).join(" "),
                value: entry.units,
                accent: index === 0 ? "var(--red)" : "var(--ink)",
              }))}
            />
          )}
        </Card>

        <Card title="Payment mix" description="How customers are paying">
          <div className="a-stack">
            {Object.entries(stats.paymentCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([mode, count]) => {
                const share = stats.orderCount ? (count / stats.orderCount) * 100 : 0;
                return (
                  <div key={mode}>
                    <div className="a-row a-row--between" style={{ marginBottom: 6 }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase" }}>{mode}</span>
                      <span className="a-num a-muted" style={{ fontSize: "0.74rem" }}>
                        {count} · {share.toFixed(0)}%
                      </span>
                    </div>
                    <div className="a-bar-track">
                      <motion.div
                        className="a-bar-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${share}%` }}
                        transition={{ duration: 0.6, ease: [0.2, 0.7, 0, 1] }}
                        style={{ background: mode === "cod" ? "var(--yellow)" : "var(--ink)" }}
                      />
                    </div>
                  </div>
                );
              })}
            <p className="a-muted" style={{ fontSize: "0.74rem" }}>
              COD orders carry a ₹49 handling fee and settle on delivery.
            </p>
            <Badge tone="quiet">{formatNumber(stats.orderCount)} orders analysed</Badge>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
