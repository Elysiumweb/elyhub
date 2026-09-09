import { cn } from "@/lib/utils";

export function Card({ className, ...props }) {
  return <div className={cn("border border-white/10 bg-[#141414] text-white", className)} {...props} />;
}
export function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col space-y-1.5 p-5", className)} {...props} />;
}
export function CardTitle({ className, children, ...props }) {
  return (
    <h3 className={cn("font-display text-sm uppercase tracking-wide", className)} {...props}>
      {children}
    </h3>
  );
}
export function CardDescription({ className, ...props }) {
  return <p className={cn("text-xs text-zinc-400", className)} {...props} />;
}
export function CardContent({ className, ...props }) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}
export function CardFooter({ className, ...props }) {
  return <div className={cn("flex items-center p-5 pt-0", className)} {...props} />;
}
