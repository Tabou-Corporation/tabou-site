# Changements non publiés

Ce fichier est maintenu par Claude entre les sessions.
À chaque modification significative, une entrée est ajoutée ici.
Quand un changelog est demandé, ce fichier sert de source → puis est vidé.

Format : `type | description`
Types : `feature` · `improvement` · `fix` · `security`

---

<!-- Les entrées ci-dessous seront intégrées à la prochaine version du changelog -->

<!-- SESSION 2026-04-07 — intégrée en v2.6, fichier remis à zéro -->
<!-- SESSION 2026-04-07 (suite) — intégrée en v2.7, fichier remis à zéro -->
<!-- SESSION 2026-04-07 (troisième) — intégrée en v2.8, fichier remis à zéro -->

<!-- SESSION 2026-04-08 -->
security | Grace period 24h sur la suspension — le signIn et le cron sync ne suspendent plus un membre dont la candidature a été acceptée dans les dernières 24h (délai ESI)
fix | Nettoyage doublons utilisateurs — suppression des records orphelins (sans compte EVE) créés par race condition PrismaAdapter
fix | Ishar Tashad, piloto1944, Drypekaah : données corrigées en base (rôle, corporationId)
feature | Toast "warning" (ambre, 8s) dans le système de notifications
feature | UX délai ESI : le recruteur est informé quand la promotion est différée, le candidat voit des instructions claires pour rejoindre la corp et se reconnecter
improvement | Timeline candidature : étape "Intégration en jeu" active après acceptation avec instructions
improvement | Dashboard candidat : message explicatif sur le délai ESI remplace "rechargez la page"
