import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Images: préparer pour EVE CDN et assets externes (V6)
  images: {
    remotePatterns: [
      // EVE Online image server — logos, portraits
      { protocol: "https", hostname: "images.evetech.net" },
      // Hébergements d'images courants pour le hero CMS
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "imgur.com" },
      { protocol: "https", hostname: "**.githubusercontent.com" },
      { protocol: "https", hostname: "**.discord.com" },
      { protocol: "https", hostname: "cdn.discordapp.com" },
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
