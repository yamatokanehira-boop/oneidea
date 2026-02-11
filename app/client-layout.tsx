"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { ThemeProvider } from "next-themes";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/features/toaster";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings, loadSettings, setDbError } = useAppStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    loadSettings();
  }, [loadSettings, setDbError]);

  // settings.fontSize に基づいてhtml要素にクラスを追加
  useEffect(() => {
    if (settings?.fontSize) {
      document.documentElement.classList.remove('font-size-sm', 'font-size-md', 'font-size-lg');
      document.documentElement.classList.add(`font-size-${settings.fontSize}`);
    }
  }, [settings?.fontSize]);

  if (!isClient || !settings) {
    return null;
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={settings.theme}
      enableSystem
      disableTransitionOnChange
    >
      <div className="flex h-screen flex-col">
        <Toaster />
        <main className="flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+70px)]">
          <div className="container mx-auto max-w-md px-4 pt-8">
            {children}
          </div>
        </main>
        <BottomTabBar />
      </div>
    </ThemeProvider>
  );
}