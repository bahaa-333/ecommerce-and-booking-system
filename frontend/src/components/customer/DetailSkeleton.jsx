import { Skeleton } from "../Skeleton";

export default function DetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <div>
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="mt-3 h-6 w-24" />
        <Skeleton className="mt-5 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-5/6" />
        <Skeleton className="mt-8 h-12 w-full rounded-full" />
      </div>
    </div>
  );
}
