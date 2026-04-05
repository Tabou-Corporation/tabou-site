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
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Domaines images explicitement whitelistés (EVE CDN + hébergements utilisés)
              "img-src 'self' https://images.evetech.net https://i.imgur.com https://imgur.com https://*.githubusercontent.com https://*.discord.com https://cdn.discordapp.com data:",
              // unsafe-inline requis par Next.js (hydration) et Framer Motion (styles inline)
              // TODO : migrer vers nonces CSP (next.config + middleware) pour supprimer unsafe-inline
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self'",
              "connect-src 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
