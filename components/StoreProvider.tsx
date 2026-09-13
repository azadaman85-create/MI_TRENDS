"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { getProductById, products } from "@/lib/catalog";
import type { CartLine, Product, ProductColor } from "@/lib/types";

export type ToastTone = "success" | "error" | "info";

export type ToastMessage = {
  id: number;
  message: string;
  tone: ToastTone;
};

export type AppliedCoupon = {
  code: string;
  discount: number;
};

export type StoreContextValue = {
  cartLines: CartLine[];
  cart: CartLine[];
  cartItems: CartLine[];
  cartCount: number;
  subtotal: number;
  wishlistIds: number[];
  wishlist: number[];
  wishlistCount: number;
  coupon: AppliedCoupon | null;
  couponCode: string | null;
  couponDiscount: number;
  addToCart: (
    product: Product,
    size: string,
    color: ProductColor,
    quantity?: number,
  ) => void;
  quickAdd: (product: Product) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;
  toggleWishlist: (product: Product | number) => void;
  isWishlisted: (product: Product | number) => boolean;
  applyCoupon: (code: string) => boolean;
  clearCoupon: () => void;
  drawerOpen: boolean;
  isCartOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  setCartOpen: (open: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  searchOpen: boolean;
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  openSearch: () => void;
  closeSearch: () => void;
  mobileNavOpen: boolean;
  isMobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  toast: ToastMessage | null;
  showToast: (message: string, tone?: ToastTone) => void;
  dismissToast: () => void;
};

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

const BAG_KEY = "mitrends-bag-v1";

/**
 * The bag and wishlist survive a refresh. Only the product id, size, colour and quantity
 * are stored — the product itself is re-read from the catalogue on load, so a line whose
 * product has since been removed is dropped instead of resurrecting stale prices.
 */
type StoredBag = {
  lines: { id: number; size: string; color: ProductColor; quantity: number }[];
  wishlist: number[];
  coupon: string | null;
};

function readBag(): StoredBag | null {
  try {
    const raw = window.localStorage.getItem(BAG_KEY);
    return raw ? (JSON.parse(raw) as StoredBag) : null;
  } catch {
    return null;
  }
}

function restoreLines(stored: StoredBag["lines"]): CartLine[] {
  return stored
    .map((line) => {
      const product = getProductById(line.id);
      if (!product) return null;
      return {
        key: `${product.id}:${line.size}:${line.color.name}`,
        product,
        size: line.size,
        color: line.color,
        quantity: clampQuantity(line.quantity),
      } satisfies CartLine;
    })
    .filter((line): line is CartLine => line !== null);
}

function productId(product: Product | number) {
  return typeof product === "number" ? product : product.id;
}

function clampQuantity(quantity: number) {
  return Math.max(1, Math.min(10, Math.floor(quantity)));
}

function couponMinimum(code: string) {
  if (code === "FLAT200") return 1499;
  if (code === "FIRST15") return 999;
  return 0;
}

export function calculateCouponDiscount(code: string | null, subtotal: number) {
  if (!code || subtotal <= 0 || subtotal < couponMinimum(code)) return 0;

  switch (code) {
    case "MI10":
      return Math.round(subtotal * 0.1);
    case "FLAT200":
      return 200;
    case "FIRST15":
      return Math.min(400, Math.round(subtotal * 0.15));
    default:
      return 0;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [drawerOpen, setDrawerState] = useState(false);
  const [searchOpen, setSearchState] = useState(false);
  const [mobileNavOpen, setMobileNavState] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const toastId = useRef(0);

  // Restore after mount so the server and first client render agree.
  useEffect(() => {
    const stored = readBag();
    if (stored) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setCartLines(restoreLines(stored.lines ?? []));
      setWishlistIds((stored.wishlist ?? []).filter((id) => getProductById(id)));
      setCouponCode(stored.coupon ?? null);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const payload: StoredBag = {
        lines: cartLines.map((line) => ({
          id: line.product.id,
          size: line.size,
          color: line.color,
          quantity: line.quantity,
        })),
        wishlist: wishlistIds,
        coupon: couponCode,
      };
      window.localStorage.setItem(BAG_KEY, JSON.stringify(payload));
    } catch {
      // Private mode or full quota — the bag just stays in memory.
    }
  }, [hydrated, cartLines, wishlistIds, couponCode]);

  const subtotal = useMemo(
    () =>
      cartLines.reduce(
        (total, line) => total + line.product.price * line.quantity,
        0,
      ),
    [cartLines],
  );

  const cartCount = useMemo(
    () => cartLines.reduce((total, line) => total + line.quantity, 0),
    [cartLines],
  );

  const couponDiscount = useMemo(
    () => calculateCouponDiscount(couponCode, subtotal),
    [couponCode, subtotal],
  );

  const coupon = useMemo<AppliedCoupon | null>(
    () => (couponCode ? { code: couponCode, discount: couponDiscount } : null),
    [couponCode, couponDiscount],
  );

  const showToast = useCallback(
    (message: string, tone: ToastTone = "success") => {
      toastId.current += 1;
      setToast({ id: toastId.current, message, tone });
    },
    [],
  );

  const dismissToast = useCallback(() => setToast(null), []);

  const closeAllOverlays = useCallback(() => {
    setDrawerState(false);
    setSearchState(false);
    setMobileNavState(false);
  }, []);

  const setDrawerOpen = useCallback((open: boolean) => {
    setDrawerState(open);
    if (open) {
      setSearchState(false);
      setMobileNavState(false);
    }
  }, []);

  const setSearchOpen = useCallback((open: boolean) => {
    setSearchState(open);
    if (open) {
      setDrawerState(false);
      setMobileNavState(false);
    }
  }, []);

  const setMobileNavOpen = useCallback((open: boolean) => {
    setMobileNavState(open);
    if (open) {
      setDrawerState(false);
      setSearchState(false);
    }
  }, []);

  const openCart = useCallback(() => setDrawerOpen(true), [setDrawerOpen]);
  const closeCart = useCallback(() => setDrawerOpen(false), [setDrawerOpen]);
  const openSearch = useCallback(() => setSearchOpen(true), [setSearchOpen]);
  const closeSearch = useCallback(() => setSearchOpen(false), [setSearchOpen]);
  const openMobileNav = useCallback(
    () => setMobileNavOpen(true),
    [setMobileNavOpen],
  );
  const closeMobileNav = useCallback(
    () => setMobileNavOpen(false),
    [setMobileNavOpen],
  );

  const addToCart = useCallback(
    (
      product: Product,
      size: string,
      color: ProductColor,
      quantity = 1,
    ) => {
      const safeQuantity = clampQuantity(quantity);
      const key = `${product.id}:${size}:${color.name}`;

      setCartLines((current) => {
        const existing = current.find((line) => line.key === key);
        if (!existing) {
          return [
            ...current,
            { key, product, size, color, quantity: safeQuantity },
          ];
        }

        return current.map((line) =>
          line.key === key
            ? {
                ...line,
                quantity: clampQuantity(line.quantity + safeQuantity),
              }
            : line,
        );
      });

      showToast(`${product.name} added to your bag.`);
      setDrawerOpen(true);
    },
    [setDrawerOpen, showToast],
  );

  const quickAdd = useCallback(
    (product: Product) => {
      const size = product.sizes.find(
        (candidate) => !product.outOfStock.includes(candidate),
      );
      const color = product.colors[0];

      if (!size || !color) {
        showToast("This style is currently unavailable.", "error");
        return;
      }

      addToCart(product, size, color, 1);
    },
    [addToCart, showToast],
  );

  const updateQuantity = useCallback((key: string, quantity: number) => {
    if (quantity <= 0) {
      setCartLines((current) => current.filter((line) => line.key !== key));
      return;
    }

    setCartLines((current) =>
      current.map((line) =>
        line.key === key
          ? { ...line, quantity: clampQuantity(quantity) }
          : line,
      ),
    );
  }, []);

  const removeFromCart = useCallback(
    (key: string) => {
      const removedName =
        cartLines.find((line) => line.key === key)?.product.name ?? "Item";
      setCartLines((current) => current.filter((line) => line.key !== key));
      showToast(`${removedName} removed from your bag.`, "info");
    },
    [cartLines, showToast],
  );

  const clearCart = useCallback(() => {
    setCartLines([]);
    setCouponCode(null);
  }, []);

  const toggleWishlist = useCallback(
    (product: Product | number) => {
      const id = productId(product);
      const name =
        typeof product === "number"
          ? products.find((item) => item.id === id)?.name ?? "Style"
          : product.name;
      const exists = wishlistIds.includes(id);

      setWishlistIds((current) =>
        exists
          ? current.filter((itemId) => itemId !== id)
          : [...current, id],
      );
      showToast(
        exists
          ? `${name} removed from your wishlist.`
          : `${name} saved to your wishlist.`,
        exists ? "info" : "success",
      );
    },
    [showToast, wishlistIds],
  );

  const isWishlisted = useCallback(
    (product: Product | number) => wishlistIds.includes(productId(product)),
    [wishlistIds],
  );

  const applyCoupon = useCallback(
    (rawCode: string) => {
      const code = rawCode.trim().toUpperCase();
      const validCodes = ["MI10", "FLAT200", "FIRST15"];

      if (!subtotal) {
        showToast("Add an item before applying a coupon.", "error");
        return false;
      }

      if (!validCodes.includes(code)) {
        showToast("That coupon code is not valid.", "error");
        return false;
      }

      const minimum = couponMinimum(code);
      if (subtotal < minimum) {
        showToast(
          `${code} works on orders of ₹${minimum.toLocaleString("en-IN")} or more.`,
          "error",
        );
        return false;
      }

      setCouponCode(code);
      showToast(`${code} applied. Your new total is ready.`);
      return true;
    },
    [showToast, subtotal],
  );

  const clearCoupon = useCallback(() => {
    setCouponCode(null);
    showToast("Coupon removed.", "info");
  }, [showToast]);

  useEffect(() => {
    const anyOverlayOpen = drawerOpen || searchOpen || mobileNavOpen;
    if (!anyOverlayOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAllOverlays();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeAllOverlays, drawerOpen, mobileNavOpen, searchOpen]);

  const value = useMemo<StoreContextValue>(
    () => ({
      cartLines,
      cart: cartLines,
      cartItems: cartLines,
      cartCount,
      subtotal,
      wishlistIds,
      wishlist: wishlistIds,
      wishlistCount: wishlistIds.length,
      coupon,
      couponCode,
      couponDiscount,
      addToCart,
      quickAdd,
      updateQuantity,
      removeFromCart,
      clearCart,
      toggleWishlist,
      isWishlisted,
      applyCoupon,
      clearCoupon,
      drawerOpen,
      isCartOpen: drawerOpen,
      setDrawerOpen,
      setCartOpen: setDrawerOpen,
      openCart,
      closeCart,
      searchOpen,
      isSearchOpen: searchOpen,
      setSearchOpen,
      openSearch,
      closeSearch,
      mobileNavOpen,
      isMobileNavOpen: mobileNavOpen,
      setMobileNavOpen,
      openMobileNav,
      closeMobileNav,
      toast,
      showToast,
      dismissToast,
    }),
    [
      addToCart,
      applyCoupon,
      cartCount,
      cartLines,
      clearCart,
      clearCoupon,
      closeCart,
      closeMobileNav,
      closeSearch,
      coupon,
      couponCode,
      couponDiscount,
      dismissToast,
      drawerOpen,
      isWishlisted,
      mobileNavOpen,
      openCart,
      openMobileNav,
      openSearch,
      quickAdd,
      removeFromCart,
      searchOpen,
      setDrawerOpen,
      setMobileNavOpen,
      setSearchOpen,
      showToast,
      subtotal,
      toast,
      toggleWishlist,
      updateQuantity,
      wishlistIds,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used inside StoreProvider.");
  }
  return context;
}
