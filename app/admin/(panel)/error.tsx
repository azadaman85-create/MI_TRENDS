"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/admin/ui/States";

export default function PanelError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface the failure in the console so it is not swallowed by the boundary.
    console.error(error);
  }, [error]);

  return (
    <div className="a-card" style={{ padding: 8 }}>
      <ErrorState
        title="This screen failed to load"
        message={
          error.message ||
          "Something went wrong while rendering this page. Retry, and if it keeps happening check the console for details."
        }
        onRetry={reset}
      />
    </div>
  );
}
