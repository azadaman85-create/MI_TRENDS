"use client";

import { motion } from "framer-motion";
import { Download, IndianRupee, Percent, ShoppingCart, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/admin/PageHeader";
import { KpiCard } from "@/components/admin/KpiCard";
import { AreaChart } from "@/components/admin/charts/AreaChart";
import { BarChart } from "@/components/admin/charts/BarChart";
import { Donut } from "@/components/admin/charts/Donut";
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { Tabs } from "@/components/admin/ui/Tabs";
import { EmptyState } from "@/components/admin/ui/States";
import { TODAY } from "@/lib/admin/data";
import { downloadCsv, stamp } from "@/lib/admin/csv";
import { formatINR, formatNumber, percentChange } from "@/lib/admin/format";
import { listVariants } from "@/lib/admin/motion";
import { useAdminStore } from "@/lib/admin/store";

export default function ReportsPage() {
  const { orders, products, customers, notify } = useAdminStore();
  const [range, setRange] = useState("30");
  const days = Number(range);

  const report = useMemo(() => {
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

    const revenue = current.reduce((sum, order) => sum + order.total, 0);
    const previousRevenue = previous.reduce((sum, order) => sum + order.total, 0);
    const units = current.reduce(
      (sum, order) => sum + order.lines.reduce((count, line) => count + line.quantity, 0),
      0,
    );

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

    const byCollection = new Map<string, number>();
    const byCategory = new Map<string, number>();
    const byState = new Map<string, number>();

    for (const order of current) {
      byState.set(order.address.state, (byState.get(order.address.state) ?? 0) + order.total);
      for (const line of order.lines) {
        const product = products.find((entry) => entry.id === line.productId);
        if (!product) continue;
        const value = line.price * line.quantity;
        byCollection.set(product.collection, (byCollection.get(product.collection) ?? 0) + value);
        byCategory.set(product.category, (byCategory.get(product.category) ?? 0) + value);
      }
    }

    return {
      revenue,
      revenueChange: percentChange(revenue, previousRevenue),
      orders: current.length,
      ordersChange: percentChange(current.length, previous.length),
      units,
      aov: current.length ? revenue / current.length : 0,
      aovChange: percentChange(
        current.length ? revenue / current.length : 0,
        previous.length ? previousRevenue / previous.length : 0,
      ),
      returnRate:
        (orders.filter((order) => order.status === "returned").length / Math.max(1, orders.length)) * 100,
      series: Array.from(buckets.values()),
      collections: Array.from(byCollection.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6),
      categories: Array.from(byCategory.entries()),
      states: Array.from(byState.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6),
    };
  }, [orders, products, days]);

  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible">
      <PageHeader
        eyebrow="Storefront"
        title="Reports"
        description="Trading performance across the window you pick — revenue, mix and where the orders are going."
        actions={
          <>
            <Tabs
              layoutId="reports-range"
              variant="segment"
              active={range}
              onChange={setRange}
              items={[
                { id: "7", label: "7 days" },
                { id: "30", label: "30 days" },
                { id: "90", label: "90 days" },
              ]}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const rows = [
                  ...report.series.map((point) => ({ Section: "Daily revenue", Label: point.label, Value: Math.round(point.value) })),
                  ...report.collections.map(([name, value]) => ({ Section: "Revenue by collection", Label: name, Value: Math.round(value) })),
                  ...report.categories.map(([name, value]) => ({ Section: "Revenue by category", Label: name, Value: Math.round(value) })),
                  ...report.states.map(([name, value]) => ({ Section: "Revenue by state", Label: name, Value: Math.round(value) })),
                  { Section: "Summary", Label: "Orders", Value: report.orders },
                  { Section: "Summary", Label: "Units", Value: report.units },
                  { Section: "Summary", Label: "Average order value", Value: Math.round(report.aov) },
                  { Section: "Summary", Label: "Return rate %", Value: Number(report.returnRate.toFixed(2)) },
                ];
                const done = downloadCsv(`mitrends-report-${days}d-${stamp()}`, rows);
                notify(
                  done ? "Report downloaded" : "Nothing to export",
                  done ? "success" : "info",
                  done ? `${days}-day report saved as CSV.` : "No data in this range.",
                );
              }}
            >
              <Download size={14} aria-hidden="true" />
              Export
            </Button>
          </>
        }
      />

      <motion.div className="a-kpi-grid" data-count="4" variants={listVariants}>
        <KpiCard
          label="Revenue"
          value={formatINR(report.revenue)}
          change={report.revenueChange}
          icon={<IndianRupee size={17} aria-hidden="true" />}
          accent="var(--red)"
          accentSoft="#fdeeeb"
        />
        <KpiCard
          label="Orders"
          value={formatNumber(report.orders)}
          change={report.ordersChange}
          icon={<ShoppingCart size={17} aria-hidden="true" />}
        />
        <KpiCard
          label="Average order value"
          value={formatINR(report.aov)}
          change={report.aovChange}
          icon={<TrendingUp size={17} aria-hidden="true" />}
          accent="var(--green)"
          accentSoft="var(--green-soft)"
        />
        <KpiCard
          label="Return rate"
          value={`${report.returnRate.toFixed(1)}%`}
          caption="All-time returned orders"
          icon={<Percent size={17} aria-hidden="true" />}
          accent="#8a6100"
          accentSoft="#fff6d4"
        />
      </motion.div>

      <Card title="Revenue trend" description={`Daily gross revenue over ${days} days`} className="a-stack">
        <AreaChart data={report.series} height={260} />
      </Card>

      <div className="a-split a-split--wide" style={{ marginTop: 14 }}>
        <Card title="Revenue by collection" description="Which drops are carrying the season">
          {report.collections.length === 0 ? (
            <EmptyState title="No sales in range" message="Once orders come in, the collections that earn most show up here." />
          ) : (
          <BarChart
            data={report.collections.map(([name, value], index) => ({
              label: name.split(" ")[0],
              value,
              accent: index === 0 ? "var(--red)" : "var(--ink)",
            }))}
            formatValue={(value) => `₹${Math.round(value / 1000)}k`}
          />
          )}
        </Card>

        <Card title="Category mix" description="Share of revenue">
          <Donut
            centerValue={formatNumber(report.units)}
            centerLabel="Units sold"
            segments={report.categories.map(([name, value], index) => ({
              label: name,
              value,
              color: ["#131313", "#ef3f2f", "#16764a"][index % 3],
            }))}
          />
        </Card>
      </div>

      <div className="a-split a-split--wide" style={{ marginTop: 14 }}>
        <Card title="Top states" description="Where orders are shipping" flush>
          {report.states.length === 0 ? (
            <EmptyState title="Nothing shipped yet" message="Delivery destinations appear here after the first order." />
          ) : (
          <ul className="a-list">
            {report.states.map(([state, value]) => (
              <li key={state}>
                <span style={{ flex: 1, fontSize: "0.82rem", fontWeight: 600 }}>{state}</span>
                <span className="a-bar-track" style={{ width: 130 }}>
                  <motion.span
                    className="a-bar-fill"
                    style={{ display: "block" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(value / report.states[0][1]) * 100}%` }}
                    transition={{ duration: 0.55 }}
                  />
                </span>
                <strong className="a-num" style={{ minWidth: 84, textAlign: "right", fontSize: "0.8rem" }}>
                  {formatINR(value)}
                </strong>
              </li>
            ))}
          </ul>
          )}
        </Card>

        <Card title="Customer base" description="All time">
          <dl className="a-meta-grid">
            <div>
              <dt>Customers</dt>
              <dd>{formatNumber(customers.length)}</dd>
            </div>
            <div>
              <dt>Repeat rate</dt>
              <dd>
                {Math.round(
                  (customers.filter((customer) => customer.orders > 1).length / customers.length) * 100,
                )}
                %
              </dd>
            </div>
            <div>
              <dt>Products live</dt>
              <dd>{formatNumber(products.filter((product) => product.status === "active").length)}</dd>
            </div>
            <div>
              <dt>Units sold in range</dt>
              <dd>{formatNumber(report.units)}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </motion.div>
  );
}
