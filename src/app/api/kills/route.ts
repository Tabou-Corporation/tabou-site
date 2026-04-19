import { NextResponse } from "next/server";
import { fetchCorpKills, fetchMixedKills } from "@/lib/zkillboard/fetcher";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const corpParam = searchParams.get("corp");
  const kills = corpParam
    ? await fetchCorpKills(Number(corpParam))
    : await fetchMixedKills();
  return NextResponse.json(kills, {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" },
  });
}
