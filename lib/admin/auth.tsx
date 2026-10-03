"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/**
 * Super admin identity.
 *
 * Credentials are verified server-side in `app/api/admin/login/route.ts` — the
 * password salt+hash never reach the browser. The session itself is an HttpOnly,
 * signed cookie (see `lib/admin/session.server.ts`), so it can't be read or forged
 * from client JS either. This context only mirrors that server state for the UI.
 */

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
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/admin/session", { cache: "no-store" });
        if (cancelled) return;
        if (response.ok) {
          const data = (await response.json()) as { user: AdminUser | null };
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as { ok: boolean; message?: string; user?: AdminUser };
      if (!data.ok || !data.user) {
        return { ok: false, message: data.message ?? "Sign in failed." };
      }
      setUser(data.user);
      return { ok: true };
    } catch {
      return { ok: false, message: "Could not reach the server. Try again." };
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    fetch("/api/admin/logout", { method: "POST" }).catch(() => {
      // Cookie will still expire on its own.
    });
  }, []);

  const value = useMemo(() => ({ user, ready, signIn, signOut }), [user, ready, signIn, signOut]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return context;
}
