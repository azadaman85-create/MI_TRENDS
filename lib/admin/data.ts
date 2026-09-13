import { collections, products } from "@/lib/catalog";
import type {
  ActivityItem,
  AdminProduct,
  Banner,
  CategoryNode,
  Coupon,
  Customer,
  Order,
  OrderStatus,
  PaymentMode,
  Review,
  SalesPoint,
} from "@/lib/admin/types";

/**
 * Every figure in the admin panel is generated from the storefront catalogue with a
 * deterministic pseudo-random sequence, so server and client renders always agree and
 * the numbers stay stable between reloads.
 */
function rng(seed: number) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function pick<T>(list: readonly T[], random: () => number) {
  return list[Math.floor(random() * list.length)];
}

/** A fixed "today" so the seeded dataset never drifts between renders. */
export const TODAY = new Date("2026-09-12T10:00:00+05:30");

function daysAgo(days: number, hours = 0) {
  const date = new Date(TODAY);
  date.setDate(date.getDate() - days);
  date.setHours(9 + hours, (days * 7) % 60, 0, 0);
  return date.toISOString();
}

const firstNames = [
  "Aarav", "Ishita", "Kabir", "Meera", "Rohan", "Ananya", "Vihaan", "Diya", "Arjun", "Sara",
  "Neha", "Dev", "Tara", "Kunal", "Zoya", "Aditya", "Riya", "Farhan", "Nikita", "Yash",
];
const lastNames = [
  "Sharma", "Iyer", "Khan", "Reddy", "Nair", "Bose", "Patel", "Singh", "Menon", "Gupta",
  "Rao", "Joshi", "Verma", "Dutta", "Kapoor", "Pillai",
];
const cities: [string, string][] = [
  ["Mumbai", "Maharashtra"], ["Bengaluru", "Karnataka"], ["Delhi", "Delhi"],
  ["Hyderabad", "Telangana"], ["Pune", "Maharashtra"], ["Chennai", "Tamil Nadu"],
  ["Kochi", "Kerala"], ["Jaipur", "Rajasthan"], ["Kolkata", "West Bengal"],
  ["Ahmedabad", "Gujarat"], ["Indore", "Madhya Pradesh"], ["Lucknow", "Uttar Pradesh"],
];
const paymentModes: PaymentMode[] = ["upi", "card", "netbanking", "cod"];

function stockFor(product: (typeof products)[number], random: () => number) {
  const stock: Record<string, number> = {};
  for (const size of product.sizes) {
    stock[size] = product.outOfStock.includes(size) ? 0 : Math.floor(random() * 34) + 2;
  }
  return stock;
}

function descriptionFor(product: (typeof products)[number]) {
  return [
    `${product.name} from the ${product.collection} drop.`,
    `${product.fit} cut in ${product.fabric.toLowerCase()}, finished with the ${product.art.toLowerCase()} artwork.`,
    "Pre-shrunk, colour-fast and built for daily rotation.",
  ].join(" ");
}

export const adminProducts: AdminProduct[] = products.map((product, index) => {
  const random = rng(product.id * 31 + 7);
  // Everything in the catalogue is live on the storefront, so the panel says so too.
  const status: AdminProduct["status"] = "active";
  const images = [product.imageUrl, product.backImageUrl].filter(Boolean) as string[];

  return {
    ...product,
    status,
    featured: product.tags.includes("bestseller") || index % 11 === 0,
    stock: stockFor(product, random),
    costPrice: Math.round(product.price * 0.42),
    createdAt: daysAgo(120 - (index % 110)),
    updatedAt: daysAgo((index * 3) % 45),
    seoTitle: `${product.name} | MI TRENDS`,
    seoDescription: `Shop the ${product.name} — ${product.fit} ${product.type.toLowerCase()} in ${product.fabric.toLowerCase()}.`,
    images,
    description: descriptionFor(product),
  };
});

export function totalStock(product: AdminProduct) {
  return Object.values(product.stock).reduce((sum, units) => sum + units, 0);
}

export const LOW_STOCK_THRESHOLD = 12;

export const customers: Customer[] = Array.from({ length: 96 }, (_, index) => {
  const random = rng(index * 97 + 13);
  const first = pick(firstNames, random);
  const last = pick(lastNames, random);
  const [city, state] = pick(cities, random);
  const orders = Math.floor(random() * 9) + 1;
  const spend = Math.round((orders * (900 + random() * 2600)) / 10) * 10;
  const joined = Math.floor(random() * 400) + 10;
  const lastOrder = Math.floor(random() * Math.min(joined, 90));

  return {
    id: `CUS-${String(4100 + index)}`,
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@example.in`,
    phone: `9${Math.floor(random() * 900000000 + 100000000)}`,
    city,
    state,
    joinedAt: daysAgo(joined),
    orders,
    spend,
    tier: spend > 12000 ? "vip" : orders > 2 ? "regular" : "new",
    lastOrderAt: orders > 0 ? daysAgo(lastOrder) : null,
  };
});

const orderStatusFlow: OrderStatus[] = ["pending", "confirmed", "packed", "shipped", "delivered"];

function timelineFor(status: OrderStatus, placedAt: string) {
  const placed = new Date(placedAt);
  const steps = ["Order placed", "Payment confirmed", "Packed", "Shipped", "Delivered"];
  const reached = status === "cancelled" || status === "returned"
    ? 2
    : orderStatusFlow.indexOf(status) + 1;

  return steps.map((label, index) => {
    const at = new Date(placed);
    at.setHours(at.getHours() + index * 19);
    return { label, at: at.toISOString(), done: index < reached };
  });
}

export const orders: Order[] = Array.from({ length: 184 }, (_, index) => {
  const random = rng(index * 53 + 29);
  const customer = customers[Math.floor(random() * customers.length)];
  const lineCount = Math.floor(random() * 3) + 1;
  const placedDays = Math.floor(random() * 92);
  const placedAt = daysAgo(placedDays, index % 9);

  const lines = Array.from({ length: lineCount }, () => {
    const product = adminProducts[Math.floor(random() * adminProducts.length)];
    const quantity = Math.floor(random() * 2) + 1;
    return {
      productId: product.id,
      name: product.name,
      sku: product.sku,
      size: pick(product.sizes, random),
      color: pick(product.colors, random).name,
      quantity,
      price: product.price,
      imageUrl: product.imageUrl,
    };
  });

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const couponCode = random() > 0.72 ? pick(["MI10", "FIRST15", "FLAT200"], random) : null;
  const discount = couponCode === "FLAT200" ? 200 : couponCode === "FIRST15"
    ? Math.round(subtotal * 0.15)
    : couponCode === "MI10"
      ? Math.round(subtotal * 0.1)
      : 0;
  const shipping = subtotal >= 999 ? 0 : 79;

  const status: OrderStatus = placedDays < 2
    ? "pending"
    : placedDays < 4
      ? pick(["confirmed", "packed"] as OrderStatus[], random)
      : placedDays < 8
        ? pick(["packed", "shipped"] as OrderStatus[], random)
        : random() > 0.94
          ? "cancelled"
          : random() > 0.93
            ? "returned"
            : "delivered";

  const payment = pick(paymentModes, random);

  return {
    id: `MIT${String(24810 + index)}`,
    customerId: customer.id,
    customerName: customer.name,
    email: customer.email,
    phone: customer.phone,
    placedAt,
    status,
    payment,
    paid: payment !== "cod" || status === "delivered",
    lines,
    subtotal,
    discount,
    shipping,
    total: Math.max(0, subtotal - discount) + shipping + (payment === "cod" ? 49 : 0),
    couponCode,
    address: {
      line1: `${Math.floor(random() * 180) + 1}, ${pick(["Anand", "Crest", "Marine", "Lotus", "Orchid"], random)} Residency`,
      area: `${pick(["Sector", "Phase", "Block"], random)} ${Math.floor(random() * 12) + 1}`,
      city: customer.city,
      state: customer.state,
      pincode: String(400000 + Math.floor(random() * 99999)),
    },
    timeline: timelineFor(status, placedAt),
  };
}).sort((a, b) => (a.placedAt < b.placedAt ? 1 : -1));

const reviewTitles = [
  "Exactly what the photos promised",
  "Fabric feels premium",
  "Runs slightly large",
  "Print quality is unreal",
  "Fast delivery, great fit",
  "Colour is deeper in person",
];

export const reviews: Review[] = Array.from({ length: 64 }, (_, index) => {
  const random = rng(index * 71 + 5);
  const product = adminProducts[Math.floor(random() * adminProducts.length)];
  const customer = customers[Math.floor(random() * customers.length)];
  const rating = random() > 0.82 ? 3 : random() > 0.35 ? 5 : 4;

  return {
    id: `REV-${900 + index}`,
    productId: product.id,
    productName: product.name,
    customerName: customer.name,
    rating,
    title: pick(reviewTitles, random),
    body: `${pick(reviewTitles, random)}. Wore it through the week and the ${product.fabric.toLowerCase()} held up well after two washes.`,
    createdAt: daysAgo(Math.floor(random() * 60)),
    status: index % 9 === 0 ? "pending" : index % 23 === 7 ? "rejected" : "published",
  };
});

export const coupons: Coupon[] = [
  { id: "CPN-01", code: "MI10", type: "percent", value: 10, minimumSpend: 0, usage: 1842, usageLimit: 5000, startsAt: daysAgo(120), expiresAt: daysAgo(-60), status: "active" },
  { id: "CPN-02", code: "FIRST15", type: "percent", value: 15, minimumSpend: 999, usage: 964, usageLimit: 2000, startsAt: daysAgo(90), expiresAt: daysAgo(-30), status: "active" },
  { id: "CPN-03", code: "FLAT200", type: "flat", value: 200, minimumSpend: 1499, usage: 412, usageLimit: 1000, startsAt: daysAgo(45), expiresAt: daysAgo(-14), status: "active" },
  { id: "CPN-04", code: "FREESHIP", type: "shipping", value: 0, minimumSpend: 699, usage: 2210, usageLimit: 9999, startsAt: daysAgo(200), expiresAt: daysAgo(-120), status: "active" },
  { id: "CPN-05", code: "DROP01", type: "percent", value: 20, minimumSpend: 1999, usage: 0, usageLimit: 750, startsAt: daysAgo(-7), expiresAt: daysAgo(-40), status: "scheduled" },
  { id: "CPN-06", code: "MONSOON", type: "flat", value: 300, minimumSpend: 2499, usage: 588, usageLimit: 600, startsAt: daysAgo(160), expiresAt: daysAgo(30), status: "expired" },
  { id: "CPN-07", code: "VIP25", type: "percent", value: 25, minimumSpend: 3499, usage: 133, usageLimit: 300, startsAt: daysAgo(30), expiresAt: daysAgo(-90), status: "paused" },
];

export const banners: Banner[] = [
  { id: "BNR-01", title: "Loud after lights out.", subtitle: "Drop 01 · Afterdark", placement: "hero", imageUrl: "/images/hero-afterdark.jpg", link: "/shop?tag=new", status: "live", startsAt: daysAgo(20), endsAt: daysAgo(-40), sortOrder: 1 },
  { id: "BNR-02", title: "Court culture, all day.", subtitle: "Varsity restock", placement: "hero", imageUrl: "/images/hero-court.jpg", link: "/shop?type=t-shirts", status: "live", startsAt: daysAgo(14), endsAt: daysAgo(-26), sortOrder: 2 },
  { id: "BNR-03", title: "Oversized, on purpose.", subtitle: "Editorial edit", placement: "hero", imageUrl: "/images/hero-oversized.jpg", link: "/shop?type=oversized-tees", status: "live", startsAt: daysAgo(9), endsAt: daysAgo(-30), sortOrder: 3 },
  { id: "BNR-04", title: "Sneaker week", subtitle: "Up to 40% off", placement: "category", imageUrl: "/images/hero-sneakers.jpg", link: "/shop?type=sneakers", status: "scheduled", startsAt: daysAgo(-5), endsAt: daysAgo(-19), sortOrder: 4 },
  { id: "BNR-05", title: "Free shipping over ₹999", subtitle: "Always on", placement: "strip", imageUrl: "", link: "/info/shipping", status: "live", startsAt: daysAgo(200), endsAt: daysAgo(-200), sortOrder: 5 },
  { id: "BNR-06", title: "Festive teaser", subtitle: "Coming soon", placement: "popup", imageUrl: "", link: "/shop", status: "draft", startsAt: daysAgo(-30), endsAt: daysAgo(-60), sortOrder: 6 },
];

export const categoryTree: CategoryNode[] = (() => {
  const types = Array.from(new Set(adminProducts.map((product) => product.type)));
  const roots: CategoryNode[] = [
    { id: "CAT-men", name: "Men", slug: "men", parent: null, productCount: adminProducts.filter((p) => p.category === "men").length, status: "visible", description: "Everything cut for the men's fit block." },
    { id: "CAT-women", name: "Women", slug: "women", parent: null, productCount: adminProducts.filter((p) => p.category === "women").length, status: "visible", description: "Women's silhouettes across every drop." },
    { id: "CAT-unisex", name: "Unisex", slug: "unisex", parent: null, productCount: adminProducts.filter((p) => p.category === "unisex").length, status: "visible", description: "One-fit-all staples and accessories." },
  ];

  const children = types.map((type, index) => ({
    id: `CAT-${type.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: type,
    slug: type.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    parent: roots[index % roots.length].id,
    productCount: adminProducts.filter((product) => product.type === type).length,
    status: (index % 13 === 7 ? "hidden" : "visible") as CategoryNode["status"],
    description: `All ${type.toLowerCase()} across the MI TRENDS catalogue.`,
  }));

  return [...roots, ...children];
})();

export const adminCollections = collections.map((collection) => ({
  ...collection,
  productCount: adminProducts.filter((product) => product.collectionSlug === collection.slug).length,
  revenue: orders
    .flatMap((order) => order.lines)
    .filter((line) => {
      const product = adminProducts.find((item) => item.id === line.productId);
      return product?.collectionSlug === collection.slug;
    })
    .reduce((sum, line) => sum + line.price * line.quantity, 0),
}));

/** Revenue and order counts for the last `days` days, oldest first. */
export function salesSeries(days: number): SalesPoint[] {
  const buckets = new Map<string, SalesPoint>();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(TODAY);
    date.setDate(date.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    buckets.set(key, {
      label: new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(date),
      revenue: 0,
      orders: 0,
    });
  }

  for (const order of orders) {
    if (order.status === "cancelled") continue;
    const key = order.placedAt.slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.revenue += order.total;
    bucket.orders += 1;
  }

  return Array.from(buckets.values());
}

export function ordersInWindow(days: number) {
  const cutoff = new Date(TODAY);
  cutoff.setDate(cutoff.getDate() - days);
  return orders.filter((order) => new Date(order.placedAt) >= cutoff);
}

export const activity: ActivityItem[] = [
  ...orders.slice(0, 6).map((order) => ({
    id: `act-order-${order.id}`,
    kind: "order" as const,
    message: `${order.customerName} placed order ${order.id}`,
    at: order.placedAt,
  })),
  ...reviews.filter((review) => review.status === "pending").slice(0, 3).map((review) => ({
    id: `act-review-${review.id}`,
    kind: "review" as const,
    message: `New ${review.rating}★ review awaiting approval on ${review.productName}`,
    at: review.createdAt,
  })),
  ...adminProducts
    .filter((product) => totalStock(product) <= LOW_STOCK_THRESHOLD)
    .slice(0, 3)
    .map((product) => ({
      id: `act-stock-${product.id}`,
      kind: "stock" as const,
      message: `${product.name} dropped to ${totalStock(product)} units`,
      at: product.updatedAt,
    })),
  ...customers.slice(0, 3).map((customer) => ({
    id: `act-customer-${customer.id}`,
    kind: "customer" as const,
    message: `${customer.name} created an account from ${customer.city}`,
    at: customer.joinedAt,
  })),
].sort((a, b) => (a.at < b.at ? 1 : -1));
