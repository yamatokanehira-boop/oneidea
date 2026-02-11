"use client";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Toaster() {
  const toast = useAppStore((state) => state.toast);

  return (
    <div
      className={cn(
        "fixed bottom-24 left-1/2 -translate-x-1/2 z-50 rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg transition-all duration-300 ease-in-out",
        toast
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      )}
    >
      {toast?.message}
    </div>
  );
}
