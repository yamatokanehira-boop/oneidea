"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, List, Plus, Star, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/home", icon: Home, label: "ホーム" },
  { href: "/drawer", icon: List, label: "引き出し" },
  { href: "/new", icon: Plus, label: "追加" },
  { href: "/review", icon: Star, label: "レビュー" },
  { href: "/settings", icon: Settings, label: "設定" },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <footer
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-background/80 backdrop-blur-sm dark:border-zinc-800"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <nav className="mx-auto flex h-[70px] max-w-md items-center justify-around">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-1 text-xs",
              pathname === item.href || (item.href === "/home" && pathname === "/")
                ? "text-zinc-900 dark:text-white"
                : "text-zinc-400"
            )}
          >
            <item.icon className="h-6 w-6" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </footer>
  );
}
