import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
// import { ThemeProvider } from "next-themes"; // ThemeProviderを削除
import ClientLayout from "./client-layout";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const APP_DEFAULT_TITLE = 'ONEIDEA';
const APP_DESCRIPTION = 'One day, one idea. 日々の気づきを資産に変える思考ツール。';

export const metadata: Metadata = {
  applicationName: APP_DEFAULT_TITLE,
  title: APP_DEFAULT_TITLE,
  description: APP_DESCRIPTION,
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icons/favicon.ico",
    shortcut: "/icons/favicon.ico",

  },
  manifest: "/manifest.json",
};

const appViewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const viewport = appViewport;


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
        {/* ThemeProviderをClientLayoutに移動 */}
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}