"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { ThemeProvider, useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/features/toaster";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Header } from "@/components/layout/header";
import { Camera, CalendarDays } from "lucide-react";
import Link from "next/link";
import { SettingsProvider, useSettings } from "@/components/providers/settings-provider";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { FileText } from "lucide-react"; // FileTextをインポート

function AppContent({ children }: { children: React.ReactNode }) {
  const { settings: appSettings, loadSettings, setDbError, setTempCapturedImage } = useAppStore();
  const { settings: userSettings } = useSettings(); // Our new settings provider
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === '/home';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setTheme } = useTheme();

  // 下書き件数をリアルタイムで購読
  const draftCount = useLiveQuery(() => db.drafts.count(), []);

  useEffect(() => {
    setIsClient(true);
    loadSettings();
  }, [loadSettings, setDbError]);

  // Apply fontMode class from our new settings provider
  useEffect(() => {
    if (userSettings?.fontMode) {
      const root = document.documentElement;
      root.classList.remove('font-mode-gothic', 'font-mode-rounded', 'font-mode-mincho');
      root.classList.add(`font-mode-${userSettings.fontMode}`);
    }
  }, [userSettings?.fontMode]);

  // Apply fontSize class from existing app store
  useEffect(() => {
    if (appSettings?.fontSize) {
      document.documentElement.classList.remove('font-size-sm', 'font-size-md', 'font-size-lg');
      document.documentElement.classList.add(`font-size-${appSettings.fontSize}`);
    }
  }, [appSettings?.fontSize]);

  // Apply theme from existing app store
  useEffect(() => {
    if (appSettings?.theme) {
      if (appSettings.theme === 'light' || appSettings.theme === 'dark') {
        setTheme(appSettings.theme);
      } else if (appSettings.theme === 'system') {
        setTheme('system');
      }
    }
  }, [appSettings?.theme, setTheme]);

  const handleCaptureClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempCapturedImage(reader.result as string);
        router.push('/new');
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [setTempCapturedImage, router]);

  const cameraShortcut = (
    <>
      <button 
        onClick={handleCaptureClick} 
        className="flex flex-col items-center justify-center text-xs text-foreground/70 active:scale-95 transition-transform duration-75 ease-out"
      >
        <Camera size={20} />
        <span>カメラ</span>
      </button>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );

  const calendarShortcut = (
    <Link href="/calendar" className="flex flex-col items-center justify-center text-xs text-foreground/70 active:scale-95 transition-transform duration-75 ease-out">
      <CalendarDays size={20} />
      <span>カレンダー</span>
    </Link>
  );

  const draftsShortcut = (
    <Link href="/drafts" className="relative flex flex-col items-center justify-center text-xs text-foreground/70 active:scale-95 transition-transform duration-75 ease-out">
      <FileText size={20} />
      <span>下書き</span>
      {draftCount !== undefined && draftCount > 0 && (
        <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
          {draftCount > 99 ? '99+' : draftCount}
        </div>
      )}
    </Link>
  );

  const contentReady = isClient && appSettings;

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={false}
      disableTransitionOnChange
    >
      <div className="flex h-screen flex-col">
        <Header
          leftContent={isHome ? cameraShortcut : undefined}
          rightContent={
            isHome ? (
              <div className="flex items-center gap-3">
                {draftsShortcut}
                {calendarShortcut}
              </div>
            ) : undefined
          }
        />
        <Toaster />
        <main className="flex-1 overflow-y-auto pt-[calc(env(safe-area-inset-top)+56px+24px)] pb-[calc(env(safe-area-inset-bottom)+70px+16px)]">
          <div className="container mx-auto max-w-md px-4">
            {!contentReady ? (
              <div className="flex justify-center items-center h-full">
                <p>読み込み中...</p>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
        {contentReady && <BottomTabBar />}
      </div>
    </ThemeProvider>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <AppContent>{children}</AppContent>
    </SettingsProvider>
  );
}