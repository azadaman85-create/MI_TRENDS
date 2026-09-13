"use client";

import { useRouter } from "next/navigation";

import { EmptyState } from "@/components/admin/ui/States";

export default function PanelNotFound() {
  const router = useRouter();

  return (
    <div className="a-card" style={{ padding: 8 }}>
      <EmptyState
        title="Page not found"
        message="That admin screen does not exist. Pick a section from the sidebar to carry on."
        actionLabel="Go to dashboard"
        onAction={() => router.push("/admin")}
      />
    </div>
  );
}
