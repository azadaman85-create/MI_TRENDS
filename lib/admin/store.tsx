"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_STORE_SETTINGS,
  readStoreSettings,
  writeStoreSettings,
  type StoreSettings,
} from "@/lib/store-settings";
import type { ReturnStatus } from "@/lib/returns";
import type {
  AdminProduct,
  Banner,
  CategoryNode,
  Coupon,
  Customer,
  Order,
  OrderStatus,
  Review,
} from "@/lib/admin/types";

const STORAGE_KEY = "mitrends-admin-state-v4";
/** State saved against the previous catalogue; cleared on load. */
const LEGACY_STORAGE_KEYS = [
  "mitrends-admin-state-v1",
  "mitrends-admin-state-v2",
  "mitrends-admin-state-v3",
];

export type AdminToast = {
  id: number;
  message: string;
  tone: "success" | "error" | "info";
  description?: string;
};

/**
 * Nothing is persisted to this device any more. Products, orders, customers, banners,
 * categories, reviews and coupons all come from MongoDB via `/api/admin/*`, so the panel
 * shows the same data on every device instead of whatever this browser happened to save.
 */

type AdminStoreValue = {
  /** From MongoDB, refreshed on an interval — not persisted to this device. */
  orders: Order[];
  customers: Customer[];
  products: AdminProduct[];
  coupons: Coupon[];
  banners: Banner[];
  categories: CategoryNode[];
  reviews: Review[];
  /** Checkout rules the storefront reads — see lib/store-settings.ts. */
  settings: StoreSettings;
  updateSettings: (patch: Partial<StoreSettings>) => void;
  hydrated: boolean;
  toasts: AdminToast[];
  notify: (message: string, tone?: AdminToast["tone"], description?: string) => void;
  dismissToast: (id: number) => void;
  getProduct: (id: number) => AdminProduct | undefined;
  saveProduct: (product: AdminProduct) => void;
  createProduct: (product: AdminProduct) => void;
  duplicateProduct: (id: number) => AdminProduct | undefined;
  deleteProducts: (ids: number[]) => void;
  setProductStatus: (ids: number[], status: AdminProduct["status"]) => void;
  setStock: (id: number, size: string, units: number) => void;
  setOrderStatus: (id: string, status: OrderStatus) => void;
  setReturnStatus: (id: string, returnStatus: ReturnStatus) => void;
  setReviewStatus: (id: string, status: Review["status"]) => void;
  saveCoupon: (coupon: Coupon) => void;
  deleteCoupon: (id: string) => void;
  saveBanner: (banner: Banner) => void;
  deleteBanner: (id: string) => void;
  saveCategory: (category: CategoryNode) => void;
  deleteCategory: (id: string) => void;
  resetDemoData: () => void;
};

const AdminStoreContext = createContext<AdminStoreValue | undefined>(undefined);

/** How often the panel re-reads orders and customers from the database. */
const LIVE_REFRESH_MS = 8000;

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [toasts, setToasts] = useState<AdminToast[]>([]);

  // Settings still live in this browser; everything else now comes from the database.
  // The old admin-state blobs are cleared out on load so they can't shadow it.
  useEffect(() => {
    try {
      [...LEGACY_STORAGE_KEYS, STORAGE_KEY].forEach((key) => window.localStorage.removeItem(key));
      /* Settings can only be read in the browser, so they land after the first paint
         rather than during render. */
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSettings(readStoreSettings());
    } catch {
      // Storage blocked — the defaults are fine.
    }
    setHydrated(true);
  }, []);

  /**
   * Orders and customers come from MongoDB, re-read on an interval so the panel reflects
   * new checkouts without a manual refresh. Polling rather than a socket: the app deploys
   * to serverless functions, where a long-lived push connection isn't a good fit.
   */
  const refreshLiveData = useCallback(async () => {
    try {
      const [ordersResponse, customersResponse, productsResponse, bannersResponse, categoriesResponse, reviewsResponse, couponsResponse] =
        await Promise.all([
        fetch("/api/admin/orders", { cache: "no-store" }),
        fetch("/api/admin/customers", { cache: "no-store" }),
        fetch("/api/admin/products", { cache: "no-store" }),
        fetch("/api/admin/content/banners", { cache: "no-store" }),
        fetch("/api/admin/content/categories", { cache: "no-store" }),
        fetch("/api/admin/content/reviews", { cache: "no-store" }),
        fetch("/api/admin/content/coupons", { cache: "no-store" }),
      ]);
      if (ordersResponse.ok) {
        const data = (await ordersResponse.json()) as { orders: Order[] };
        setOrders(data.orders ?? []);
      }
      if (customersResponse.ok) {
        const data = (await customersResponse.json()) as { customers: Customer[] };
        setCustomers(data.customers ?? []);
      }
      if (productsResponse.ok) {
        const data = (await productsResponse.json()) as { products: AdminProduct[] };
        setProducts(data.products ?? []);
      }
      if (bannersResponse.ok) setBanners(((await bannersResponse.json()) as { items: Banner[] }).items ?? []);
      if (categoriesResponse.ok) setCategories(((await categoriesResponse.json()) as { items: CategoryNode[] }).items ?? []);
      if (reviewsResponse.ok) setReviews(((await reviewsResponse.json()) as { items: Review[] }).items ?? []);
      if (couponsResponse.ok) setCoupons(((await couponsResponse.json()) as { items: Coupon[] }).items ?? []);
    } catch {
      // Keep whatever the panel is already showing until the next tick succeeds.
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    /* The state updates happen after the fetch resolves, not during this effect — the
       lint rule can't see through the async boundary. */
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshLiveData();
    const timer = window.setInterval(() => void refreshLiveData(), LIVE_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [hydrated, refreshLiveData]);

  const notify = useCallback(
    (message: string, tone: AdminToast["tone"] = "success", description?: string) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((current) => [...current, { id, message, tone, description }]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, 4200);
    },
    [],
  );

  const updateSettings = useCallback((patch: Partial<StoreSettings>) => {
    setSettings(writeStoreSettings(patch));
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  /**
   * Product writes go to MongoDB, then the panel re-reads from there.
   *
   * The previous version only ever called setState: the toast said "Product created" and
   * nothing left the browser, which is why nothing done in the panel ever reached the
   * storefront. Each mutation now awaits the API and reports a real failure. The server
   * assigns the id and recomputes discount and the out-of-stock list, so the refreshed
   * copy — not an optimistic local guess — is what the panel shows.
   */
  const writeProduct = useCallback(
    async (path: string, init: RequestInit, failure: string): Promise<AdminProduct | null> => {
      try {
        const response = await fetch(path, {
          ...init,
          headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
        });
        const body = await response.json().catch(() => null);
        if (!response.ok) {
          notify(failure, "error", body?.error ?? "The change was not saved.");
          return null;
        }
        await refreshLiveData();
        return (body?.product as AdminProduct) ?? null;
      } catch {
        notify(failure, "error", "Could not reach the server.");
        return null;
      }
    },
    [notify, refreshLiveData],
  );

  /**
   * Replaces a whole content list on the server, then refreshes from it.
   *
   * Banners, categories and reviews are edited as a set in the panel and are small, so
   * sending the list is simpler than a per-row endpoint — and it means a delete and a
   * reorder are the same operation.
   */
  const writeContent = useCallback(
    async (resource: "banners" | "categories" | "reviews" | "coupons", items: unknown[], failure: string) => {
      try {
        const response = await fetch(`/api/admin/content/${resource}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          notify(failure, "error", body?.error ?? "The change was not saved.");
          return;
        }
        await refreshLiveData();
      } catch {
        notify(failure, "error", "Could not reach the server.");
      }
    },
    [notify, refreshLiveData],
  );

  const value = useMemo<AdminStoreValue>(() => {
    return {
      orders,
      customers,
      products,
      coupons,
      banners,
      categories,
      reviews,
      settings,
      updateSettings,
      hydrated,
      toasts,
      notify,
      dismissToast,

      getProduct: (id) => products.find((product) => product.id === id),

      saveProduct: (product) => {
        void writeProduct(
          `/api/admin/products/${product.id}`,
          { method: "PATCH", body: JSON.stringify(product) },
          "Could not save that product",
        );
      },

      createProduct: (product) => {
        void writeProduct(
          "/api/admin/products",
          { method: "POST", body: JSON.stringify(product) },
          "Could not create that product",
        );
      },

      // Returns undefined: the copy's real id is assigned by the server, so the caller
      // picks it up from the refreshed list rather than guessing one here.
      duplicateProduct: (id) => {
        const source = products.find((product) => product.id === id);
        if (!source) return undefined;
        void writeProduct(
          "/api/admin/products",
          {
            method: "POST",
            body: JSON.stringify({
              ...source,
              name: `${source.name} (copy)`,
              slug: `${source.slug}-copy-${Date.now().toString(36).slice(-4)}`,
              sku: `${source.sku}-C${Date.now().toString(36).slice(-3).toUpperCase()}`,
              status: "draft",
              featured: false,
            }),
          },
          "Could not duplicate that product",
        );
        return undefined;
      },

      deleteProducts: (ids) => {
        void (async () => {
          for (const id of ids) {
            await writeProduct(`/api/admin/products/${id}`, { method: "DELETE" }, "Could not delete that product");
          }
        })();
      },

      setProductStatus: (ids, status) => {
        void (async () => {
          for (const id of ids) {
            const product = products.find((entry) => entry.id === id);
            if (!product) continue;
            await writeProduct(
              `/api/admin/products/${id}`,
              { method: "PATCH", body: JSON.stringify({ ...product, status }) },
              "Could not update that product",
            );
          }
        })();
      },

      setStock: (id, size, units) => {
        const product = products.find((entry) => entry.id === id);
        if (!product) return;
        void writeProduct(
          `/api/admin/products/${id}`,
          {
            method: "PATCH",
            body: JSON.stringify({ ...product, stock: { ...product.stock, [size]: Math.max(0, units) } }),
          },
          "Could not update stock",
        );
      },

      // Writes through to MongoDB, then reflects it locally so the row updates instantly
      // instead of waiting for the next poll. A failed write is surfaced and rolled back
      // by the refresh, rather than leaving the panel showing a change that didn't save.
      setOrderStatus: (id, status) => {
        setOrders((current) =>
          current.map((order) =>
            order.id === id
              ? {
                  ...order,
                  status,
                  paid: order.payment !== "cod" || status === "delivered",
                  timeline: order.timeline.map((step, index) => ({
                    ...step,
                    done:
                      status === "cancelled" || status === "returned"
                        ? index < 2
                        : index <=
                          ["pending", "confirmed", "packed", "shipped", "delivered"].indexOf(status),
                  })),
                }
              : order,
          ),
        );

        void (async () => {
          try {
            const response = await fetch(`/api/admin/orders/${encodeURIComponent(id)}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status }),
            });
            if (!response.ok) throw new Error("save failed");
          } catch {
            notify("Could not save that status change", "error", "The order was left as it was.");
            void refreshLiveData();
          }
        })();
      },

      // Same write-through pattern as setOrderStatus. A return moves on its own track:
      // the order keeps its delivered status until the refund is actually sent.
      setReturnStatus: (id, returnStatus) => {
        setOrders((current) =>
          current.map((order) =>
            order.id === id && order.returnRequest
              ? {
                  ...order,
                  status: returnStatus === "completed" ? "returned" : order.status,
                  returnRequest: { ...order.returnRequest, status: returnStatus },
                }
              : order,
          ),
        );

        void (async () => {
          try {
            const response = await fetch(`/api/admin/orders/${encodeURIComponent(id)}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ returnStatus }),
            });
            if (!response.ok) throw new Error("save failed");
          } catch {
            notify("Could not update that return", "error", "The return was left as it was.");
            void refreshLiveData();
          }
        })();
      },

      setReviewStatus: (id, status) => {
        void writeContent(
          "reviews",
          reviews.map((review) => (review.id === id ? { ...review, status } : review)),
          "Could not update that review",
        );
      },

      saveCoupon: (coupon) => {
        const next = coupons.some((item) => item.id === coupon.id)
          ? coupons.map((item) => (item.id === coupon.id ? coupon : item))
          : [coupon, ...coupons];
        void writeContent("coupons", next, "Could not save that coupon");
      },

      deleteCoupon: (id) => {
        void writeContent("coupons", coupons.filter((coupon) => coupon.id !== id), "Could not delete that coupon");
      },

      saveBanner: (banner) => {
        const next = banners.some((item) => item.id === banner.id)
          ? banners.map((item) => (item.id === banner.id ? banner : item))
          : [banner, ...banners];
        void writeContent("banners", next, "Could not save that banner");
      },

      deleteBanner: (id) => {
        void writeContent("banners", banners.filter((banner) => banner.id !== id), "Could not delete that banner");
      },

      saveCategory: (category) => {
        const next = categories.some((item) => item.id === category.id)
          ? categories.map((item) => (item.id === category.id ? category : item))
          : [category, ...categories];
        void writeContent("categories", next, "Could not save that category");
      },

      deleteCategory: (id) => {
        void writeContent("categories", categories.filter((category) => category.id !== id), "Could not delete that category");
      },

      /*
        Clears this browser's leftover state and re-reads everything from the database.
        It no longer resets anything: with products, coupons, banners, categories and
        reviews all persisted server-side, "reset demo data" would mean deleting real
        records, which is not something a stray click should do.
      */
      resetDemoData: () => {
        try {
          [...LEGACY_STORAGE_KEYS, STORAGE_KEY].forEach((key) => window.localStorage.removeItem(key));
        } catch {
          // Nothing to clear.
        }
        void refreshLiveData();
        notify("Reloaded from the database", "info", "Local leftovers cleared. Nothing was deleted.");
      },
    };
  }, [orders, customers, products, coupons, banners, categories, reviews, writeContent, hydrated, settings, updateSettings, toasts, notify, dismissToast, refreshLiveData, writeProduct]);

  return <AdminStoreContext.Provider value={value}>{children}</AdminStoreContext.Provider>;
}

export function useAdminStore() {
  const context = useContext(AdminStoreContext);
  if (!context) throw new Error("useAdminStore must be used inside AdminStoreProvider");
  return context;
}
