import { cn } from "@/lib/utils/cn";

interface Props {
  html: string;
  className?: string;
}

/**
 * Affiche du contenu HTML stocké depuis le RichTextEditor (Tiptap).
 * Utilise dangerouslySetInnerHTML — le contenu est produit exclusivement
 * par l'éditeur Tiptap côté staff, jamais par un visiteur anonyme.
 */
export function RichTextContent({ html, className }: Props) {
  if (!html || html === "<p></p>") {
    return null;
  }

  return (
    <div
      className={cn("prose-eve", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
