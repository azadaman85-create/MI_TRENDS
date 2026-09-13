"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const SESSION_KEY = "mitrends-admin-session-v2";
/** Sessions saved before the demo identity changed; cleared on load. */
const LEGACY_SESSION_KEYS = ["mitrends-admin-session-v1"];

/**
 * Super admin identity.
 *
 * There is no backend in this project, so the panel verifies the password in the
 * browser. That means this is NOT a real security boundary — anyone can edit the
 * client bundle to walk past it. What it does guarantee is that the password
 * itself is never written down: only a salted SHA-256 digest is ever compared,
 * and the digest lives in env rather than in the repository.
 *
 * Set these in `.env.local` (gitignored). Replace `signIn` with a server call the
 * moment a real identity provider exists.
 */
export const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "").trim().toLowerCase();
export const ADMIN_NAME = process.env.NEXT_PUBLIC_ADMIN_NAME ?? "Admin";

const ADMIN_PASSWORD_SALT = process.env.NEXT_PUBLIC_ADMIN_PASSWORD_SALT ?? "";
const ADMIN_PASSWORD_HASH = process.env.NEXT_PUBLIC_ADMIN_PASSWORD_HASH ?? "";

/** True when the four env vars above are present, so the UI can explain itself. */
export const ADMIN_CONFIGURED = Boolean(ADMIN_EMAIL && ADMIN_PASSWORD_SALT && ADMIN_PASSWORD_HASH);

/** Same construction as the storefront account store: SHA-256 over `salt:password`. */
async function hashPassword(password: string, salt: string) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Length-constant compare so a wrong password cannot be timed character by character. */
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Initials for the avatar, derived from the configured name. */
function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "AD";
  const first = parts[0]![0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]![0] ?? "") : (parts[0]![1] ?? "");
  return (first + last).toUpperCase();
}

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

    if (!ADMIN_CONFIGURED) {
      return {
        ok: false,
        message: "No admin account is configured. Set NEXT_PUBLIC_ADMIN_* in .env.local.",
      };
    }

    const attempted = await hashPassword(password, ADMIN_PASSWORD_SALT);
    if (email.trim().toLowerCase() !== ADMIN_EMAIL || !safeEqual(attempted, ADMIN_PASSWORD_HASH)) {
      return { ok: false, message: "Those credentials do not match an admin account." };
    }

    const nextUser: AdminUser = {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      role: "Super admin",
      initials: initialsFor(ADMIN_NAME),
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
