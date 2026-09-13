"use client";

import { motion } from "framer-motion";
import { Eye, EyeOff, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { Input, Select, Textarea } from "@/components/admin/ui/Field";
import { ConfirmDialog, Modal } from "@/components/admin/ui/Modal";
import { DataTable, type Column } from "@/components/admin/ui/DataTable";
import { formatNumber } from "@/lib/admin/format";
import { listVariants } from "@/lib/admin/motion";
import { useAdminStore } from "@/lib/admin/store";
import type { CategoryNode } from "@/lib/admin/types";

function blankCategory(): CategoryNode {
  return {
    id: `CAT-${Date.now().toString(36)}`,
    name: "",
    slug: "",
    parent: null,
    productCount: 0,
    status: "visible",
    description: "",
  };
}

export default function CategoriesPage() {
  const { categories, saveCategory, deleteCategory, notify } = useAdminStore();
  const [editing, setEditing] = useState<CategoryNode | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CategoryNode | null>(null);

  const parents = useMemo(() => categories.filter((category) => category.parent === null), [categories]);

  const columns: Column<CategoryNode>[] = [
    {
      id: "name",
      header: "Category",
      sortValue: (category) => category.name,
      render: (category) => (
        <span style={{ display: "grid", gap: 3 }}>
          <strong style={{ fontSize: "0.84rem" }}>
            {category.parent ? "↳ " : ""}
            {category.name}
          </strong>
          <span className="a-cell-product__meta">/{category.slug}</span>
        </span>
      ),
    },
    {
      id: "parent",
      header: "Parent",
      sortValue: (category) => category.parent ?? "",
      render: (category) => (
        <span className="a-cell-product__meta">
          {category.parent ? categories.find((entry) => entry.id === category.parent)?.name ?? "—" : "Top level"}
        </span>
      ),
    },
    {
      id: "products",
      header: "Products",
      align: "right",
      sortValue: (category) => category.productCount,
      render: (category) => <span>{formatNumber(category.productCount)}</span>,
    },
    {
      id: "status",
      header: "Visibility",
      sortValue: (category) => category.status,
      render: (category) => (
        <Badge tone={category.status === "visible" ? "success" : "quiet"} dot>
          {category.status}
        </Badge>
      ),
    },
  ];

  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible">
      <PageHeader
        eyebrow="Catalogue"
        title="Categories"
        description="The navigation spine of the storefront. Hide a category to pull it from the mega menu without deleting it."
        actions={
          <Button onClick={() => setEditing(blankCategory())}>
            <Plus size={15} aria-hidden="true" />
            New category
          </Button>
        }
      />

      <Card flush>
        <DataTable
          rows={categories}
          columns={columns}
          getRowId={(category) => category.id}
          pageSize={12}
          searchPlaceholder="Search categories…"
          searchValue={(category) => `${category.name} ${category.slug}`}
          emptyTitle="No categories"
          emptyMessage="Add a category so products have somewhere to live in the menu."
          emptyActionLabel="New category"
          onEmptyAction={() => setEditing(blankCategory())}
          rowActions={(category) => (
            <>
              <button
                className="a-row-action"
                type="button"
                title={category.status === "visible" ? "Hide" : "Show"}
                aria-label={category.status === "visible" ? `Hide ${category.name}` : `Show ${category.name}`}
                onClick={() => {
                  saveCategory({ ...category, status: category.status === "visible" ? "hidden" : "visible" });
                  notify(category.status === "visible" ? "Category hidden" : "Category visible", "info");
                }}
              >
                {category.status === "visible" ? <Eye size={15} aria-hidden="true" /> : <EyeOff size={15} aria-hidden="true" />}
              </button>
              <button
                className="a-row-action"
                type="button"
                title="Edit"
                aria-label={`Edit ${category.name}`}
                onClick={() => setEditing(category)}
              >
                <Pencil size={15} aria-hidden="true" />
              </button>
              <button
                className="a-row-action a-row-action--danger"
                type="button"
                title="Delete"
                aria-label={`Delete ${category.name}`}
                onClick={() => setPendingDelete(category)}
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
        title={editing?.name ? "Edit category" : "New category"}
        description="Categories drive the storefront navigation and filters."
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!editing) return;
                if (editing.name.trim().length < 2) {
                  notify("Category needs a name", "error");
                  return;
                }
                saveCategory({
                  ...editing,
                  slug: editing.slug || editing.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                });
                notify("Category saved");
                setEditing(null);
              }}
            >
              Save category
            </Button>
          </>
        }
      >
        {editing ? (
          <div className="a-stack">
            <Input
              label="Name"
              value={editing.name}
              placeholder="Oversized tees"
              onChange={(event) => setEditing({ ...editing, name: event.target.value })}
            />
            <Input
              label="Slug"
              value={editing.slug}
              placeholder="oversized-tees"
              onChange={(event) =>
                setEditing({ ...editing, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-") })
              }
            />
            <Select
              label="Parent category"
              value={editing.parent ?? ""}
              onChange={(event) => setEditing({ ...editing, parent: event.target.value || null })}
              options={[{ value: "", label: "Top level" }, ...parents.map((parent) => ({ value: parent.id, label: parent.name }))]}
            />
            <Textarea
              label="Description"
              rows={3}
              value={editing.description}
              onChange={(event) => setEditing({ ...editing, description: event.target.value })}
            />
            <Select
              label="Visibility"
              value={editing.status}
              onChange={(event) => setEditing({ ...editing, status: event.target.value as CategoryNode["status"] })}
              options={[
                { value: "visible", label: "Visible in navigation" },
                { value: "hidden", label: "Hidden" },
              ]}
            />
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete category"
        message={`${pendingDelete?.name ?? "This category"} will be removed from the navigation. Products keep their other tags.`}
        confirmLabel="Delete"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            deleteCategory(pendingDelete.id);
            notify("Category deleted", "info");
          }
          setPendingDelete(null);
        }}
      />

      <p className="a-muted" style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, fontSize: "0.72rem" }}>
        <Tags size={13} aria-hidden="true" />
        Product counts come from the live catalogue and update as products move between categories.
      </p>
    </motion.div>
  );
}
