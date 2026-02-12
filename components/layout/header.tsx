"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface HeaderProps {
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export function Header({ leftContent, rightContent }: HeaderProps) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border",
        "h-[calc(56px+env(safe-area-inset-top))]", // Standard height + safe area
        "pt-[env(safe-area-inset-top)]" // Add padding for safe area
      )}
    >
      <div className="flex items-center justify-between h-[56px] px-4">
        <div className="flex items-center w-1/3 justify-start">
          {leftContent}
        </div>
        <div className="flex-1 text-center">
          <Link href="/" className="font-bold text-lg tracking-tight">
            ONEIDEA
          </Link>
        </div>
        <div className="flex items-center w-1/3 justify-end">
          {rightContent}
        </div>
      </div>
    </header>
  );
}