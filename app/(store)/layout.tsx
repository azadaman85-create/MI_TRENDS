import { StoreProvider } from "@/components/StoreProvider";
import { CustomerAuthProvider } from "@/lib/account/auth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import SearchOverlay from "@/components/SearchOverlay";
import MobileNav from "@/components/MobileNav";
import MobileTabBar from "@/components/MobileTabBar";
import Toast from "@/components/Toast";

export default function StoreLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <CustomerAuthProvider>
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
    </CustomerAuthProvider>
  );
}
