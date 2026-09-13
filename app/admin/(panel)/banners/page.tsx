"use client";

import { AnimatePresence, Reorder, motion } from "framer-motion";
import { GripVertical, Images, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { Input, Select } from "@/components/admin/ui/Field";
import { ConfirmDialog, Modal } from "@/components/admin/ui/Modal";
import { EmptyState } from "@/components/admin/ui/States";
import { formatDate } from "@/lib/admin/format";
import { listVariants, riseVariants } from "@/lib/admin/motion";
import { useAdminStore } from "@/lib/admin/store";
import type { Banner } from "@/lib/admin/types";

function blankBanner(): Banner {
  const now = new Date();
  const later = new Date();
  later.setDate(later.getDate() + 21);
  return {
    id: `BNR-${Date.now().toString(36)}`,
    title: "",
    subtitle: "",
    placement: "hero",
    imageUrl: "",
    link: "/shop",
    status: "draft",
    startsAt: now.toISOString(),
    endsAt: later.toISOString(),
    sortOrder: 99,
  };
}

const statusTone = { live: "success", scheduled: "info", draft: "quiet" } as const;

export default function BannersPage() {
  const { banners, saveBanner, deleteBanner, notify } = useAdminStore();
  const [editing, setEditing] = useState<Banner | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Banner | null>(null);

  // Order comes straight from the store so a drag persists immediately.
  const order = useMemo(() => [...banners].sort((a, b) => a.sortOrder - b.sortOrder), [banners]);

  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible">
      <PageHeader
        eyebrow="Storefront"
        title="Banners"
        description="Hero slides, promo strips and campaign tiles. Drag to set the order customers see them in."
        actions={
          <Button onClick={() => setEditing(blankBanner())}>
            <Plus size={15} aria-hidden="true" />
            New banner
          </Button>
        }
      />

      {order.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Images size={23} aria-hidden="true" />}
            title="No banners yet"
            message="Add a hero slide to take over the top of the homepage."
            actionLabel="New banner"
            onAction={() => setEditing(blankBanner())}
          />
        </Card>
      ) : (
        <Reorder.Group
          axis="y"
          values={order}
          onReorder={(next) => next.forEach((banner, index) => saveBanner({ ...banner, sortOrder: index + 1 }))}
          className="a-stack"
          as="div"
        >
          <AnimatePresence initial={false}>
            {order.map((banner) => (
              <Reorder.Item key={banner.id} value={banner} as="div" whileDrag={{ scale: 1.01, zIndex: 3 }}>
                <motion.article
                  className="a-card"
                  variants={riseVariants}
                  style={{ display: "grid", gridTemplateColumns: "28px 172px minmax(0, 1fr) auto", alignItems: "center", gap: 16, padding: 14 }}
                >
                  <span className="a-muted" style={{ display: "grid", placeItems: "center", cursor: "grab" }} aria-hidden="true">
                    <GripVertical size={17} />
                  </span>

                  <span
                    style={{
                      aspectRatio: "16 / 9",
                      overflow: "hidden",
                      borderRadius: "var(--radius)",
                      background: "var(--surface-2)",
                    }}
                  >
                    {banner.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={banner.imageUrl}
                        alt=""
                        loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--ink-mute)" }}>
                        <Images size={20} aria-hidden="true" />
                      </span>
                    )}
                  </span>

                  <span style={{ display: "grid", gap: 6, minWidth: 0 }}>
                    <span className="a-row" style={{ gap: 8, flexWrap: "wrap" }}>
                      <strong style={{ fontSize: "0.9rem" }}>{banner.title || "Untitled banner"}</strong>
                      <Badge tone={statusTone[banner.status]} dot>
                        {banner.status}
                      </Badge>
                      <Badge tone="quiet">{banner.placement}</Badge>
                    </span>
                    <span className="a-muted" style={{ fontSize: "0.76rem" }}>
                      {banner.subtitle}
                    </span>
                    <span className="a-cell-product__meta">
                      {banner.link} · {formatDate(banner.startsAt)} → {formatDate(banner.endsAt)}
                    </span>
                  </span>

                  <span className="a-row" style={{ gap: 4 }}>
                    <button
                      className="a-row-action"
                      type="button"
                      style={{ opacity: 1 }}
                      title="Edit"
                      aria-label={`Edit ${banner.title}`}
                      onClick={() => setEditing(banner)}
                    >
                      <Pencil size={15} aria-hidden="true" />
                    </button>
                    <button
                      className="a-row-action a-row-action--danger"
                      type="button"
                      style={{ opacity: 1 }}
                      title="Delete"
                      aria-label={`Delete ${banner.title}`}
                      onClick={() => setPendingDelete(banner)}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </span>
                </motion.article>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.title ? "Edit banner" : "New banner"}
        description="Banners inherit the storefront's type scale automatically."
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!editing) return;
                if (editing.title.trim().length < 3) {
                  notify("Banner needs a title", "error");
                  return;
                }
                saveBanner(editing);
                notify("Banner saved");
                setEditing(null);
              }}
            >
              Save banner
            </Button>
          </>
        }
      >
        {editing ? (
          <div className="a-stack">
            <Input
              label="Headline"
              value={editing.title}
              placeholder="Loud after lights out."
              onChange={(event) => setEditing({ ...editing, title: event.target.value })}
            />
            <Input
              label="Supporting line"
              value={editing.subtitle}
              placeholder="Drop 01 · Afterdark"
              onChange={(event) => setEditing({ ...editing, subtitle: event.target.value })}
            />
            <Input
              label="Image path"
              value={editing.imageUrl}
              placeholder="/images/hero-afterdark.jpg"
              hint="Any file in /public works. Leave blank for a text-only strip."
              onChange={(event) => setEditing({ ...editing, imageUrl: event.target.value })}
            />
            <Input
              label="Links to"
              value={editing.link}
              placeholder="/shop?tag=new"
              onChange={(event) => setEditing({ ...editing, link: event.target.value })}
            />
            <div className="a-grid a-grid--2">
              <Select
                label="Placement"
                value={editing.placement}
                onChange={(event) => setEditing({ ...editing, placement: event.target.value as Banner["placement"] })}
                options={[
                  { value: "hero", label: "Homepage hero" },
                  { value: "strip", label: "Announcement strip" },
                  { value: "category", label: "Category tile" },
                  { value: "popup", label: "Popup" },
                ]}
              />
              <Select
                label="Status"
                value={editing.status}
                onChange={(event) => setEditing({ ...editing, status: event.target.value as Banner["status"] })}
                options={[
                  { value: "live", label: "Live" },
                  { value: "scheduled", label: "Scheduled" },
                  { value: "draft", label: "Draft" },
                ]}
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
                label="Ends"
                type="date"
                value={editing.endsAt.slice(0, 10)}
                onChange={(event) => setEditing({ ...editing, endsAt: new Date(event.target.value).toISOString() })}
              />
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete banner"
        message={`${pendingDelete?.title ?? "This banner"} will be removed from the storefront.`}
        confirmLabel="Delete"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            deleteBanner(pendingDelete.id);
            notify("Banner deleted", "info");
          }
          setPendingDelete(null);
        }}
      />
    </motion.div>
  );
}
