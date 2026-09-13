"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Sidebar } from "@/components/admin/Sidebar";
import { Topbar } from "@/components/admin/Topbar";
import { useAdminAuth } from "@/lib/admin/auth";
import { pageVariants } from "@/lib/admin/motion";

const COLLAPSE_KEY = "mitrends-admin-sidebar-collapsed";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready } = useAdminAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    // Read the stored preference after mount so the server and client markup agree.
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "true");
    } catch {
      // Default to the expanded sidebar.
    }
  }, []);

  useEffect(() => {
    if (ready && !user) router.replace("/admin/login");
  }, [ready, user, router]);

  const toggleSidebar = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, String(next));
      } catch {
        // Preference just won't persist.
      }
      return next;
    });
  }, []);

  if (!ready || !user) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100dvh", gap: 14 }}>
        <span className="admin-brand-mark" style={{ background: "var(--ink)", color: "var(--white)" }} aria-hidden="true">
          MI
        </span>
        <span className="a-micro">{ready ? "Redirecting to sign in…" : "Loading your workspace…"}</span>
      </div>
    );
  }

  return (
    <div className="admin-shell" data-collapsed={collapsed}>
      {/* Desktop rail + tablet/mobile drawer share one component. */}
      <div className="admin-sidebar-slot admin-only-desktop-block">
        <Sidebar collapsed={collapsed} />
      </div>

      <AnimatePresence>
        {mobileNavOpen ? (
          <>
            <motion.div
              className="a-scrim admin-only-mobile-block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.div
              className="admin-mobile-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
            >
              <Sidebar collapsed={false} onNavigate={() => setMobileNavOpen(false)} />
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <div className="admin-main">
        <Topbar
          collapsed={collapsed}
          onToggleSidebar={toggleSidebar}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />
        <main className="admin-content">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={pathname} variants={pageVariants} initial="hidden" animate="visible" exit="exit">
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
