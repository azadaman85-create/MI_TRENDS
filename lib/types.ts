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
};

export type CartLine = {
  key: string;
  product: Product;
  size: string;
  color: ProductColor;
  quantity: number;
};
