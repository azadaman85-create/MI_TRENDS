"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const SESSION_KEY = "mitrends-admin-session-v2";
/** Sessions saved before the demo identity changed; cleared on load. */
const LEGACY_SESSION_KEYS = ["mitrends-admin-session-v1"];

/**
 * Demo credentials. The storefront has no backend in this project, so the panel ships
 * with a local session instead of a real identity provider — swap `signIn` for an API
 * call when one exists.
 */
export const DEMO_EMAIL = "admin@mitrends.in";
export const DEMO_PASSWORD = "mitrends2026";

export type AdminUser = {
  name: string;
  email: string;
  role: string;
  initials: string;
};

type AdminAuthValue = {
  user: AdminUser | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  signOut: () => void;
};

const AdminAuthContext = createContext<AdminAuthValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // The session can only be read in the browser, so it lands after the first paint
    // rather than during render — otherwise server and client markup disagree.
    try {
      LEGACY_SESSION_KEYS.forEach((key) => {
        window.localStorage.removeItem(key);
        window.sessionStorage.removeItem(key);
      });
      const saved = window.sessionStorage.getItem(SESSION_KEY) ?? window.localStorage.getItem(SESSION_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setUser(JSON.parse(saved) as AdminUser);
    } catch {
      // No readable session — the route guard will send the user to the login page.
    }
    setReady(true);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    // Simulated round trip so the loading state is visible and honest about latency.
    await new Promise((resolve) => setTimeout(resolve, 850));

    if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
      return { ok: false, message: "Those credentials do not match an admin account." };
    }

    const nextUser: AdminUser = {
      name: "Demo Admin",
      email: DEMO_EMAIL,
      role: "Store owner",
      initials: "DA",
    };

    setUser(nextUser);
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
    } catch {
      // Session stays in memory only.
    }
    return { ok: true };
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    try {
      window.localStorage.removeItem(SESSION_KEY);
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // Already gone.
    }
  }, []);

  const value = useMemo(() => ({ user, ready, signIn, signOut }), [user, ready, signIn, signOut]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return context;
}
