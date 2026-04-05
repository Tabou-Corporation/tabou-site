"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import { Badge } from "@/components/ui/Badge";
import { ROLE_LABELS, ROLE_BADGE, ROLE_ORDER } from "@/lib/constants/labels";
import { cn } from "@/lib/utils/cn";

interface SerializedUser {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
  createdAt: string; // ISO string
}

type SortKey = "name" | "role" | "date";
type SortDir = "asc" | "desc";

const inputClass = [
  "w-full bg-bg-elevated border rounded px-3 py-2.5 pl-10",
  "text-text-primary text-sm placeholder:text-text-muted",
  "border-border focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40",
  "transition-colors duration-150",
].join(" ");

function SortIcon({ column, activeKey, activeDir }: { column: SortKey; activeKey: SortKey; activeDir: SortDir }) {
  if (column !== activeKey) {
    return <ArrowUpDown size={12} className="text-text-muted/40" />;
  }
  return activeDir === "asc"
    ? <ChevronUp size={12} className="text-gold" />
    : <ChevronDown size={12} className="text-gold" />;
}

export function MembersTable({ users }: { users: SerializedUser[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("role");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = q
      ? users.filter((u) => (u.name ?? "").toLowerCase().includes(q))
      : users;

    list = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = (a.name ?? "").localeCompare(b.name ?? "", "fr");
          break;
        case "role":
          cmp = (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9);
          break;
        case "date":
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return list;
  }, [users, search, sortKey, sortDir]);

  const thClass =
    "px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-extra-wide text-text-muted cursor-pointer select-none hover:text-text-secondary transition-colors";

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          type="text"
          placeholder="Rechercher un membre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={inputClass}
        />
        {search && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-xs">
            {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="border border-border/60 rounded-lg overflow-hidden bg-bg-surface/30">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/60 bg-bg-elevated/30">
              <th className="w-12 px-4 py-3" />
              <th className={thClass} onClick={() => toggleSort("name")}>
                <span className="inline-flex items-center gap-1.5">
                  Nom
                  <SortIcon column="name" activeKey={sortKey} activeDir={sortDir} />
                </span>
              </th>
              <th className={cn(thClass, "hidden sm:table-cell")} onClick={() => toggleSort("role")}>
                <span className="inline-flex items-center gap-1.5">
                  Rôle
                  <SortIcon column="role" activeKey={sortKey} activeDir={sortDir} />
                </span>
              </th>
              <th className={cn(thClass, "hidden md:table-cell")} onClick={() => toggleSort("date")}>
                <span className="inline-flex items-center gap-1.5">
                  Membre depuis
                  <SortIcon column="date" activeKey={sortKey} activeDir={sortDir} />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-text-muted text-sm">
                  Aucun membre trouvé.
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="border-b border-border/30 last:border-b-0 group">
                  <td className="px-4 py-2.5">
                    <Link href={`/staff/membres/${u.id}`} className="block">
                      <AvatarDisplay image={u.image} name={u.name} size={32} />
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/staff/membres/${u.id}`}
                      className="block group-hover:text-gold transition-colors"
                    >
                      <span className="text-text-primary font-display font-semibold text-sm">
                        {u.name ?? "Pilote inconnu"}
                      </span>
                      <span className="sm:hidden block mt-0.5">
                        <Badge variant={ROLE_BADGE[u.role] ?? "muted"} className="text-2xs">
                          {ROLE_LABELS[u.role] ?? u.role}
                        </Badge>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell">
                    <Link href={`/staff/membres/${u.id}`} className="block">
                      <Badge variant={ROLE_BADGE[u.role] ?? "muted"}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </Badge>
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-text-muted text-xs hidden md:table-cell">
                    <Link href={`/staff/membres/${u.id}`} className="block group-hover:text-text-secondary transition-colors">
                      {new Date(u.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
