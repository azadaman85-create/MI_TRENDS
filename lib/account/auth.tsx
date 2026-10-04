"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Customer accounts for the storefront.
 *
 * These used to live entirely in the browser's localStorage. They're now backed by
 * MongoDB through `/api/auth/*`: passwords are scrypt-hashed server-side, the session is
 * a signed HttpOnly cookie the page's JavaScript can't read, and the Google ID token is
 * verified with Google server-side instead of being trusted after a client-side decode.
 *
 * This context's shape is deliberately unchanged from the localStorage version so every
 * page using `useCustomer()` keeps working as-is — only the internals moved.
 */

export type AuthProvider = "password" | "google";

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  picture?: string;
  provider: AuthProvider;
  createdAt: string;
};

export type SignUpInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
};

export type AuthResult = { ok: true; customer: Customer } | { ok: false; message: string };

type CustomerAuthValue = {
  customer: Customer | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (input: SignUpInput) => Promise<AuthResult>;
  signInWithGoogle: (credential: string) => Promise<AuthResult>;
  signOut: () => void;
};

const CustomerAuthContext = createContext<CustomerAuthValue | undefined>(undefined);

const OFFLINE_MESSAGE = "We couldn't reach the server. Please try again.";

/** Posts JSON and normalizes every failure into an `AuthResult`. */
async function postAuth(path: string, payload: unknown): Promise<AuthResult> {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { ok?: boolean; message?: string; customer?: Customer };
    if (!response.ok || !data.ok || !data.customer) {
      return { ok: false, message: data.message ?? "That didn't work. Please try again." };
    }
    return { ok: true, customer: data.customer };
  } catch {
    return { ok: false, message: OFFLINE_MESSAGE };
  }
}

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [ready, setReady] = useState(false);

  // The session cookie is HttpOnly, so the only way to learn who's signed in is to ask.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        if (cancelled) return;
        const data = (await response.json()) as { customer: Customer | null };
        setCustomer(data.customer ?? null);
      } catch {
        if (!cancelled) setCustomer(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signUp = useCallback(async (input: SignUpInput): Promise<AuthResult> => {
    const result = await postAuth("/api/auth/signup", input);
    if (result.ok) setCustomer(result.customer);
    return result;
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const result = await postAuth("/api/auth/login", { email, password });
    if (result.ok) setCustomer(result.customer);
    return result;
  }, []);

  const signInWithGoogle = useCallback(async (credential: string): Promise<AuthResult> => {
    const result = await postAuth("/api/auth/google", { credential });
    if (result.ok) setCustomer(result.customer);
    return result;
  }, []);

  const signOut = useCallback(() => {
    setCustomer(null);
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {
      // The cookie expires on its own even if this never lands.
    });
  }, []);

  const value = useMemo(
    () => ({ customer, ready, signIn, signUp, signInWithGoogle, signOut }),
    [customer, ready, signIn, signUp, signInWithGoogle, signOut],
  );

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomer() {
  const context = useContext(CustomerAuthContext);
  if (!context) throw new Error("useCustomer must be used inside CustomerAuthProvider");
  return context;
}

export function initialsOf(name: string, email: string) {
  const source = name.trim() || email;
  const parts = source.split(/[\s.@]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "MI";
}
