import type { Metadata } from "next";

import { AdminAuthProvider } from "@/lib/admin/auth";
import { AdminStoreProvider } from "@/lib/admin/store";
import { Toaster } from "@/components/admin/ui/Toaster";
import "./admin.css";

export const metadata: Metadata = {
  title: {
    default: "MI TRENDS Admin",
    template: "%s | MI TRENDS Admin",
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-root">
      <AdminAuthProvider>
        <AdminStoreProvider>
          {children}
          <Toaster />
        </AdminStoreProvider>
      </AdminAuthProvider>
    </div>
  );
}
