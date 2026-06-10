import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Raise the server action body limit so photo uploads don't hit the
  // default 1 MB cap (Next.js E394 / Vercel crash).
  // Vercel's hard serverless payload ceiling is 4.5 MB; stay just under it.
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },

  // Allow next/image to serve photos from Supabase Storage
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
