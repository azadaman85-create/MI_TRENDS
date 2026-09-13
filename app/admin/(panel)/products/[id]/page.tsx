"use client";

import { PackageSearch } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { ProductEditor } from "@/components/admin/ProductEditor";
import { CardSkeleton } from "@/components/admin/ui/States";
import { EmptyState } from "@/components/admin/ui/States";
import { useAdminStore } from "@/lib/admin/store";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { products, hydrated } = useAdminStore();
  const product = products.find((entry) => String(entry.id) === params.id);

  if (!hydrated) {
    return (
      <div className="a-stack">
        <CardSkeleton height={90} />
        <CardSkeleton height={220} />
      </div>
    );
  }

  if (!product) {
    return (
      <EmptyState
        icon={<PackageSearch size={24} aria-hidden="true" />}
        title="Product not found"
        message="This product may have been deleted. Head back to the catalogue to pick another one."
        actionLabel="Back to products"
        onAction={() => router.push("/admin/products")}
      />
    );
  }

  return <ProductEditor key={product.id} product={product} mode="edit" />;
}
