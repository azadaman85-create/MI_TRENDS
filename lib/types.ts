export type ProductColor = {
  name: string;
  hex: string;
};

export type Product = {
  id: number;
  slug: string;
  name: string;
  collection: string;
  collectionSlug: string;
  type: string;
  category: "men" | "women" | "unisex";
  colors: ProductColor[];
  sizes: string[];
  outOfStock: string[];
  mrp: number;
  price: number;
  discount: number;
  rating: number;
  reviewCount: number;
  tags: ("new" | "bestseller" | "sale")[];
  popularity: number;
  fit: string;
  fabric: string;
  sku: string;
  art: string;
  palette: [string, string, string];
  imageUrl?: string;
  backImageUrl?: string;
  /** Units on hand per size. Drives the "only N left" nudge on the product page. */
  stock?: Record<string, number>;
};

export type CartLine = {
  key: string;
  product: Product;
  size: string;
  color: ProductColor;
  quantity: number;
};
