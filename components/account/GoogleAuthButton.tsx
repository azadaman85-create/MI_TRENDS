"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useCustomer } from "@/lib/account/auth";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const GSI_SRC = "https://accounts.google.com/gsi/client";

type GoogleCredentialResponse = { credential?: string };

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        ux_mode?: "popup" | "redirect";
        auto_select?: boolean;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: {
          type?: "standard" | "icon";
          theme?: "outline" | "filled_blue" | "filled_black";
          size?: "small" | "medium" | "large";
          text?: "signin_with" | "signup_with" | "continue_with";
          shape?: "rectangular" | "pill";
          width?: number;
          logo_alignment?: "left" | "center";
        },
      ) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

/**
 * Google Identity Services button. Configure NEXT_PUBLIC_GOOGLE_CLIENT_ID with an OAuth
 * client from the Google Cloud console (authorised JavaScript origin = this site) to turn
 * it on; without it the button explains what is missing instead of pretending to work.
 */
export function GoogleAuthButton({
  mode = "signin_with",
  onSuccess,
  onError,
}: {
  mode?: "signin_with" | "signup_with" | "continue_with";
  onSuccess?: () => void;
  onError?: (message: string) => void;
}) {
  const { signInWithGoogle } = useCustomer();
  const holderRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "ready" | "working" | "blocked">("idle");

  const handleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (!response.credential) {
        onError?.("Google didn't return a credential. Try again.");
        return;
      }
      setStatus("working");
      const result = await signInWithGoogle(response.credential);
      setStatus("ready");
      if (result.ok) onSuccess?.();
      else onError?.(result.message);
    },
    [signInWithGoogle, onSuccess, onError],
  );

  useEffect(() => {
    if (!CLIENT_ID) return;

    let cancelled = false;

    const render = () => {
      if (cancelled || !window.google || !holderRef.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredential,
        ux_mode: "popup",
      });
      holderRef.current.replaceChildren();
      window.google.accounts.id.renderButton(holderRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: mode,
        shape: "rectangular",
        width: Math.min(holderRef.current.offsetWidth || 360, 400),
        logo_alignment: "left",
      });
      setStatus("ready");
    };

    if (window.google) {
      render();
      return () => {
        cancelled = true;
      };
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    const script = existing ?? document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", render);
    script.addEventListener("error", () => setStatus("blocked"));
    if (!existing) document.head.appendChild(script);

    return () => {
      cancelled = true;
      script.removeEventListener("load", render);
    };
  }, [handleCredential, mode]);

  if (!CLIENT_ID) {
    return (
      <div className="google-slot google-slot--setup">
        <GoogleMark />
        <span>
          <strong>Google sign-in needs a client ID.</strong>
          Add <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to <code>.env.local</code> and restart the
          dev server.
        </span>
      </div>
    );
  }

  return (
    <div className="google-slot">
      <div ref={holderRef} className="google-slot__button" />
      {status === "working" && <p className="google-slot__note">Signing you in…</p>}
      {status === "blocked" && (
        <p className="google-slot__note">
          Google&apos;s script couldn&apos;t load — check the network or an ad blocker.
        </p>
      )}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.92v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.96 10.71a5.4 5.4 0 0 1 0-3.42V4.96H.92a9 9 0 0 0 0 8.08l3.04-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .92 4.96l3.04 2.33C4.67 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  );
}
