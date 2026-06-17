import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  output: 'export',
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Allow Android WebView and LAN devices to access Next.js dev server
  // resources without cross-origin blocking (fixes black screen in WebView)
  allowedDevOrigins: [
    '10.255.234.33',
    '*.local',
    'localhost',
  ],
};

export default nextConfig;
