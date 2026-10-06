import Link from "next/link";
import type { Metadata } from "next";

import { BrandLogo } from "@/components/BrandLogo";

/**
 * 404 for any URL that matches no route.
 *
 * Lives at the app root, so it renders inside the root layout only — the storefront
 * header and footer belong to the (store) group and aren't available here. It is
 * therefore self-contained, with its own lockup and a way back into the shop.
 */

export const metadata: Metadata = {
  title: "Page not found",
  // A missing page has nothing worth indexing, and shouldn't dilute the real ones.
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="status-page">
      <Link href="/" aria-label="MI TRENDS home">
        <BrandLogo height={34} priority />
      </Link>

      <p className="status-page__code" aria-hidden="true">
        404
      </p>
      <h1 className="status-page__title">This page isn&rsquo;t here</h1>
      <p className="status-page__lede">
        The link may be old, or the piece may have sold out and been retired. Everything
        still in stock is one tap away.
      </p>

      <div className="status-page__actions">
        <Link className="button button-primary" href="/shop">
          Shop everything
        </Link>
        <Link className="button button--outline" href="/">
          Back to home
        </Link>
      </div>

      <p className="status-page__foot">
        Looking for an order? <Link href="/info/track-order">Track it here</Link> or{" "}
        <Link href="/info/contact">talk to us</Link>.
      </p>
    </main>
  );
}
