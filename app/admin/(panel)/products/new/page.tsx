"use client";

import { useMemo } from "react";

import { ProductEditor } from "@/components/admin/ProductEditor";
import { collections } from "@/lib/catalog";
import { useAdminStore } from "@/lib/admin/store";
import type { AdminProduct } from "@/lib/admin/types";

export default function NewProductPage() {
  const { products } = useAdminStore();

  const blank = useMemo<AdminProduct>(() => {
    const collection = collections[0];
    const nextId = products.length ? Math.max(...products.map((product) => product.id)) + 1 : 1001;
    const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
    const now = new Date().toISOString();

    return {
      id: nextId,
      slug: "",
      name: "",
      collection: collection.name,
      collectionSlug: collection.slug,
      type: "Graphic T-shirt",
      category: "unisex",
      colors: collection.colors.map((color) => ({ ...color })),
      sizes,
      outOfStock: [],
      mrp: 1499,
      price: 1199,
      discount: 20,
      rating: 0,
      reviewCount: 0,
      tags: ["new"],
      popularity: 500,
      fit: "Relaxed",
      fabric: "240 GSM combed cotton",
      sku: `MIT-NEW-${String(nextId).slice(-3)}`,
      art: `${collection.motif} · New edition`,
      palette: [...collection.palette],
      status: "draft",
      featured: false,
      stock: Object.fromEntries(sizes.map((size) => [size, 0])),
      costPrice: 480,
      createdAt: now,
      updatedAt: now,
      seoTitle: "",
      seoDescription: "",
      images: [],
      description: "",
    };
  }, [products]);

  return <ProductEditor product={blank} mode="create" />;
}
