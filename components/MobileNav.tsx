"use client";

import Link from "next/link";
import {
  ChevronRight,
  Heart,
  MapPin,
  PackageSearch,
  UserRound,
  X,
} from "lucide-react";

import { useStore } from "@/components/StoreProvider";
import { useCustomer } from "@/lib/account/auth";

const primaryLinks = [
  { label: "Men", href: "/shop?category=men" },
  { label: "Women", href: "/shop?category=women" },
  { label: "Collections", href: "/shop?category=men,women" },
];

const featuredLinks = [
  { label: "New arrivals", href: "/shop?tag=new" },
  { label: "Bestsellers", href: "/shop?tag=bestseller" },
  { label: "Under ₹799", href: "/shop?maxPrice=799" },
  { label: "Sale", href: "/shop?tag=sale", accent: true },
];

export function MobileNav() {
  const { mobileNavOpen, closeMobileNav, wishlistCount } = useStore();
  const { customer } = useCustomer();

  if (!mobileNavOpen) return null;

  return (
    <div
      className="drawer-layer mobile-nav-layer"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeMobileNav();
      }}
    >
      <aside
        className="drawer mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-nav-title"
      >
        <header className="drawer-header mobile-nav-header">
          <Link
            className="brand-lockup"
            href="/"
            onClick={closeMobileNav}
            aria-label="MI TRENDS home"
          >
            <span className="brand-mark" aria-hidden="true">
              MI
            </span>
            <span className="brand-name" id="mobile-nav-title">
              TRENDS
            </span>
          </Link>
          <button
            className="icon-button drawer-close"
            type="button"
            onClick={closeMobileNav}
            aria-label="Close navigation menu"
            autoFocus
          >
            <X aria-hidden="true" size={22} />
          </button>
        </header>

        <nav className="mobile-navigation" aria-label="Mobile navigation">
          <ul className="mobile-featured-links">
            {featuredLinks.map((link) => (
              <li key={link.label}>
                <Link
                  className={link.accent ? "is-sale" : undefined}
                  href={link.href}
                  onClick={closeMobileNav}
                >
                  {link.label}
                  <ChevronRight aria-hidden="true" size={18} />
                </Link>
              </li>
            ))}
          </ul>

          <ul className="mobile-primary-links">
            {primaryLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} onClick={closeMobileNav}>
                  {link.label}
                  <ChevronRight aria-hidden="true" size={18} />
                </Link>
              </li>
            ))}
          </ul>

          <ul className="mobile-utility-links">
            <li>
              <Link href={customer ? "/account" : "/account/login"} onClick={closeMobileNav}>
                <UserRound aria-hidden="true" size={18} />
                {customer ? "My account" : "Sign in or sign up"}
                <ChevronRight aria-hidden="true" size={17} />
              </Link>
            </li>
            <li>
              <Link href="/wishlist" onClick={closeMobileNav}>
                <Heart aria-hidden="true" size={18} />
                Wishlist
                {wishlistCount > 0 && (
                  <span className="utility-count">{wishlistCount}</span>
                )}
                <ChevronRight aria-hidden="true" size={17} />
              </Link>
            </li>
            <li>
              <Link href="/info/track-order" onClick={closeMobileNav}>
                <PackageSearch aria-hidden="true" size={18} />
                Track an order
                <ChevronRight aria-hidden="true" size={17} />
              </Link>
            </li>
            <li>
              <Link href="/info/stores" onClick={closeMobileNav}>
                <MapPin aria-hidden="true" size={18} />
                Find a store
                <ChevronRight aria-hidden="true" size={17} />
              </Link>
            </li>
          </ul>
        </nav>

        <footer className="mobile-nav-footer">
          <p>Designed in India. Made for every version of you.</p>
          <Link href="/info/contact" onClick={closeMobileNav}>
            Need help? Talk to us
          </Link>
        </footer>
      </aside>
    </div>
  );
}

export default MobileNav;
