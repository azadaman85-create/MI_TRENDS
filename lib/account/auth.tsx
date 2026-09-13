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
 * This project has no backend, so accounts and sessions live in the browser. Passwords
 * are never stored in the clear — each account keeps a random salt and a SHA-256 digest —
 * but client-side hashing is not a substitute for a server: move `signUp`/`signIn` to a
 * real API (and verify the Google ID token there) before this handles live customers.
 */

const ACCOUNTS_KEY = "mitrends-customers-v1";
const SESSION_KEY = "mitrends-customer-session-v1";

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

type StoredAccount = Customer & {
  salt?: string;
  hash?: string;
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

function readAccounts(): StoredAccount[] {
  try {
    return JSON.parse(window.localStorage.getItem(ACCOUNTS_KEY) ?? "[]") as StoredAccount[];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: StoredAccount[]) {
  try {
    window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // Private mode — the account only lasts for this session.
  }
}

function randomId(bytes = 8) {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return Array.from(buffer, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password: string, salt: string) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Strips the credential fields before an account is handed to the UI. */
function publicProfile(account: StoredAccount): Customer {
  const { id, name, email, phone, picture, provider, createdAt } = account;
  return { id, name, email, phone, picture, provider, createdAt };
}

/** Reads the payload of a Google ID token. The signature still needs server-side checking. */
export function decodeIdToken(credential: string) {
  const [, payload] = credential.split(".");
  if (!payload) throw new Error("Malformed credential");
  const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(decodeURIComponent(escape(json))) as {
    sub: string;
    email: string;
    name?: string;
    given_name?: string;
    picture?: string;
    email_verified?: boolean;
  };
}

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SESSION_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setCustomer(JSON.parse(saved) as Customer);
    } catch {
      // No readable session — the visitor stays signed out.
    }
    setReady(true);
  }, []);

  const startSession = useCallback((next: Customer) => {
    setCustomer(next);
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    } catch {
      // Session stays in memory only.
    }
  }, []);

  const signUp = useCallback(
    async ({ name, email, password, phone }: SignUpInput): Promise<AuthResult> => {
      const normalized = email.trim().toLowerCase();
      const accounts = readAccounts();

      if (accounts.some((account) => account.email === normalized)) {
        return { ok: false, message: "An account with that email already exists. Try signing in." };
      }

      const salt = randomId();
      const account: StoredAccount = {
        id: randomId(6),
        name: name.trim(),
        email: normalized,
        phone: phone?.trim() || undefined,
        provider: "password",
        createdAt: new Date().toISOString(),
        salt,
        hash: await hashPassword(password, salt),
      };

      writeAccounts([...accounts, account]);
      const profile = publicProfile(account);
      startSession(profile);
      return { ok: true, customer: profile };
    },
    [startSession],
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const normalized = email.trim().toLowerCase();
      const account = readAccounts().find((entry) => entry.email === normalized);

      if (!account || !account.salt || !account.hash) {
        return { ok: false, message: "We couldn't find an account with those details." };
      }

      const hash = await hashPassword(password, account.salt);
      if (hash !== account.hash) {
        return { ok: false, message: "That email and password don't match." };
      }

      const profile = publicProfile(account);
      startSession(profile);
      return { ok: true, customer: profile };
    },
    [startSession],
  );

  const signInWithGoogle = useCallback(
    async (credential: string): Promise<AuthResult> => {
      let payload: ReturnType<typeof decodeIdToken>;
      try {
        payload = decodeIdToken(credential);
      } catch {
        return { ok: false, message: "Google sign-in returned something we couldn't read." };
      }

      const normalized = payload.email.trim().toLowerCase();
      const accounts = readAccounts();
      const existing = accounts.find((account) => account.email === normalized);

      const account: StoredAccount = existing
        ? { ...existing, name: payload.name ?? existing.name, picture: payload.picture ?? existing.picture }
        : {
            id: randomId(6),
            name: payload.name ?? payload.given_name ?? normalized.split("@")[0],
            email: normalized,
            picture: payload.picture,
            provider: "google",
            createdAt: new Date().toISOString(),
          };

      writeAccounts(
        existing
          ? accounts.map((entry) => (entry.email === normalized ? account : entry))
          : [...accounts, account],
      );

      const profile = publicProfile(account);
      startSession(profile);
      return { ok: true, customer: profile };
    },
    [startSession],
  );

  const signOut = useCallback(() => {
    setCustomer(null);
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch {
      // Already gone.
    }
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
