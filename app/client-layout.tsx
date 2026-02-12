"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { ThemeProvider, useTheme } from "next-themes"; // useTheme をインポート
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/features/toaster";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Header } from "@/components/layout/header";
import { Camera, CalendarDays } from "lucide-react";
import Link from "next/link";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings, loadSettings, setDbError, setTempCapturedImage } = useAppStore();
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === '/home';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // useTheme フックから setTheme を取得
  const { setTheme } = useTheme(); 

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

  // settings.theme が変更されたときに next-themes の setTheme を呼び出す
  useEffect(() => {
    if (settings?.theme) {
      // settings.theme が 'system' の場合は ThemeProvider の enableSystem が処理してくれるため、
      // 'light' または 'dark' の場合のみ明示的に setTheme を呼び出す
      if (settings.theme === 'light' || settings.theme === 'dark') {
        setTheme(settings.theme);
      } else if (settings.theme === 'system') {
        // システムテーマの場合は、'system' に設定し直すことで next-themes に自動判定させる
        setTheme('system');
      }
    }
  }, [settings?.theme, setTheme]); // setTheme を依存配列に追加


  // Function to trigger hidden file input
  const handleCaptureClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Function to handle image file change
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
    // Reset file input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [setTempCapturedImage, router]);

  // Camera shortcut for Home page
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

  // Calendar shortcut for Home page
  const calendarShortcut = (
    <Link href="/calendar" className="flex flex-col items-center justify-center text-xs text-foreground/70 active:scale-95 transition-transform duration-75 ease-out">
      <CalendarDays size={20} />
      <span>カレンダー</span>
    </Link>
  );

  const contentReady = isClient && settings;

  return (
    <ThemeProvider
      attribute="class"

      enableSystem
      disableTransitionOnChange
    >
      <div className="flex h-screen flex-col">
        {/* ヘッダーは常に表示 */}
        <Header
          leftContent={isHome ? cameraShortcut : undefined}
          rightContent={isHome ? calendarShortcut : undefined}
        />
        <Toaster />
        <main className="flex-1 overflow-y-auto pt-[calc(env(safe-area-inset-top)+56px+12px)] pb-[calc(env(safe-area-inset-bottom)+70px)]">
          <div className="container mx-auto max-w-md px-4">
            {/* コンテンツが準備できていない場合はローディング表示 */}
            {!contentReady ? (
              <div className="flex justify-center items-center h-full">
                {/* ここにローディングスピナーやプレースホルダーを入れる */}
                <p>読み込み中...</p>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
        {/* BottomTabBarもcontentReadyに依存する */}
        {contentReady && <BottomTabBar />}
      </div>
    </ThemeProvider>
  );
}