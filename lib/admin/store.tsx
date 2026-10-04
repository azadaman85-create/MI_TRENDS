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
  adminProducts as seedProducts,
  banners as seedBanners,
  categoryTree as seedCategories,
  coupons as seedCoupons,
  reviews as seedReviews,
} from "@/lib/admin/data";
import { publishBannerFeed } from "@/lib/banner-feed";
import {
  DEFAULT_STORE_SETTINGS,
  readStoreSettings,
  writeStoreSettings,
  type StoreSettings,
} from "@/lib/store-settings";
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
 * What still lives in this device's localStorage. Orders and customers deliberately
 * aren't here any more — those come from MongoDB via `/api/admin/*`, so the panel shows
 * the same data on every device instead of whatever this browser happened to save.
 */
type PersistedState = {
  products: AdminProduct[];
  reviews: Review[];
  coupons: Coupon[];
  banners: Banner[];
  categories: CategoryNode[];
};

type AdminStoreValue = PersistedState & {
  /** From MongoDB, refreshed on an interval — not persisted to this device. */
  orders: Order[];
  customers: Customer[];
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

function seedState(): PersistedState {
  return {
    products: seedProducts,
    reviews: seedReviews,
    coupons: seedCoupons,
    banners: seedBanners,
    categories: seedCategories,
  };
}

/** How often the panel re-reads orders and customers from the database. */
const LIVE_REFRESH_MS = 8000;

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(seedState);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [toasts, setToasts] = useState<AdminToast[]>([]);

  // Persisted edits load after mount so the server and first client render match.
  useEffect(() => {
    try {
      LEGACY_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
      const saved = window.localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? (JSON.parse(saved) as Partial<PersistedState>) : null;
      /* Settings and saved edits can only be read in the browser, so they land after the
         first paint rather than during render. */
      /* eslint-disable react-hooks/set-state-in-effect */
      setSettings(readStoreSettings());
      if (parsed) setState((current) => ({ ...current, ...parsed }));
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch {
      // A corrupt or blocked store just means we stay on the seeded data.
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
      const [ordersResponse, customersResponse] = await Promise.all([
        fetch("/api/admin/orders", { cache: "no-store" }),
        fetch("/api/admin/customers", { cache: "no-store" }),
      ]);
      if (ordersResponse.ok) {
        const data = (await ordersResponse.json()) as { orders: Order[] };
        setOrders(data.orders ?? []);
      }
      if (customersResponse.ok) {
        const data = (await customersResponse.json()) as { customers: Customer[] };
        setCustomers(data.customers ?? []);
      }
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

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Out of quota or private mode — edits stay in memory for this session.
    }
  }, [state, hydrated]);

  // Banners get their own narrow hand-off to the storefront — see lib/banner-feed.ts —
  // rather than the storefront reading this whole admin blob (orders, customers, etc).
  useEffect(() => {
    if (!hydrated) return;
    publishBannerFeed(state.banners);
  }, [state.banners, hydrated]);

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

  const value = useMemo<AdminStoreValue>(() => {
    const patchProducts = (updater: (products: AdminProduct[]) => AdminProduct[]) =>
      setState((current) => ({ ...current, products: updater(current.products) }));

    return {
      ...state,
      orders,
      customers,
      settings,
      updateSettings,
      hydrated,
      toasts,
      notify,
      dismissToast,

      getProduct: (id) => state.products.find((product) => product.id === id),

      saveProduct: (product) =>
        patchProducts((products) =>
          products.map((item) =>
            item.id === product.id ? { ...product, updatedAt: new Date().toISOString() } : item,
          ),
        ),

      createProduct: (product) => patchProducts((products) => [product, ...products]),

      duplicateProduct: (id) => {
        const source = state.products.find((product) => product.id === id);
        if (!source) return undefined;
        const copy: AdminProduct = {
          ...source,
          id: Math.max(...state.products.map((product) => product.id)) + 1,
          name: `${source.name} (copy)`,
          slug: `${source.slug}-copy-${Date.now().toString(36).slice(-4)}`,
          sku: `${source.sku}-C`,
          status: "draft",
          featured: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        patchProducts((products) => [copy, ...products]);
        return copy;
      },

      deleteProducts: (ids) =>
        patchProducts((products) => products.filter((product) => !ids.includes(product.id))),

      setProductStatus: (ids, status) =>
        patchProducts((products) =>
          products.map((product) =>
            ids.includes(product.id)
              ? { ...product, status, updatedAt: new Date().toISOString() }
              : product,
          ),
        ),

      setStock: (id, size, units) =>
        patchProducts((products) =>
          products.map((product) =>
            product.id === id
              ? {
                  ...product,
                  stock: { ...product.stock, [size]: Math.max(0, units) },
                  outOfStock: units <= 0
                    ? Array.from(new Set([...product.outOfStock, size]))
                    : product.outOfStock.filter((entry) => entry !== size),
                  updatedAt: new Date().toISOString(),
                }
              : product,
          ),
        ),

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

      setReviewStatus: (id, status) =>
        setState((current) => ({
          ...current,
          reviews: current.reviews.map((review) =>
            review.id === id ? { ...review, status } : review,
          ),
        })),

      saveCoupon: (coupon) =>
        setState((current) => ({
          ...current,
          coupons: current.coupons.some((item) => item.id === coupon.id)
            ? current.coupons.map((item) => (item.id === coupon.id ? coupon : item))
            : [coupon, ...current.coupons],
        })),

      deleteCoupon: (id) =>
        setState((current) => ({
          ...current,
          coupons: current.coupons.filter((coupon) => coupon.id !== id),
        })),

      saveBanner: (banner) =>
        setState((current) => ({
          ...current,
          banners: current.banners.some((item) => item.id === banner.id)
            ? current.banners.map((item) => (item.id === banner.id ? banner : item))
            : [banner, ...current.banners],
        })),

      deleteBanner: (id) =>
        setState((current) => ({
          ...current,
          banners: current.banners.filter((banner) => banner.id !== id),
        })),

      saveCategory: (category) =>
        setState((current) => ({
          ...current,
          categories: current.categories.some((item) => item.id === category.id)
            ? current.categories.map((item) => (item.id === category.id ? category : item))
            : [category, ...current.categories],
        })),

      deleteCategory: (id) =>
        setState((current) => ({
          ...current,
          categories: current.categories.filter((category) => category.id !== id),
        })),

      resetDemoData: () => {
        // Only resets the demo catalogue/content. Orders and customers live in MongoDB
        // and are real records — this never touches them.
        setState(seedState());
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          // Nothing to clear.
        }
      },
    };
  }, [state, orders, customers, hydrated, settings, updateSettings, toasts, notify, dismissToast, refreshLiveData]);

  return <AdminStoreContext.Provider value={value}>{children}</AdminStoreContext.Provider>;
}

export function useAdminStore() {
  const context = useContext(AdminStoreContext);
  if (!context) throw new Error("useAdminStore must be used inside AdminStoreProvider");
  return context;
}
