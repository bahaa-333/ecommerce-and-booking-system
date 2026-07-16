import { Skeleton } from "../Skeleton";

export default function SimpleDetailSkeleton() {
  return (
    <div className="mx-auto max-w-lg">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-2 h-4 w-52" />

      <div className="mt-6 space-y-3 rounded-2xl border border-gray-100 bg-white p-5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
