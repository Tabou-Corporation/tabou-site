import Image from "next/image";
import Link from "next/link";
import { Trophy, ArrowRight } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { getHallOfFame } from "@/lib/map/zkill/stats";

/**
 * Widget Hall of Fame pour la home membre — server component.
 * Affiche le pilote #1 all-time + stats agrégées Tabou + Urban Zone.
 *
 * Données : zKill stats endpoint (cache 6h), 2 appels max, ultra-light.
 */

const TABOU = 98809880;
const URBAN_ZONE = 98215397;

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

export async function HallOfFameHomeCard() {
  let data;
  try {
    data = await getHallOfFame([TABOU, URBAN_ZONE], 3);
  } catch {
    return null;
  }
  const top = data.entries[0];
  if (!top) return null;

  const totalKills = data.totals.reduce((acc, t) => acc + t.shipsDestroyed, 0);

  return (
    <Link href="/hall-of-fame">
      <Card interactive className="border-gold/30 overflow-hidden">
        <CardBody className="py-3 px-4">
          <div className="flex items-center gap-3">
            {/* Portrait #1 avec couronne */}
            <div className="relative flex-shrink-0">
              <Image
                src={`https://images.evetech.net/characters/${top.characterId}/portrait?size=64`}
                alt={top.characterName ?? "Pilote"}
                width={48}
                height={48}
                className="rounded-full border-2 border-gold/60 shadow-[0_0_16px_rgba(230,194,101,0.3)]"
                unoptimized
              />
              <div className="absolute -top-1 -right-1 bg-gold text-bg-deep rounded-full p-0.5">
                <Trophy size={10} />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-gold text-[9px] font-bold tracking-extra-wide uppercase">
                ★ Hall of Fame · all-time
              </p>
              <p className="text-text-primary text-sm font-display font-semibold truncate">
                {top.characterName ?? `Pilote ${top.characterId}`}
              </p>
              <p className="text-[11px] mt-0.5">
                <span className="text-emerald-400 font-mono font-semibold">
                  {formatNumber(top.kills)}
                </span>
                <span className="text-text-muted"> kills</span>
                <span className="text-text-muted mx-1">·</span>
                <span className="text-text-secondary">
                  {formatNumber(totalKills)} alliance
                </span>
              </p>
            </div>

            <ArrowRight size={14} className="text-gold/60 flex-shrink-0" />
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
