import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Images: préparer pour EVE CDN et assets externes (V6)
  images: {
    remotePatterns: [
      // EVE Online image server — portraits de personnages (V2+)
      { protocol: "https", hostname: "images.evetech.net" },
      // { protocol: "https", hostname: "imageserver.eveonline.com" }, // V6
    ],
  },

  // Headers de sécurité minimaux
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
