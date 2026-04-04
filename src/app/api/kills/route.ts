import { NextResponse } from "next/server";
import { fetchCorpKills } from "@/lib/zkillboard/fetcher";

export async function GET() {
  const kills = await fetchCorpKills();
  return NextResponse.json(kills, {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" },
  });
}
