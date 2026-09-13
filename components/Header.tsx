"use client";

import Link from "next/link";
import {
  Heart,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
} from "lucide-react";

import { useStore } from "@/components/StoreProvider";
import { initialsOf, useCustomer } from "@/lib/account/auth";

const primaryLinks = [
  { label: "Men", href: "/shop?category=men" },
  { label: "Women", href: "/shop?category=women" },
  { label: "Collections", href: "/shop?category=men,women" },
  { label: "New", href: "/shop?tag=new" },
  { label: "Sale", href: "/shop?tag=sale", accent: true },
];

const announcementItems = [
  "Free shipping over ₹999",
  "Easy 30-day returns",
  "Cash on delivery available",
  "Save 10% with MI10",
];

export function Header() {
  const {
    cartCount,
    wishlistCount,
    openCart,
    openSearch,
    openMobileNav,
  } = useStore();
  const { customer } = useCustomer();

  return (
    <>
      <aside className="announcement-bar" aria-label="Store announcements">
        <div className="announcement-track">
          {announcementItems.map((item) => (
            <span className="announcement-item" key={item}>
              {item}
            </span>
          ))}
          <span className="announcement-repeat" aria-hidden="true">
            {announcementItems.map((item) => (
              <span className="announcement-item" key={`repeat-${item}`}>
                {item}
              </span>
            ))}
          </span>
        </div>
      </aside>

      <header className="site-header">
        <div className="header-main shell">
          <button
            className="icon-button mobile-menu-trigger"
            type="button"
            aria-label="Open navigation menu"
            onClick={openMobileNav}
          >
            <Menu aria-hidden="true" size={22} />
          </button>

          <Link className="brand-lockup" href="/" aria-label="MI TRENDS home">
            <span className="brand-mark" aria-hidden="true">
              MI
            </span>
            <span className="brand-name">TRENDS</span>
          </Link>

          <div className="header-actions">
            <button
              className="header-search-trigger"
              type="button"
              onClick={openSearch}
              aria-label="Search MI TRENDS"
            >
              <Search aria-hidden="true" size={19} />
              <span className="header-search-label">Search styles</span>
              <kbd className="search-shortcut" aria-hidden="true">
                /
              </kbd>
            </button>

            <Link
              className="icon-button header-account-link hidden md:inline-grid"
              href={customer ? "/account" : "/account/login"}
              aria-label={customer ? `Your account, signed in as ${customer.name}` : "Sign in or create an account"}
              title={customer ? customer.name : "Sign in"}
            >
              {customer ? (
                <span className="header-avatar" aria-hidden="true">
                  {customer.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={customer.picture} alt="" referrerPolicy="no-referrer" />
                  ) : (
                    initialsOf(customer.name, customer.email)
                  )}
                </span>
              ) : (
                <UserRound aria-hidden="true" size={21} />
              )}
            </Link>

            <Link
              className="icon-button count-button"
              href="/wishlist"
              aria-label={`Wishlist, ${wishlistCount} ${wishlistCount === 1 ? "item" : "items"}`}
            >
              <Heart aria-hidden="true" size={21} />
              {wishlistCount > 0 && (
                <span className="count-badge" aria-hidden="true">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <button
              className="icon-button count-button"
              type="button"
              onClick={openCart}
              aria-label={`Shopping bag, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
            >
              <ShoppingBag aria-hidden="true" size={21} />
              {cartCount > 0 && (
                <span className="count-badge" aria-hidden="true">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="mobile-search-bar">
          <button
            type="button"
            className="mobile-search-bar__btn"
            onClick={openSearch}
            aria-label="Search clothing, oversized tees, sneakers"
          >
            <Search size={16} aria-hidden="true" />
            <span className="mobile-search-bar__text">Search for oversized tees, hoodies, sneakers...</span>
          </button>
        </div>

        <div className="desktop-navigation">
          <nav className="primary-nav shell" aria-label="Primary navigation">
            {primaryLinks.map((link) => (
              <div className="primary-nav-item" key={link.label}>
                <Link
                  className={`primary-nav-link${link.accent ? " is-sale" : ""}`}
                  href={link.href}
                >
                  {link.label}
                </Link>
              </div>
            ))}
          </nav>
        </div>
      </header>
    </>
  );
}

export default Header;
