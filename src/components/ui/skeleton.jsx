import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }) {
  return <div className={cn("animate-pulse bg-white/10", className)} {...props} />;
}
