import withPWA from "@ducanh2912/next-pwa";

const pwaConfig = withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
  appleWebApp: { // PWAとしてiOSホーム画面に追加可能にする
    capable: true,
  },
});

const nextConfig = {
  reactStrictMode: true,
};

export default pwaConfig(nextConfig);
