import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasMinRole } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Separator } from "@/components/ui/Separator";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { NewListingForm } from "./NewListingForm";
import type { UserRole } from "@/types/roles";

export default async function NewListingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "member")) redirect("/membre");

  return (
    <div className="py-10 sm:py-14">
      <Container size="md">
        <div className="mb-6">
          <Link
            href="/membre/marche"
            className="inline-flex items-center gap-1.5 text-text-muted text-sm hover:text-text-secondary transition-colors"
          >
            <ArrowLeft size={14} />
            Retour au marche
          </Link>
        </div>

        <div className="mb-8">
          <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">
            Marche
          </p>
          <h1 className="font-display font-bold text-3xl text-text-primary">
            Nouvelle annonce
          </h1>
        </div>

        <Separator gold className="mb-8" />

        <NewListingForm />
      </Container>
    </div>
  );
}
