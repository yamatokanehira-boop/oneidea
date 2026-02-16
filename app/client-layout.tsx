"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { ThemeProvider, useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/features/toaster";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Header } from "@/components/layout/header";
import { Camera, CalendarDays, HelpCircle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { SettingsProvider, useSettings } from "@/components/providers/settings-provider";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { FileText } from "lucide-react";

function AppContent({ children }: { children: React.ReactNode }) {
  const { settings: appSettings, loadSettings, setDbError, setTempCapturedImage } = useAppStore();
  const { settings: userSettings } = useSettings();
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === '/home';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setTheme, theme } = useTheme();

  const draftCount = useLiveQuery(() => db.drafts.count(), []);

  useEffect(() => {
    setIsClient(true);
    loadSettings();
  }, [loadSettings, setDbError]);

  useEffect(() => {
    if (userSettings?.fontMode) {
      const root = document.documentElement;
      root.classList.remove('font-mode-gothic', 'font-mode-rounded', 'font-mode-mincho');
      root.classList.add(`font-mode-${userSettings.fontMode}`);
    }
  }, [userSettings?.fontMode]);

  useEffect(() => {
    if (appSettings?.fontSize) {
      document.documentElement.classList.remove('font-size-sm', 'font-size-md', 'font-size-lg');
      document.documentElement.classList.add(`font-size-${appSettings.fontSize}`);
    }
  }, [appSettings?.fontSize]);

  useEffect(() => {
    if (appSettings?.theme && appSettings.theme !== theme) { // theme と異なる場合に限定
      if (appSettings.theme === 'light' || appSettings.theme === 'dark') {
        setTheme(appSettings.theme);
      } else if (appSettings.theme === 'system') {
        setTheme('system');
      }
    }
  }, [appSettings?.theme, theme, setTheme]);

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

  const guideShortcut = (
    <Link href="/guide" className="flex flex-col items-center justify-center text-xs text-foreground/70 active:scale-95 transition-transform duration-75 ease-out ml-4" aria-label="使い方">
      <HelpCircle size={20} />
      <span>使い方</span>
    </Link>
  );

  const contentReady = isClient && appSettings;

  const messageLinkExtension = isHome && (
    <Link 
      href="/message" 
      className={cn(
        "fixed left-0 right-0 z-30",
        "flex items-center justify-center px-4", // Changed to justify-center
        "h-[44px]", // Height for tap area
        "bg-background/80 backdrop-blur-sm border-b border-border",
        "text-foreground hover:bg-accent hover:text-accent-foreground",
        "active:scale-[0.98] transition-transform duration-75 ease-out",
        "top-[calc(env(safe-area-inset-top)+56px)]"
      )}
      aria-label="ONEIDEAからのメッセージ"
    >
      <span className="flex items-center gap-2"> {/* New wrapper for centering text and icon together */}
        <span className="font-semibold text-sm">ONEIDEAからのメッセージ</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </span>
    </Link>
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true} // false から true に変更
      enableColorScheme // 追加
      disableTransitionOnChange
    >
      <div className="flex h-screen flex-col">
        <Header
          leftContent={isHome ? (
            <div className="flex items-center">
              {cameraShortcut}
              {guideShortcut}
            </div>
          ) : undefined}
          rightContent={
            isHome ? (
              <div className="flex items-center gap-3">
                {draftsShortcut}
                {calendarShortcut}
              </div>
            ) : undefined
          }
        />
        {messageLinkExtension} {/* Render new extension here */}
        <Toaster />
        <main className="flex-1 overflow-y-auto pt-[calc(env(safe-area-inset-top)+56px+44px+24px)] pb-[calc(env(safe-area-inset-bottom)+70px+24px)]"> {/* Adjusted pb */}
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