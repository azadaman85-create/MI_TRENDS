import type { Product } from "@/lib/types";

export type ProductStatus = "active" | "draft" | "archived";

/** A catalogue product plus the fields only the admin panel cares about. */
export type AdminProduct = Product & {
  status: ProductStatus;
  featured: boolean;
  stock: Record<string, number>;
  costPrice: number;
  updatedAt: string;
  createdAt: string;
  seoTitle: string;
  seoDescription: string;
  images: string[];
  description: string;
};

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export type PaymentMode = "upi" | "card" | "netbanking" | "cod";

export type OrderLine = {
  productId: number;
  name: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  imageUrl?: string;
};

export type Order = {
  id: string;
  customerId: string;
  customerName: string;
  email: string;
  phone: string;
  placedAt: string;
  status: OrderStatus;
  payment: PaymentMode;
  paid: boolean;
  lines: OrderLine[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode: string | null;
  address: {
    line1: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
  };
  timeline: { label: string; at: string; done: boolean }[];
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  joinedAt: string;
  orders: number;
  spend: number;
  tier: "new" | "regular" | "vip";
  lastOrderAt: string | null;
};

export type Review = {
  id: string;
  productId: number;
  productName: string;
  customerName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  status: "pending" | "published" | "rejected";
};

export type Coupon = {
  id: string;
  code: string;
  type: "percent" | "flat" | "shipping";
  value: number;
  minimumSpend: number;
  usage: number;
  usageLimit: number;
  startsAt: string;
  expiresAt: string;
  status: "active" | "scheduled" | "expired" | "paused";
};

export type Banner = {
  id: string;
  title: string;
  subtitle: string;
  placement: "hero" | "strip" | "category" | "popup";
  imageUrl: string;
  link: string;
  status: "live" | "scheduled" | "draft";
  startsAt: string;
  endsAt: string;
  sortOrder: number;
};

export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  parent: string | null;
  productCount: number;
  status: "visible" | "hidden";
  description: string;
};

export type SalesPoint = {
  label: string;
  revenue: number;
  orders: number;
};

export type ActivityItem = {
  id: string;
  kind: "order" | "product" | "customer" | "review" | "stock";
  message: string;
  at: string;
};
