import DOMPurify from "isomorphic-dompurify";
import { cn } from "@/lib/utils/cn";

interface Props {
  html: string;
  className?: string;
}

/**
 * Whitelist stricte des balises et attributs autorises.
 * Bloque les event handlers (onclick, onerror…), les iframes, scripts, etc.
 */
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    "p", "br", "strong", "em", "u", "s", "del",
    "h1", "h2", "h3", "h4",
    "ul", "ol", "li",
    "blockquote", "pre", "code",
    "a", "img",
    "table", "thead", "tbody", "tr", "th", "td",
    "hr", "span", "div", "sub", "sup",
  ],
  ALLOWED_ATTR: [
    "href", "target", "rel", "src", "alt", "width", "height",
    "class", "id", "colspan", "rowspan",
  ],
  ALLOW_DATA_ATTR: false,
};

/**
 * Affiche du contenu HTML stocke depuis le RichTextEditor (Tiptap).
 * Le HTML est sanitise via DOMPurify avant rendu pour empecher toute injection XSS.
 */
export function RichTextContent({ html, className }: Props) {
  if (!html || html === "<p></p>") {
    return null;
  }

  const clean = DOMPurify.sanitize(html, PURIFY_CONFIG);

  return (
    <div
      className={cn("prose-eve", className)}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
