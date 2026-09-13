"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Heart,
  Home,
  Search,
  ShoppingBag,
} from "lucide-react";
import { useStore } from "@/components/StoreProvider";

export function MobileTabBar() {
  const pathname = usePathname();
  const {
    wishlistCount,
    cartCount,
    openCart,
    openSearch,
    searchOpen,
    drawerOpen,
  } = useStore();

  // Hide tab bar on checkout and order success for distraction-free completion,
  // and on product pages where the dedicated sticky mobile buy bar takes bottom priority.
  if (
    pathname === "/checkout" ||
    pathname === "/order-success" ||
    pathname.startsWith("/product/")
  ) {
    return null;
  }

  const isHome = pathname === "/";
  const isShop = pathname.startsWith("/shop");
  const isWishlist = pathname === "/wishlist";
  const isCart = drawerOpen || pathname === "/cart";
  const isSearch = searchOpen;

  return (
    <nav className="mobile-tab-bar" aria-label="Mobile application navigation">
      <div className="mobile-tab-bar__inner">
        <Link
          href="/"
          className={`mobile-tab-item ${isHome ? "is-active" : ""}`}
          aria-label="Home"
          aria-current={isHome ? "page" : undefined}
        >
          <span className="mobile-tab-icon-wrap">
            <Home size={22} strokeWidth={isHome ? 2.4 : 1.9} />
          </span>
          <span className="mobile-tab-label">Home</span>
          {isHome && <span className="mobile-tab-indicator" aria-hidden="true" />}
        </Link>

        <Link
          href="/shop"
          className={`mobile-tab-item ${isShop ? "is-active" : ""}`}
          aria-label="Shop"
          aria-current={isShop ? "page" : undefined}
        >
          <span className="mobile-tab-icon-wrap">
            <Compass size={22} strokeWidth={isShop ? 2.4 : 1.9} />
          </span>
          <span className="mobile-tab-label">Explore</span>
          {isShop && <span className="mobile-tab-indicator" aria-hidden="true" />}
        </Link>

        <button
          type="button"
          className={`mobile-tab-item ${isSearch ? "is-active" : ""}`}
          onClick={openSearch}
          aria-label="Search catalog"
        >
          <span className="mobile-tab-icon-wrap">
            <Search size={22} strokeWidth={isSearch ? 2.4 : 1.9} />
          </span>
          <span className="mobile-tab-label">Search</span>
          {isSearch && <span className="mobile-tab-indicator" aria-hidden="true" />}
        </button>

        <Link
          href="/wishlist"
          className={`mobile-tab-item ${isWishlist ? "is-active" : ""}`}
          aria-label={`Wishlist with ${wishlistCount} saved items`}
          aria-current={isWishlist ? "page" : undefined}
        >
          <span className="mobile-tab-icon-wrap">
            <Heart size={22} strokeWidth={isWishlist ? 2.4 : 1.9} />
            {wishlistCount > 0 && (
              <span className="mobile-tab-badge" aria-hidden="true">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </span>
          <span className="mobile-tab-label">Wishlist</span>
          {isWishlist && <span className="mobile-tab-indicator" aria-hidden="true" />}
        </Link>

        <button
          type="button"
          className={`mobile-tab-item ${isCart ? "is-active" : ""}`}
          onClick={openCart}
          aria-label={`Shopping bag with ${cartCount} items`}
        >
          <span className="mobile-tab-icon-wrap">
            <ShoppingBag size={22} strokeWidth={isCart ? 2.4 : 1.9} />
            {cartCount > 0 && (
              <span className="mobile-tab-badge is-accent" aria-hidden="true">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </span>
          <span className="mobile-tab-label">Bag</span>
          {isCart && <span className="mobile-tab-indicator" aria-hidden="true" />}
        </button>
      </div>
    </nav>
  );
}

export default MobileTabBar;
