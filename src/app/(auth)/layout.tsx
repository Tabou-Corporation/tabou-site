import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-bg-deep">
      {/* Grille décorative */}
      <div
        aria-hidden
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(240,176,48,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(240,176,48,0.8) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <main className="flex-1 flex items-center justify-center px-4 py-16 relative">
        {children}
      </main>
      <footer className="py-4 text-center border-t border-border relative">
        <Link
          href="/"
          className="text-text-muted text-xs hover:text-text-secondary transition-colors"
        >
          ← Retour au site public
        </Link>
      </footer>
    </div>
  );
}
