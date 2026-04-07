import { MainNav } from "@/components/navigation/MainNav";
import { Footer } from "@/components/layout/Footer";
import { getDiscordConfig, getSettingsContent } from "@/lib/site-content/loader";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [discord, settings] = await Promise.all([getDiscordConfig(), getSettingsContent()]);
  return (
    <>
      <MainNav discordUrl={discord.inviteUrl || undefined} showPilotes={settings.pilotesNavVisible} />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <Footer />
    </>
  );
}
