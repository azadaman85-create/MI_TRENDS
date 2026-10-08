import { CatalogProvider } from "@/components/CatalogProvider";
import { StoreProvider } from "@/components/StoreProvider";
import { getActiveProducts } from "@/lib/products.server";
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

export default async function StoreLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const products = await getActiveProducts();

  return (
    <CustomerAuthProvider>
      <CatalogProvider products={products}>
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
