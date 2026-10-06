"use client";

import Link from "next/link";
import { useEffect } from "react";

import { BrandLogo } from "@/components/BrandLogo";

/**
 * Catches a render-time error anywhere under the root layout, so a single bad product
 * or a failed fetch shows a branded page with a way out instead of a blank screen.
 *
 * `digest` is the only detail shown: Next strips server error messages in production
 * precisely so internals don't reach the browser, and the digest is what ties a report
 * back to the server log.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <main className="status-page">
      <Link href="/" aria-label="MI TRENDS home">
        <BrandLogo height={34} priority />
      </Link>

      <p className="status-page__code" aria-hidden="true">
        !
      </p>
      <h1 className="status-page__title">Something went wrong</h1>
      <p className="status-page__lede">
        That one is on us, not you. Nothing you were doing has been lost — try again, and
        if it keeps happening, tell us and we&rsquo;ll sort it.
      </p>

      <div className="status-page__actions">
        <button className="button button-primary" type="button" onClick={reset}>
          Try again
        </button>
        <Link className="button button--outline" href="/">
          Back to home
        </Link>
      </div>

      <p className="status-page__foot">
        Need a hand? <Link href="/info/contact">Contact support</Link>
        {error.digest ? (
          <>
            {" "}
            and quote reference <code>{error.digest}</code>.
          </>
        ) : (
          "."
        )}
      </p>
    </main>
  );
}
