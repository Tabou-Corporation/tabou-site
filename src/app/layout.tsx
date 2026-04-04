import type { Metadata, Viewport } from "next";
import { Rajdhani, Barlow } from "next/font/google";
import "./globals.css";
import { SITE_CONFIG } from "@/config/site";
import { auth } from "@/auth";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ToastProvider } from "@/contexts/ToastContext";

// ─── Polices ───────────────────────────────────────────────────────────────
const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rajdhani",
  display: "swap",
});

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-barlow",
  display: "swap",
});

// ─── Métadonnées globales ──────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    template: `%s — ${SITE_CONFIG.name}`,
    default: SITE_CONFIG.fullName,
  },
  description: SITE_CONFIG.description,
  keywords: [
    "Tabou",
    "EVE Online",
    "corporation",
    "nul-sec",
    "PvP",
    "recrutement",
    "EU TZ",
  ],
  authors: [{ name: "Corporation Tabou" }],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: SITE_CONFIG.fullName,
    title: SITE_CONFIG.fullName,
    description: SITE_CONFIG.description,
    images: [
      {
        url: "https://images.evetech.net/corporations/98809880/logo?size=256",
        width: 256,
        height: 256,
        alt: "Logo Corporation Tabou",
      },
    ],
  },
  twitter: {
    card: "summary",
    images: ["https://images.evetech.net/corporations/98809880/logo?size=256"],
  },
};

export const viewport: Viewport = {
  themeColor: "#050403",
  colorScheme: "dark",
};

// ─── Layout root ──────────────────────────────────────────────────────────
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Pré-résoudre la session serveur → injectée dans SessionProvider
  // pour que useSession() soit immédiatement disponible côté client
  // sans aller-retour /api/auth/session.
  const session = await auth();

  return (
    <html
      lang="fr"
      className={`${rajdhani.variable} ${barlow.variable}`}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen antialiased">
        <AuthProvider session={session}>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
