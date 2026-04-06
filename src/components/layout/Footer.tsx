import Link from "next/link";
import { Container } from "./Container";
import { Separator } from "@/components/ui/Separator";
import { NAVIGATION } from "@/config/navigation";
import { SITE_CONFIG } from "@/config/site";
import { getDiscordConfig } from "@/lib/site-content/loader";

export async function Footer() {
  const currentYear = new Date().getFullYear();
  const discord = await getDiscordConfig();

  return (
    <footer className="bg-bg-deep border-t border-border mt-auto">
      <Container>
        <div className="py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Identité */}
          <div className="md:col-span-1 space-y-4">
            <div>
              <span className="font-display font-bold text-xl text-text-primary tracking-wide">
                TABOU
              </span>
              <span className="ml-2 text-xs text-text-muted font-mono tracking-widest">
                [{SITE_CONFIG.branding.ticker}]
              </span>
            </div>
            <p className="text-text-muted text-sm leading-relaxed">
              {SITE_CONFIG.tagline}
            </p>
            <p className="text-text-muted text-xs leading-relaxed">
              EVE Online · Nul-sec · EU TZ
            </p>
          </div>

          {/* Groupes de navigation */}
          {NAVIGATION.footer
            .filter((group) => group.items.length > 0)
            .map((group) => (
              <div key={group.id} className="space-y-4">
                {group.label && (
                  <h3 className="text-text-muted text-xs font-semibold tracking-widest uppercase">
                    {group.label}
                  </h3>
                )}
                <ul className="space-y-2.5">
                  {group.items.map((item) => {
                    const href = item.external && item.label === "Discord"
                      ? (discord.inviteUrl || item.href)
                      : item.href;
                    return (
                      <li key={item.href}>
                        {item.external ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-text-secondary text-sm hover:text-gold transition-colors"
                          >
                            {item.label}
                          </a>
                        ) : (
                          <Link
                            href={href}
                            className="text-text-secondary text-sm hover:text-gold transition-colors"
                          >
                            {item.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
        </div>

        <Separator />

        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-text-muted text-xs">
            © {currentYear} Corporation Tabou — EVE Online
          </p>
          <p className="text-text-muted text-xs text-center sm:text-right max-w-xs">
            EVE Online et tous les assets associés sont la propriété de CCP Games.
            Ce site est un projet communautaire non officiel.
          </p>
        </div>
      </Container>
    </footer>
  );
}
