import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center border px-2 py-0.5 text-xs font-medium transition-colors", {
  variants: {
    variant: {
      default: "border-white/10 bg-white/5 text-zinc-300",
      gold: "border-[#D8CA82]/40 bg-[#D8CA82]/10 text-[#D8CA82]",
    },
  },
  defaultVariants: { variant: "default" },
});

export function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
export { badgeVariants };
