import type { Metadata } from "next";
import { headers } from "next/headers";

import { CatalogProvider } from "@/components/CatalogProvider";
import { StoreProvider } from "@/components/StoreProvider";
import { getLiveBanners } from "@/lib/content.server";
import { getActiveProducts } from "@/lib/products.server";
import { PATHNAME_HEADER } from "@/lib/request-path";
import { siteUrl } from "@/lib/site";
import { CustomerAuthProvider } from "@/lib/account/auth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import SearchOverlay from "@/components/SearchOverlay";
import MobileNav from "@/components/MobileNav";
import MobileTabBar from "@/components/MobileTabBar";
import Toast from "@/components/Toast";

/**
 * Read per request, so publishing a product in the panel shows up on the next page load
 * rather than at the next deploy. The route segment opts out of static rendering for the
 * same reason — a prerendered shop page would freeze the catalogue into the build.
 */
export const dynamic = "force-dynamic";

/**
 * A canonical URL per route.
 *
 * The root layout used to declare `canonical: "/"`, which every page inherited — so a
 * product page told search engines it was really the homepage. That is worse than no
 * canonical at all: it invites the product pages to be dropped from the index.
 *
 * Query strings are deliberately dropped. /shop?tag=new is a filtered view of /shop, not
 * a separate page, and letting each filter combination claim its own canonical would
 * split the ranking across hundreds of near-identical URLs.
 */
export async function generateMetadata(): Promise<Metadata> {
  const pathname = (await headers()).get(PATHNAME_HEADER) || "/";
  return { alternates: { canonical: new URL(pathname, siteUrl()).toString() } };
}

export default async function StoreLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [products, banners] = await Promise.all([getActiveProducts(), getLiveBanners()]);

  return (
    <CustomerAuthProvider>
      <CatalogProvider products={products} banners={banners}>
        <StoreProvider>
          <Header />
          <main id="main-content">{children}</main>
          <Footer />
          <CartDrawer />
          <SearchOverlay />
          <MobileNav />
          <MobileTabBar />
          <Toast />
        </StoreProvider>
      </CatalogProvider>
    </CustomerAuthProvider>
  );
}
