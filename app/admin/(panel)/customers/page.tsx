"use client";

import { motion } from "framer-motion";
import { Crown, Eye, Mail, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/admin/PageHeader";
import { KpiCard } from "@/components/admin/KpiCard";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { DataTable, type Column } from "@/components/admin/ui/DataTable";
import { Tabs } from "@/components/admin/ui/Tabs";
import { formatDate, formatINR, formatNumber, formatRelative } from "@/lib/admin/format";
import { listVariants } from "@/lib/admin/motion";
import { useAdminStore } from "@/lib/admin/store";
import type { Customer } from "@/lib/admin/types";

const tierTone = { vip: "yellow", regular: "info", new: "quiet" } as const;

export default function CustomersPage() {
  const router = useRouter();
  const { customers, orders, notify } = useAdminStore();
  const [tier, setTier] = useState("all");

  const rows = useMemo(
    () => (tier === "all" ? customers : customers.filter((customer) => customer.tier === tier)),
    [customers, tier],
  );

  const stats = useMemo(() => {
    const spend = customers.reduce((sum, customer) => sum + customer.spend, 0);
    return {
      total: customers.length,
      vip: customers.filter((customer) => customer.tier === "vip").length,
      repeat: customers.filter((customer) => customer.orders > 1).length,
      averageSpend: customers.length ? spend / customers.length : 0,
    };
  }, [customers]);

  const columns: Column<Customer>[] = [
    {
      id: "name",
      header: "Customer",
      sortValue: (customer) => customer.name,
      render: (customer) => (
        <div className="a-cell-product" style={{ minWidth: 200 }}>
          <span className="admin-avatar">{customer.name.slice(0, 1)}</span>
          <span className="a-cell-product__copy">
            <Link href={`/admin/customers/${customer.id}`} className="a-cell-product__name">
              {customer.name}
            </Link>
            <span className="a-cell-product__meta">{customer.email}</span>
          </span>
        </div>
      ),
    },
    {
      id: "location",
      header: "Location",
      sortValue: (customer) => customer.city,
      render: (customer) => (
        <span className="a-cell-product__meta">
          {customer.city}, {customer.state}
        </span>
      ),
    },
    {
      id: "orders",
      header: "Orders",
      align: "right",
      sortValue: (customer) => customer.orders,
      render: (customer) => <span>{customer.orders}</span>,
    },
    {
      id: "spend",
      header: "Lifetime spend",
      align: "right",
      sortValue: (customer) => customer.spend,
      render: (customer) => <strong>{formatINR(customer.spend)}</strong>,
    },
    {
      id: "tier",
      header: "Tier",
      sortValue: (customer) => customer.tier,
      render: (customer) => (
        <Badge tone={tierTone[customer.tier]} dot={customer.tier !== "vip"}>
          {customer.tier === "vip" ? <Crown size={11} aria-hidden="true" /> : null}
          {customer.tier}
        </Badge>
      ),
    },
    {
      id: "last",
      header: "Last order",
      sortValue: (customer) => customer.lastOrderAt ?? "",
      render: (customer) => (
        <span className="a-muted" style={{ fontSize: "0.74rem" }}>
          {customer.lastOrderAt ? formatRelative(customer.lastOrderAt) : "Never"}
        </span>
      ),
    },
    {
      id: "joined",
      header: "Joined",
      sortValue: (customer) => customer.joinedAt,
      render: (customer) => (
        <span className="a-muted" style={{ fontSize: "0.74rem" }}>
          {formatDate(customer.joinedAt)}
        </span>
      ),
    },
  ];

  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible">
      <PageHeader
        eyebrow="Selling"
        title="Customers"
        description="Who is buying, how often, and what they are worth to the store."
        actions={
          <Button
            variant="outline"
            onClick={() => notify("Segment saved", "info", "Segments would sync to your email tool in production.")}
          >
            <Mail size={15} aria-hidden="true" />
            Email segment
          </Button>
        }
      />

      <motion.div className="a-kpi-grid" data-count="4" variants={listVariants}>
        <KpiCard label="Customers" value={formatNumber(stats.total)} icon={<Users size={17} aria-hidden="true" />} />
        <KpiCard
          label="VIP customers"
          value={formatNumber(stats.vip)}
          caption="Spend above ₹12,000"
          icon={<Crown size={17} aria-hidden="true" />}
          accent="#8a6100"
          accentSoft="#fff6d4"
        />
        <KpiCard
          label="Repeat buyers"
          value={formatNumber(stats.repeat)}
          caption={`${Math.round((stats.repeat / stats.total) * 100)}% of all customers`}
          icon={<UserPlus size={17} aria-hidden="true" />}
          accent="var(--green)"
          accentSoft="var(--green-soft)"
        />
        <KpiCard
          label="Average lifetime spend"
          value={formatINR(stats.averageSpend)}
          icon={<Users size={17} aria-hidden="true" />}
          accent="var(--red)"
          accentSoft="#fdeeeb"
        />
      </motion.div>

      <Card flush>
        <div style={{ padding: "0 16px" }}>
          <Tabs
            layoutId="customers-tier"
            active={tier}
            onChange={setTier}
            items={[
              { id: "all", label: "All", count: customers.length },
              { id: "vip", label: "VIP", count: stats.vip },
              { id: "regular", label: "Regular", count: customers.filter((customer) => customer.tier === "regular").length },
              { id: "new", label: "New", count: customers.filter((customer) => customer.tier === "new").length },
            ]}
          />
        </div>

        <DataTable
          rows={rows}
          columns={columns}
          getRowId={(customer) => customer.id}
          pageSize={10}
          searchPlaceholder="Search by name, email or city…"
          searchValue={(customer) => `${customer.name} ${customer.email} ${customer.city} ${customer.phone}`}
          initialSort={{ column: "spend", direction: "desc" }}
          onRowClick={(customer) => router.push(`/admin/customers/${customer.id}`)}
          emptyTitle="No customers yet"
          emptyMessage="Customers appear here the moment they place their first order."
          rowActions={(customer) => (
            <Link
              className="a-row-action"
              href={`/admin/customers/${customer.id}`}
              aria-label={`Open ${customer.name}`}
              title="Open profile"
            >
              <Eye size={15} aria-hidden="true" />
            </Link>
          )}
        />
      </Card>

      <p className="a-muted" style={{ marginTop: 14, fontSize: "0.72rem" }}>
        {orders.length} orders across {customers.length} customers in the current data set.
      </p>
    </motion.div>
  );
}
