import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center px-4">
      {/* Grille décorative */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(240,176,48,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(240,176,48,0.8) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <div className="relative text-center space-y-6 max-w-md">
        <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase">
          Erreur 404
        </p>
        <h1 className="font-display font-bold text-5xl text-text-primary">
          Système inconnu.
        </h1>
        <p className="text-text-secondary leading-relaxed">
          Cette page n&apos;existe pas ou a été déplacée. Vous êtes peut-être sorti de la zone sécurisée.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Button as="a" href="/" variant="primary">
            Retour à l&apos;accueil
          </Button>
          <Button as="a" href="/corporation" variant="ghost">
            La Corporation
          </Button>
        </div>
      </div>
    </div>
  );
}
