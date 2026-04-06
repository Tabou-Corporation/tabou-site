import { MainNav } from "@/components/navigation/MainNav";
import { Footer } from "@/components/layout/Footer";
import { getDiscordConfig } from "@/lib/site-content/loader";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const discord = await getDiscordConfig();
  return (
    <>
      <MainNav discordUrl={discord.inviteUrl || undefined} />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <Footer />
    </>
  );
}
