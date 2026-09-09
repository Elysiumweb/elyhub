import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;
const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List ref={ref} className={cn("inline-flex items-center border-b border-white/10 w-full", className)} {...props} />
));
TabsList.displayName = "TabsList";
const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger ref={ref} className={cn("px-4 py-2 text-xs uppercase tracking-wider text-zinc-400 border-b-2 border-transparent data-[state=active]:text-[#D8CA82] data-[state=active]:border-[#D8CA82] transition-colors", className)} {...props} />
));
TabsTrigger.displayName = "TabsTrigger";
const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content ref={ref} className={cn("pt-4", className)} {...props} />
));
TabsContent.displayName = "TabsContent";
export { Tabs, TabsList, TabsTrigger, TabsContent };
