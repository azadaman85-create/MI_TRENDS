import type { Product, ProductColor } from "@/lib/types";

export type Collection = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  motif: string;
  palette: [string, string, string];
  colors: [ProductColor, ProductColor, ProductColor];
};

export type Category = {
  name: string;
  slug: "men" | "women" | "unisex";
  description: string;
};

export const collections: Collection[] = [
  {
    name: "Everyday Icons",
    slug: "everyday-icons",
    tagline: "The shirts and tees you reach for first.",
    description:
      "Clean cuts in honest cotton — the men's staples that carry a whole week without trying.",
    motif: "Clean lines",
    palette: ["#131313", "#ef3f2f", "#f3f0ea"],
    colors: [
      { name: "Optic White", hex: "#f4f4f2" },
      { name: "Midnight Black", hex: "#17181a" },
      { name: "Sky Blue", hex: "#9db9d8" },
    ],
  },
  {
    name: "Soft Nights",
    slug: "soft-nights",
    tagline: "Sleepwear worth staying in for.",
    description:
      "Women's pyjama sets in brushed flannel, cotton check and washed satin — cut loose, finished properly.",
    motif: "Soft focus",
    palette: ["#8a4a5c", "#f0c5cd", "#fdf6f3"],
    colors: [
      { name: "Rosewood", hex: "#a8455a" },
      { name: "Blush", hex: "#efc3c8" },
      { name: "Lilac Mist", hex: "#cfcbe4" },
    ],
  },
];

export const categories: Category[] = [
  { name: "Men", slug: "men", description: "Everyday tees and shirts in honest cotton." },
  { name: "Women", slug: "women", description: "Pyjama sets made for slow mornings." },
  { name: "Unisex", slug: "unisex", description: "No-rule staples made to be worn your way." },
];

const TOP_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const IMAGES = "/images/products";

/**
 * The live catalogue. Ten products, written out by hand rather than generated, so the
 * storefront and the admin panel show exactly what the store actually stocks.
 * Photography: Unsplash (free licence), stored locally under public/images/products.
 */
export const products: Product[] = [
  {
    id: 1001,
    slug: "everyday-white-crew-tee",
    name: "Everyday White Crew Tee",
    collection: "Everyday Icons",
    collectionSlug: "everyday-icons",
    type: "T-shirt",
    category: "men",
    colors: [
      { name: "Optic White", hex: "#f4f4f2" },
      { name: "Midnight Black", hex: "#17181a" },
      { name: "Ash Grey", hex: "#9a9a98" },
    ],
    sizes: TOP_SIZES,
    outOfStock: ["XS"],
    mrp: 1299,
    price: 899,
    discount: 31,
    rating: 4.6,
    reviewCount: 218,
    tags: ["bestseller", "sale"],
    popularity: 980,
    fit: "Regular everyday fit",
    fabric: "180 GSM combed cotton jersey",
    sku: "MIT-TEE-01",
    art: "Clean lines · No print",
    palette: ["#131313", "#ef3f2f", "#f3f0ea"],
    imageUrl: `${IMAGES}/tee-01-a.jpg`,
    backImageUrl: `${IMAGES}/tee-01-b.jpg`,
  },
  {
    id: 1002,
    slug: "signature-colour-tee",
    name: "Signature Colour Tee",
    collection: "Everyday Icons",
    collectionSlug: "everyday-icons",
    type: "T-shirt",
    category: "men",
    colors: [
      { name: "Signal Red", hex: "#b6202a" },
      { name: "Deep Navy", hex: "#1f3357" },
      { name: "Mustard", hex: "#e0b12c" },
    ],
    sizes: TOP_SIZES,
    outOfStock: [],
    mrp: 1099,
    price: 799,
    discount: 27,
    rating: 4.4,
    reviewCount: 143,
    tags: ["new", "sale"],
    popularity: 910,
    fit: "Regular everyday fit",
    fabric: "180 GSM bio-washed cotton",
    sku: "MIT-TEE-02",
    art: "Clean lines · Solid dye",
    palette: ["#131313", "#ef3f2f", "#f3f0ea"],
    imageUrl: `${IMAGES}/tee-02-a.jpg`,
    backImageUrl: `${IMAGES}/tee-02-b.jpg`,
  },
  {
    id: 1003,
    slug: "midnight-black-tee",
    name: "Midnight Black Tee",
    collection: "Everyday Icons",
    collectionSlug: "everyday-icons",
    type: "T-shirt",
    category: "men",
    colors: [
      { name: "Midnight Black", hex: "#17181a" },
      { name: "Forest", hex: "#25402f" },
    ],
    sizes: TOP_SIZES,
    outOfStock: ["XXL"],
    mrp: 1399,
    price: 1049,
    discount: 25,
    rating: 4.7,
    reviewCount: 96,
    tags: ["new"],
    popularity: 870,
    fit: "Relaxed fit",
    fabric: "200 GSM combed cotton jersey",
    sku: "MIT-TEE-03",
    art: "Clean lines · Garment dyed",
    palette: ["#131313", "#ef3f2f", "#f3f0ea"],
    imageUrl: `${IMAGES}/tee-03-a.jpg`,
    backImageUrl: `${IMAGES}/tee-03-b.jpg`,
  },
  {
    id: 1004,
    slug: "sharp-white-shirt",
    name: "Sharp White Shirt",
    collection: "Everyday Icons",
    collectionSlug: "everyday-icons",
    type: "Shirt",
    category: "men",
    colors: [
      { name: "Optic White", hex: "#f4f4f2" },
      { name: "Sand", hex: "#d8cbb4" },
    ],
    sizes: TOP_SIZES,
    outOfStock: [],
    mrp: 2299,
    price: 1799,
    discount: 22,
    rating: 4.5,
    reviewCount: 74,
    tags: ["bestseller"],
    popularity: 840,
    fit: "Slim-through-the-body fit",
    fabric: "Wrinkle-resistant cotton poplin",
    sku: "MIT-SHT-01",
    art: "Clean lines · Hidden placket",
    palette: ["#131313", "#ef3f2f", "#f3f0ea"],
    imageUrl: `${IMAGES}/shirt-01-a.jpg`,
    backImageUrl: `${IMAGES}/shirt-01-b.jpg`,
  },
  {
    id: 1005,
    slug: "blue-pinstripe-shirt",
    name: "Blue Pinstripe Shirt",
    collection: "Everyday Icons",
    collectionSlug: "everyday-icons",
    type: "Shirt",
    category: "men",
    colors: [
      { name: "Sky Blue", hex: "#9db9d8" },
      { name: "Optic White", hex: "#f4f4f2" },
    ],
    sizes: TOP_SIZES,
    outOfStock: ["XS", "S"],
    mrp: 2499,
    price: 2099,
    discount: 16,
    rating: 4.3,
    reviewCount: 51,
    tags: ["new"],
    popularity: 760,
    fit: "Regular office fit",
    fabric: "Yarn-dyed cotton with a soft finish",
    sku: "MIT-SHT-02",
    art: "Clean lines · Fine stripe",
    palette: ["#131313", "#ef3f2f", "#f3f0ea"],
    imageUrl: `${IMAGES}/shirt-02-a.jpg`,
    backImageUrl: `${IMAGES}/shirt-02-b.jpg`,
  },
  {
    id: 2001,
    slug: "red-check-flannel-pyjama-set",
    name: "Red Check Flannel Pyjama Set",
    collection: "Soft Nights",
    collectionSlug: "soft-nights",
    type: "Pyjama Set",
    category: "women",
    colors: [
      { name: "Rosewood", hex: "#a8455a" },
      { name: "Forest Check", hex: "#2f4a3a" },
    ],
    sizes: TOP_SIZES,
    outOfStock: [],
    mrp: 2499,
    price: 1699,
    discount: 32,
    rating: 4.8,
    reviewCount: 164,
    tags: ["bestseller", "sale"],
    popularity: 950,
    fit: "Relaxed two-piece set",
    fabric: "Brushed cotton flannel",
    sku: "MIT-PJ-01",
    art: "Soft focus · Tartan check",
    palette: ["#8a4a5c", "#f0c5cd", "#fdf6f3"],
    imageUrl: `${IMAGES}/pj-01-a.jpg`,
    backImageUrl: `${IMAGES}/pj-01-b.jpg`,
  },
  {
    id: 2002,
    slug: "blush-gingham-pyjama-set",
    name: "Blush Gingham Pyjama Set",
    collection: "Soft Nights",
    collectionSlug: "soft-nights",
    type: "Pyjama Set",
    category: "women",
    colors: [
      { name: "Blush", hex: "#efc3c8" },
      { name: "Sky Check", hex: "#b8cee0" },
    ],
    sizes: TOP_SIZES,
    outOfStock: ["XXL"],
    mrp: 2199,
    price: 1599,
    discount: 27,
    rating: 4.6,
    reviewCount: 118,
    tags: ["new", "sale"],
    popularity: 900,
    fit: "Relaxed two-piece set",
    fabric: "Yarn-dyed cotton check",
    sku: "MIT-PJ-02",
    art: "Soft focus · Gingham",
    palette: ["#8a4a5c", "#f0c5cd", "#fdf6f3"],
    imageUrl: `${IMAGES}/pj-02-a.jpg`,
    backImageUrl: `${IMAGES}/pj-02-b.jpg`,
  },
  {
    id: 2003,
    slug: "rose-bloom-pyjama-set",
    name: "Rose Bloom Pyjama Set",
    collection: "Soft Nights",
    collectionSlug: "soft-nights",
    type: "Pyjama Set",
    category: "women",
    colors: [
      { name: "Rose Print", hex: "#d13a52" },
      { name: "Peach Bloom", hex: "#f3b7a6" },
    ],
    sizes: TOP_SIZES,
    outOfStock: [],
    mrp: 2699,
    price: 2199,
    discount: 19,
    rating: 4.7,
    reviewCount: 87,
    tags: ["new"],
    popularity: 880,
    fit: "Loose co-ord set",
    fabric: "Airy viscose with a satin touch",
    sku: "MIT-PJ-03",
    art: "Soft focus · Floral",
    palette: ["#8a4a5c", "#f0c5cd", "#fdf6f3"],
    imageUrl: `${IMAGES}/pj-03-a.jpg`,
    backImageUrl: `${IMAGES}/pj-03-b.jpg`,
  },
  {
    id: 2004,
    slug: "powder-blue-pyjama-set",
    name: "Powder Blue Pyjama Set",
    collection: "Soft Nights",
    collectionSlug: "soft-nights",
    type: "Pyjama Set",
    category: "women",
    colors: [
      { name: "Powder Blue", hex: "#bdd3e6" },
      { name: "Ivory", hex: "#f2ece1" },
    ],
    sizes: TOP_SIZES,
    outOfStock: ["XS"],
    mrp: 1999,
    price: 1399,
    discount: 30,
    rating: 4.4,
    reviewCount: 63,
    tags: ["sale"],
    popularity: 820,
    fit: "Classic piped set",
    fabric: "Cotton-modal jacquard",
    sku: "MIT-PJ-04",
    art: "Soft focus · Piped trim",
    palette: ["#8a4a5c", "#f0c5cd", "#fdf6f3"],
    imageUrl: `${IMAGES}/pj-04-a.jpg`,
    backImageUrl: `${IMAGES}/pj-04-b.jpg`,
  },
  {
    id: 2005,
    slug: "lilac-satin-pyjama-set",
    name: "Lilac Satin Pyjama Set",
    collection: "Soft Nights",
    collectionSlug: "soft-nights",
    type: "Pyjama Set",
    category: "women",
    colors: [
      { name: "Lilac Mist", hex: "#cfcbe4" },
      { name: "Champagne", hex: "#e8dcc8" },
    ],
    sizes: TOP_SIZES,
    outOfStock: [],
    mrp: 3199,
    price: 2599,
    discount: 19,
    rating: 4.9,
    reviewCount: 42,
    tags: ["new", "bestseller"],
    popularity: 930,
    fit: "Fluid satin set",
    fabric: "Washed satin with lace trim",
    sku: "MIT-PJ-05",
    art: "Soft focus · Lace trim",
    palette: ["#8a4a5c", "#f0c5cd", "#fdf6f3"],
    imageUrl: `${IMAGES}/pj-05-a.jpg`,
    backImageUrl: `${IMAGES}/pj-05-b.jpg`,
  },
];

export const catalog = products;
export const productTypes = Array.from(new Set(products.map((product) => product.type))).sort();

export const newArrivals = products
  .filter((product) => product.tags.includes("new"))
  .sort((a, b) => b.id - a.id);

export const bestsellers = products
  .filter((product) => product.tags.includes("bestseller"))
  .sort((a, b) => b.popularity - a.popularity);

export const dealsUnder799 = products
  .filter((product) => product.price <= 799)
  .sort((a, b) => b.discount - a.discount);

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export const getProductBySlug = getProduct;

export function getProductById(id: number | string) {
  const numericId = typeof id === "string" ? Number(id) : id;
  return products.find((product) => product.id === numericId);
}

export function getProductsByCollection(slug: string) {
  return products.filter((product) => product.collectionSlug === slug);
}

export function getProductsByCategory(category: Product["category"]) {
  return products.filter(
    (product) => product.category === category || product.category === "unisex",
  );
}

export function searchProducts(query: string) {
  const terms = query
    .trim()
    .toLocaleLowerCase("en-IN")
    .split(/\s+/)
    .filter(Boolean);

  if (!terms.length) return [];

  return products.filter((product) => {
    const haystack = [
      product.name,
      product.collection,
      product.type,
      product.category,
      product.tags.join(" "),
      product.art,
    ]
      .join(" ")
      .toLocaleLowerCase("en-IN");

    return terms.every((term) => haystack.includes(term));
  });
}
