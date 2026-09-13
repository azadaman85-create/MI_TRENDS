import { CardSkeleton, Skeleton } from "@/components/admin/ui/States";

export default function PanelLoading() {
  return (
    <div>
      <div style={{ display: "grid", gap: 9, marginBottom: 26 }}>
        <Skeleton width={140} height={10} />
        <Skeleton width="34%" height={30} />
        <Skeleton width="52%" height={12} />
      </div>

      <div className="a-kpi-grid" data-count="4">
        {Array.from({ length: 4 }).map((_, index) => (
          <CardSkeleton key={index} height={54} />
        ))}
      </div>

      <div className="a-split a-split--wide">
        <CardSkeleton height={240} />
        <CardSkeleton height={240} />
      </div>
    </div>
  );
}
