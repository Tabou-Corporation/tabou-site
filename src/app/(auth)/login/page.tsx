import type { Metadata } from "next";
import Link from "next/link";
import { signIn } from "@/auth";
import { SITE_CONFIG } from "@/config/site";

export const metadata: Metadata = {
  title: "Connexion — Tabou",
  description: "Connectez-vous à l'espace membre Tabou avec votre compte EVE Online.",
  robots: { index: false, follow: false },
};

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/membre";
  const error = params.error;

  return (
    <div className="w-full max-w-md animate-fade-in">
      {/* Logo */}
      <div className="text-center mb-10">
        <Link href="/" className="inline-block group">
          <span className="font-display font-bold text-2xl text-text-primary tracking-widest group-hover:text-gold transition-colors">
            TABOU
          </span>
          <span className="ml-2 text-xs text-text-muted font-mono tracking-widest">
            [{SITE_CONFIG.branding.ticker}]
          </span>
        </Link>
      </div>

      {/* Panneau */}
      <div className="bg-bg-surface border border-border rounded-md shadow-panel-lg p-8 space-y-7">
        <div className="space-y-1.5">
          <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase">
            Espace membre
          </p>
          <h1 className="font-display font-bold text-2xl text-text-primary">
            Connexion
          </h1>
          <p className="text-text-secondary text-sm leading-relaxed">
            Connectez-vous avec votre compte EVE Online pour accéder à l&apos;espace membre Tabou.
          </p>
        </div>

        {/* Erreur SSO */}
        {error && (
          <div className="bg-red/10 border border-red/30 rounded px-4 py-3">
            <p className="text-red-light text-sm">
              {error === "suspended"
                ? "Votre accès a été suspendu suite à un départ de la corporation. Contactez un directeur si c'est une erreur."
                : error === "OAuthCallbackError"
                ? "Erreur de connexion EVE SSO. Réessayez."
                : "Une erreur est survenue. Réessayez."}
            </p>
          </div>
        )}

        {/* Bouton EVE SSO */}
        <form
          action={async () => {
            "use server";
            await signIn("eveonline", { redirectTo: callbackUrl });
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded bg-[#111] border border-[#2A2A2A] text-text-primary text-sm font-medium hover:bg-[#1A1A1A] hover:border-[#444] transition-all duration-[180ms] active:scale-[0.98]"
          >
            {/* EVE Online iconographie — sobre */}
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 fill-text-primary"
              aria-hidden
            >
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 1.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zm0 2a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zm-1 3h2v4.586l2.707 2.707-1.414 1.414L11 13.414V8.5z" />
            </svg>
            Se connecter avec EVE Online
          </button>
        </form>

        {/* Séparateur */}
        <div className="h-px bg-border" />

        {/* Liens utiles */}
        <div className="space-y-2 text-center">
          <p className="text-text-muted text-xs">
            Vous n&apos;êtes pas encore membre de Tabou ?
          </p>
          <Link
            href="/recrutement"
            className="text-gold text-xs hover:text-gold-light transition-colors"
          >
            Voir le recrutement →
          </Link>
        </div>
      </div>

      {/* Note sécurité */}
      <p className="text-text-muted text-xs text-center mt-6 leading-relaxed">
        La connexion utilise le système officiel EVE Online SSO.
        Tabou ne reçoit jamais votre mot de passe EVE.
      </p>
    </div>
  );
}
