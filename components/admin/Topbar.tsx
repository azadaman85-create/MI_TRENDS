"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ExternalLink,
  LifeBuoy,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings,
  ShoppingCart,
  Star,
  UserRound,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { CommandPalette } from "@/components/admin/CommandPalette";
import { Button } from "@/components/admin/ui/Button";
import { Tooltip } from "@/components/admin/ui/Tooltip";
import { useAdminAuth } from "@/lib/admin/auth";
import { formatRelative } from "@/lib/admin/format";
import { popVariants } from "@/lib/admin/motion";
import { useAdminStore } from "@/lib/admin/store";

const titles: { match: RegExp; title: string; crumbs: { label: string; href?: string }[] }[] = [
  { match: /^\/admin$/, title: "Dashboard", crumbs: [{ label: "Admin" }, { label: "Dashboard" }] },
  { match: /^\/admin\/products\/new$/, title: "New product", crumbs: [{ label: "Products", href: "/admin/products" }, { label: "New" }] },
  { match: /^\/admin\/products\/.+$/, title: "Edit product", crumbs: [{ label: "Products", href: "/admin/products" }, { label: "Edit" }] },
  { match: /^\/admin\/products$/, title: "Products", crumbs: [{ label: "Admin" }, { label: "Products" }] },
  { match: /^\/admin\/categories$/, title: "Categories", crumbs: [{ label: "Admin" }, { label: "Categories" }] },
  { match: /^\/admin\/collections$/, title: "Collections", crumbs: [{ label: "Admin" }, { label: "Collections" }] },
  { match: /^\/admin\/inventory$/, title: "Inventory", crumbs: [{ label: "Admin" }, { label: "Inventory" }] },
  { match: /^\/admin\/orders\/.+$/, title: "Order detail", crumbs: [{ label: "Orders", href: "/admin/orders" }, { label: "Detail" }] },
  { match: /^\/admin\/orders$/, title: "Orders", crumbs: [{ label: "Admin" }, { label: "Orders" }] },
  { match: /^\/admin\/customers\/.+$/, title: "Customer", crumbs: [{ label: "Customers", href: "/admin/customers" }, { label: "Profile" }] },
  { match: /^\/admin\/customers$/, title: "Customers", crumbs: [{ label: "Admin" }, { label: "Customers" }] },
  { match: /^\/admin\/reviews$/, title: "Reviews", crumbs: [{ label: "Admin" }, { label: "Reviews" }] },
  { match: /^\/admin\/coupons$/, title: "Coupons", crumbs: [{ label: "Admin" }, { label: "Coupons" }] },
  { match: /^\/admin\/banners$/, title: "Banners", crumbs: [{ label: "Admin" }, { label: "Banners" }] },
  { match: /^\/admin\/reports$/, title: "Reports", crumbs: [{ label: "Admin" }, { label: "Reports" }] },
  { match: /^\/admin\/settings$/, title: "Settings", crumbs: [{ label: "Admin" }, { label: "Settings" }] },
];

type PageMeta = { title: string; crumbs: { label: string; href?: string }[] };

function usePageMeta(pathname: string): PageMeta {
  return (
    titles.find((entry) => entry.match.test(pathname)) ?? {
      title: "Admin",
      crumbs: [{ label: "Admin" }],
    }
  );
}

export function Topbar({
  collapsed,
  onToggleSidebar,
  onOpenMobileNav,
}: {
  collapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileNav: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAdminAuth();
  const { orders, reviews, products } = useAdminStore();
  const meta = usePageMeta(pathname);

  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  /**
   * One list drives both the badge and the panel, so the count can never disagree with
   * what is listed. Everything here is derived from live store state — nothing seeded.
   */
  const notifications = useMemo(() => {
    const items: {
      id: string;
      href: string;
      icon: typeof ShoppingCart;
      body: ReactNode;
      at: string | null;
    }[] = [];

    orders
      .filter((order) => order.status === "pending")
      .slice(0, 6)
      .forEach((order) =>
        items.push({
          id: `order-${order.id}`,
          href: `/admin/orders/${order.id}`,
          icon: ShoppingCart,
          body: (
            <>
              <strong>{order.id}</strong> from {order.customerName} needs confirmation.
            </>
          ),
          at: order.placedAt,
        }),
      );

    reviews
      .filter((review) => review.status === "pending")
      .slice(0, 4)
      .forEach((review) =>
        items.push({
          id: `review-${review.id}`,
          href: "/admin/reviews",
          icon: Star,
          body: (
            <>
              {review.rating}★ review waiting on <strong>{review.productName}</strong>.
            </>
          ),
          at: review.createdAt,
        }),
      );

    const lowStock = products.filter(
      (product) => Object.values(product.stock).reduce((sum, units) => sum + units, 0) <= 12,
    );
    if (lowStock.length) {
      items.push({
        id: "low-stock",
        href: "/admin/inventory",
        icon: Warehouse,
        body: (
          <>
            <strong>
              {lowStock.length} {lowStock.length === 1 ? "product is" : "products are"}
            </strong>{" "}
            at or below the low-stock threshold.
          </>
        ),
        at: null,
      });
    }

    return items;
  }, [orders, reviews, products]);

  const notificationCount = notifications.length;

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setMenuOpen(false);
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) setNotificationsOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="admin-topbar">
      <Tooltip label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
        <button
          className="admin-icon-button admin-only-desktop"
          type="button"
          onClick={onToggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={19} aria-hidden="true" /> : <PanelLeftClose size={19} aria-hidden="true" />}
        </button>
      </Tooltip>

      <button
        className="admin-icon-button admin-only-mobile"
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      <div className="admin-topbar__title">
        <nav className="admin-breadcrumb" aria-label="Breadcrumb">
          {meta.crumbs.map((crumb, index) => (
            <span key={crumb.label} style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span>{crumb.label}</span>}
              {index < meta.crumbs.length - 1 ? <span aria-hidden="true">/</span> : null}
            </span>
          ))}
        </nav>
        <h1>{meta.title}</h1>
      </div>

      <button className="admin-search" type="button" onClick={() => setPaletteOpen(true)}>
        <Search size={15} aria-hidden="true" />
        <span>Search everything</span>
        <kbd className="admin-kbd">⌘K</kbd>
      </button>

      <Tooltip label="Add product">
        <Button variant="ink" size="sm" onClick={() => router.push("/admin/products/new")} aria-label="Add product">
          <Plus size={15} aria-hidden="true" />
          <span className="admin-hide-sm">New product</span>
        </Button>
      </Tooltip>

      <Tooltip label="Open storefront">
        <a className="admin-icon-button admin-preview-link" href="/" target="_blank" rel="noreferrer" aria-label="Preview storefront">
          <ExternalLink size={18} aria-hidden="true" />
        </a>
      </Tooltip>

      <div ref={bellRef} style={{ position: "relative" }}>
        <button
          className="admin-icon-button"
          type="button"
          onClick={() => setNotificationsOpen((open) => !open)}
          aria-label={`Notifications (${notificationCount} new)`}
          aria-expanded={notificationsOpen}
        >
          <Bell size={18} aria-hidden="true" />
          {notificationCount > 0 ? <span className="admin-icon-button__dot">{notificationCount}</span> : null}
        </button>

        <AnimatePresence>
          {notificationsOpen ? (
            <motion.div
              className="admin-notifications"
              variants={popVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <header className="admin-notifications__head">
                <strong style={{ fontSize: "0.84rem" }}>Notifications</strong>
                <span className="a-badge a-badge--quiet">{notificationCount} new</span>
              </header>

              <div style={{ maxHeight: 330, overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <p
                    className="a-muted"
                    style={{ padding: "26px 18px", textAlign: "center", fontSize: "0.8rem", lineHeight: 1.6 }}
                  >
                    You&apos;re all caught up. New orders, reviews awaiting a decision and
                    low-stock warnings show up here.
                  </p>
                ) : (
                  notifications.map((item) => (
                    <Link
                      key={item.id}
                      className="admin-notification"
                      href={item.href}
                      onClick={() => setNotificationsOpen(false)}
                    >
                      <span className="admin-notification__icon">
                        <item.icon size={15} aria-hidden="true" />
                      </span>
                      <div>
                        <p>{item.body}</p>
                        <time>{item.at ? formatRelative(item.at) : "Updated just now"}</time>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div ref={profileRef} style={{ position: "relative" }}>
        <button
          className="admin-profile"
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <span className="admin-avatar">{user?.initials ?? "MI"}</span>
          <span className="admin-profile__copy">
            <span className="admin-profile__name">{user?.name ?? "Admin"}</span>
            <span className="admin-profile__role">{user?.role ?? "Store owner"}</span>
          </span>
        </button>

        <AnimatePresence>
          {menuOpen ? (
            <motion.div className="admin-menu" role="menu" variants={popVariants} initial="hidden" animate="visible" exit="exit">
              <div className="admin-menu__head">
                <strong>{user?.name}</strong>
                <span>{user?.email}</span>
              </div>
              <Link className="admin-menu__item" href="/admin/settings" role="menuitem" onClick={() => setMenuOpen(false)}>
                <UserRound size={15} aria-hidden="true" />
                Profile & store
              </Link>
              <Link className="admin-menu__item" href="/admin/settings" role="menuitem" onClick={() => setMenuOpen(false)}>
                <Settings size={15} aria-hidden="true" />
                Preferences
              </Link>
              <a className="admin-menu__item" href="/info/contact" target="_blank" rel="noreferrer" role="menuitem">
                <LifeBuoy size={15} aria-hidden="true" />
                Support
              </a>
              <div className="admin-menu__divider" />
              <button className="admin-menu__item admin-menu__item--danger" type="button" role="menuitem" onClick={signOut}>
                <LogOut size={15} aria-hidden="true" />
                Sign out
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </header>
  );
}
