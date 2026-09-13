"use client";

import { motion } from "framer-motion";
import { BadgePercent, Copy, Pause, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/admin/PageHeader";
import { KpiCard } from "@/components/admin/KpiCard";
import { Badge, CouponStatusBadge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { Input, Select } from "@/components/admin/ui/Field";
import { ConfirmDialog, Modal } from "@/components/admin/ui/Modal";
import { DataTable, type Column } from "@/components/admin/ui/DataTable";
import { formatDate, formatINR, formatNumber } from "@/lib/admin/format";
import { listVariants } from "@/lib/admin/motion";
import { useAdminStore } from "@/lib/admin/store";
import type { Coupon } from "@/lib/admin/types";

function blankCoupon(): Coupon {
  const now = new Date();
  const later = new Date();
  later.setDate(later.getDate() + 30);
  return {
    id: `CPN-${Date.now().toString(36)}`,
    code: "",
    type: "percent",
    value: 10,
    minimumSpend: 0,
    usage: 0,
    usageLimit: 1000,
    startsAt: now.toISOString(),
    expiresAt: later.toISOString(),
    status: "active",
  };
}

function describe(coupon: Coupon) {
  if (coupon.type === "percent") return `${coupon.value}% off`;
  if (coupon.type === "flat") return `${formatINR(coupon.value)} off`;
  return "Free shipping";
}

export default function CouponsPage() {
  const { coupons, saveCoupon, deleteCoupon, notify } = useAdminStore();
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Coupon | null>(null);

  const stats = useMemo(
    () => ({
      active: coupons.filter((coupon) => coupon.status === "active").length,
      redemptions: coupons.reduce((sum, coupon) => sum + coupon.usage, 0),
      scheduled: coupons.filter((coupon) => coupon.status === "scheduled").length,
    }),
    [coupons],
  );

  const columns: Column<Coupon>[] = [
    {
      id: "code",
      header: "Code",
      sortValue: (coupon) => coupon.code,
      render: (coupon) => (
        <span style={{ display: "grid", gap: 4 }}>
          <strong style={{ fontFamily: "var(--display)", fontSize: "0.95rem", letterSpacing: "-0.02em" }}>
            {coupon.code}
          </strong>
          <span className="a-cell-product__meta">{describe(coupon)}</span>
        </span>
      ),
    },
    {
      id: "minimum",
      header: "Minimum spend",
      align: "right",
      sortValue: (coupon) => coupon.minimumSpend,
      render: (coupon) => <span>{coupon.minimumSpend ? formatINR(coupon.minimumSpend) : "None"}</span>,
    },
    {
      id: "usage",
      header: "Redemptions",
      align: "right",
      sortValue: (coupon) => coupon.usage,
      render: (coupon) => (
        <span style={{ display: "grid", gap: 5, justifyItems: "end", minWidth: 110 }}>
          <span className="a-num" style={{ fontSize: "0.78rem" }}>
            {formatNumber(coupon.usage)} / {formatNumber(coupon.usageLimit)}
          </span>
          <span className="a-bar-track" style={{ width: 96 }}>
            <motion.span
              className="a-bar-fill"
              style={{ display: "block", background: coupon.usage / coupon.usageLimit > 0.85 ? "var(--red)" : "var(--ink)" }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (coupon.usage / coupon.usageLimit) * 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </span>
        </span>
      ),
    },
    {
      id: "window",
      header: "Active window",
      sortValue: (coupon) => coupon.expiresAt,
      render: (coupon) => (
        <span className="a-cell-product__meta">
          {formatDate(coupon.startsAt)} → {formatDate(coupon.expiresAt)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortValue: (coupon) => coupon.status,
      render: (coupon) => <CouponStatusBadge status={coupon.status} />,
    },
  ];

  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible">
      <PageHeader
        eyebrow="Selling"
        title="Coupons"
        description="Discount codes the checkout will accept, with live redemption counts."
        actions={
          <Button onClick={() => setEditing(blankCoupon())}>
            <Plus size={15} aria-hidden="true" />
            New coupon
          </Button>
        }
      />

      <motion.div className="a-kpi-grid" data-count="3" variants={listVariants}>
        <KpiCard label="Active codes" value={formatNumber(stats.active)} icon={<BadgePercent size={17} aria-hidden="true" />} accent="var(--green)" accentSoft="var(--green-soft)" />
        <KpiCard label="Total redemptions" value={formatNumber(stats.redemptions)} icon={<BadgePercent size={17} aria-hidden="true" />} />
        <KpiCard label="Scheduled" value={formatNumber(stats.scheduled)} icon={<Play size={17} aria-hidden="true" />} accent="#23459c" accentSoft="#e8eefb" />
      </motion.div>

      <Card flush>
        <DataTable
          rows={coupons}
          columns={columns}
          getRowId={(coupon) => coupon.id}
          pageSize={10}
          searchPlaceholder="Search codes…"
          searchValue={(coupon) => coupon.code}
          initialSort={{ column: "usage", direction: "desc" }}
          emptyTitle="No coupons yet"
          emptyMessage="Create a code to run your first campaign."
          emptyActionLabel="New coupon"
          onEmptyAction={() => setEditing(blankCoupon())}
          rowActions={(coupon) => (
            <>
              <button
                className="a-row-action"
                type="button"
                title="Copy code"
                aria-label={`Copy ${coupon.code}`}
                onClick={() => {
                  navigator.clipboard?.writeText(coupon.code);
                  notify("Code copied", "info", coupon.code);
                }}
              >
                <Copy size={15} aria-hidden="true" />
              </button>
              <button
                className="a-row-action"
                type="button"
                title={coupon.status === "paused" ? "Resume" : "Pause"}
                aria-label={coupon.status === "paused" ? `Resume ${coupon.code}` : `Pause ${coupon.code}`}
                onClick={() => {
                  saveCoupon({ ...coupon, status: coupon.status === "paused" ? "active" : "paused" });
                  notify(coupon.status === "paused" ? "Coupon resumed" : "Coupon paused", "info");
                }}
              >
                {coupon.status === "paused" ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
              </button>
              <button
                className="a-row-action"
                type="button"
                title="Edit"
                aria-label={`Edit ${coupon.code}`}
                onClick={() => setEditing(coupon)}
              >
                <Pencil size={15} aria-hidden="true" />
              </button>
              <button
                className="a-row-action a-row-action--danger"
                type="button"
                title="Delete"
                aria-label={`Delete ${coupon.code}`}
                onClick={() => setPendingDelete(coupon)}
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </>
          )}
        />
      </Card>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.code ? `Edit ${editing.code}` : "New coupon"}
        description="Codes are case-insensitive at checkout."
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!editing) return;
                if (editing.code.trim().length < 3) {
                  notify("Give the coupon a code", "error");
                  return;
                }
                saveCoupon({ ...editing, code: editing.code.toUpperCase() });
                notify("Coupon saved");
                setEditing(null);
              }}
            >
              Save coupon
            </Button>
          </>
        }
      >
        {editing ? (
          <div className="a-stack">
            <Input
              label="Code"
              value={editing.code}
              placeholder="DROP20"
              onChange={(event) => setEditing({ ...editing, code: event.target.value.toUpperCase().replace(/\s/g, "") })}
            />
            <div className="a-grid a-grid--2">
              <Select
                label="Discount type"
                value={editing.type}
                onChange={(event) => setEditing({ ...editing, type: event.target.value as Coupon["type"] })}
                options={[
                  { value: "percent", label: "Percentage off" },
                  { value: "flat", label: "Flat amount off" },
                  { value: "shipping", label: "Free shipping" },
                ]}
              />
              <Input
                label={editing.type === "percent" ? "Percentage" : "Amount"}
                type="number"
                prefix={editing.type === "percent" ? "%" : "₹"}
                value={editing.value}
                disabled={editing.type === "shipping"}
                onChange={(event) => setEditing({ ...editing, value: Number(event.target.value) })}
              />
            </div>
            <div className="a-grid a-grid--2">
              <Input
                label="Minimum spend"
                type="number"
                prefix="₹"
                value={editing.minimumSpend}
                onChange={(event) => setEditing({ ...editing, minimumSpend: Number(event.target.value) })}
              />
              <Input
                label="Usage limit"
                type="number"
                value={editing.usageLimit}
                onChange={(event) => setEditing({ ...editing, usageLimit: Number(event.target.value) })}
              />
            </div>
            <div className="a-grid a-grid--2">
              <Input
                label="Starts"
                type="date"
                value={editing.startsAt.slice(0, 10)}
                onChange={(event) => setEditing({ ...editing, startsAt: new Date(event.target.value).toISOString() })}
              />
              <Input
                label="Expires"
                type="date"
                value={editing.expiresAt.slice(0, 10)}
                onChange={(event) => setEditing({ ...editing, expiresAt: new Date(event.target.value).toISOString() })}
              />
            </div>
            <Select
              label="Status"
              value={editing.status}
              onChange={(event) => setEditing({ ...editing, status: event.target.value as Coupon["status"] })}
              options={[
                { value: "active", label: "Active" },
                { value: "scheduled", label: "Scheduled" },
                { value: "paused", label: "Paused" },
                { value: "expired", label: "Expired" },
              ]}
            />
            <p className="a-muted" style={{ fontSize: "0.74rem" }}>
              Preview: <Badge tone="yellow">{editing.code || "CODE"}</Badge> {describe(editing)}
              {editing.minimumSpend ? ` on orders above ${formatINR(editing.minimumSpend)}` : ""}
            </p>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete coupon"
        message={`${pendingDelete?.code ?? "This coupon"} will stop working at checkout immediately.`}
        confirmLabel="Delete"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            deleteCoupon(pendingDelete.id);
            notify("Coupon deleted", "info");
          }
          setPendingDelete(null);
        }}
      />
    </motion.div>
  );
}
