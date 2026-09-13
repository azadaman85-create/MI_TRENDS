"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  BadgePercent,
  BarChart3,
  ChevronDown,
  Images,
  LayoutGrid,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingCart,
  Sparkles,
  Star,
  Store,
  Tags,
  Users,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import { Tooltip } from "@/components/admin/ui/Tooltip";
import { useAdminAuth } from "@/lib/admin/auth";
import { LOW_STOCK_THRESHOLD, totalStock } from "@/lib/admin/data";
import { useAdminStore } from "@/lib/admin/store";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: "orders" | "reviews" | "stock";
  children?: { label: string; href: string }[];
};

type NavGroup = { label: string; items: NavItem[] };

const navigation: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Catalogue",
    items: [
      {
        label: "Products",
        href: "/admin/products",
        icon: Package,
        children: [
          { label: "All products", href: "/admin/products" },
          { label: "Add product", href: "/admin/products/new" },
        ],
      },
      { label: "Categories", href: "/admin/categories", icon: Tags },
      { label: "Collections", href: "/admin/collections", icon: LayoutGrid },
      { label: "Inventory", href: "/admin/inventory", icon: Warehouse, badge: "stock" },
    ],
  },
  {
    label: "Selling",
    items: [
      { label: "Orders", href: "/admin/orders", icon: ShoppingCart, badge: "orders" },
      { label: "Customers", href: "/admin/customers", icon: Users },
      { label: "Reviews", href: "/admin/reviews", icon: Star, badge: "reviews" },
      { label: "Coupons", href: "/admin/coupons", icon: BadgePercent },
    ],
  },
  {
    label: "Storefront",
    items: [
      { label: "Banners", href: "/admin/banners", icon: Images },
      { label: "Reports", href: "/admin/reports", icon: BarChart3 },
      { label: "Settings", href: "/admin/settings", icon: Store },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { signOut } = useAdminAuth();
  const { orders, reviews, products } = useAdminStore();
  const [override, setOverride] = useState<{ path: string; label: string | null } | null>(null);

  const drafts = products.filter((product) => product.status === "draft").length;

  const counts = {
    orders: orders.filter((order) => order.status === "pending").length,
    reviews: reviews.filter((review) => review.status === "pending").length,
    stock: products.filter((product) => totalStock(product) <= LOW_STOCK_THRESHOLD).length,
  };

  // The group holding the current route opens by default; clicking a parent overrides that.
  const routeExpanded = useMemo(
    () =>
      navigation
        .flatMap((group) => group.items)
        .find((item) => item.children && isActive(pathname, item.href))?.label ?? null,
    [pathname],
  );
  const expanded = override?.path === pathname ? override.label : routeExpanded;

  const renderLink = (item: NavItem) => {
    const active = isActive(pathname, item.href);
    const badgeCount = item.badge ? counts[item.badge] : 0;
    const hasChildren = Boolean(item.children?.length);

    const link = (
      <Link
        className={`admin-nav-link ${active ? "is-active" : ""}`.trim()}
        href={item.href}
        onClick={() => {
          if (hasChildren && !collapsed) {
            // Toggle the sub-menu but still navigate to the section index.
            setOverride({ path: pathname, label: expanded === item.label ? null : item.label });
          }
          onNavigate?.();
        }}
        aria-current={active ? "page" : undefined}
      >
        {active ? (
          <motion.span className="admin-nav-indicator" layoutId="admin-nav-indicator" transition={{ duration: 0.24 }} />
        ) : null}
        <span className="admin-nav-link__icon">
          <item.icon size={18} aria-hidden="true" />
        </span>
        {!collapsed ? (
          <>
            <span className="admin-nav-link__label">{item.label}</span>
            {badgeCount > 0 ? <span className="admin-nav-link__count">{badgeCount}</span> : null}
            {hasChildren ? (
              <motion.span
                animate={{ rotate: expanded === item.label ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: "grid", placeItems: "center" }}
              >
                <ChevronDown size={14} aria-hidden="true" />
              </motion.span>
            ) : null}
          </>
        ) : badgeCount > 0 ? (
          <span
            className="admin-nav-link__count"
            style={{ position: "absolute", top: 6, right: 10, minWidth: 16, height: 16, fontSize: "0.5rem" }}
          >
            {badgeCount}
          </span>
        ) : null}
      </Link>
    );

    return (
      <li key={item.href}>
        {collapsed ? <Tooltip label={item.label}>{link}</Tooltip> : link}

        <AnimatePresence initial={false}>
          {!collapsed && hasChildren && expanded === item.label ? (
            <motion.ul
              className="admin-nav-list"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.2, 0.7, 0, 1] }}
              style={{ overflow: "hidden", paddingLeft: 32, marginTop: 2 }}
            >
              {item.children!.map((child) => (
                <li key={child.href}>
                  <Link
                    className={`admin-nav-link ${pathname === child.href ? "is-active" : ""}`.trim()}
                    href={child.href}
                    onClick={onNavigate}
                    style={{ height: 36, fontSize: "0.76rem" }}
                  >
                    <span className="admin-nav-link__label">{child.label}</span>
                  </Link>
                </li>
              ))}
            </motion.ul>
          ) : null}
        </AnimatePresence>
      </li>
    );
  };

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__head">
        <Link href="/admin" className="admin-login__mark" aria-label="MI TRENDS admin home">
          <span className="admin-brand-mark" aria-hidden="true">
            MI
          </span>
          <AnimatePresence initial={false}>
            {!collapsed ? (
              <motion.span
                className="admin-brand-copy"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                <span className="admin-brand-name">TRENDS</span>
                <span className="admin-brand-role">Admin</span>
              </motion.span>
            ) : null}
          </AnimatePresence>
        </Link>
      </div>

      <nav className="admin-sidebar__scroll" aria-label="Admin sections">
        {navigation.map((group) => (
          <div className="admin-nav-group" key={group.label}>
            <span className="admin-nav-group__label">{collapsed ? group.label.slice(0, 3) : group.label}</span>
            <ul className="admin-nav-list">{group.items.map(renderLink)}</ul>
          </div>
        ))}
      </nav>

      <div className="admin-sidebar__foot">
        <AnimatePresence initial={false}>
          {!collapsed && drafts > 0 ? (
            <motion.div
              className="admin-sidebar-card"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              style={{ overflow: "hidden", marginBottom: 10 }}
            >
              <span className="a-row" style={{ gap: 7, fontSize: "0.74rem", fontWeight: 800 }}>
                <Sparkles size={14} aria-hidden="true" style={{ color: "var(--yellow)" }} />
                Ready to publish
              </span>
              <p>
                {drafts} {drafts === 1 ? "product is" : "products are"} still in draft. Publish
                before the next campaign goes live.
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {collapsed ? (
          <Tooltip label="Sign out">
            <button className="admin-signout" type="button" onClick={signOut}>
              <span className="admin-nav-link__icon">
                <LogOut size={18} aria-hidden="true" />
              </span>
            </button>
          </Tooltip>
        ) : (
          <button className="admin-signout" type="button" onClick={signOut}>
            <span className="admin-nav-link__icon">
              <LogOut size={18} aria-hidden="true" />
            </span>
            Sign out
          </button>
        )}
      </div>
    </aside>
  );
}
