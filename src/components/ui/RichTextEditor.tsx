"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading2, Heading3, List, ListOrdered, Quote, Minus, Undo, Redo,
} from "lucide-react";

interface Props {
  /** Nom du champ hidden envoyé dans le FormData */
  name: string;
  /** Contenu HTML initial */
  defaultValue?: string;
  placeholder?: string;
  minHeight?: number;
  /** Appelé à chaque changement (optionnel — pour éditeurs contrôlés) */
  onChange?: (html: string) => void;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "p-1.5 rounded text-xs transition-colors",
        active
          ? "bg-gold/20 text-gold"
          : "text-text-muted hover:text-text-secondary hover:bg-bg-elevated",
        disabled && "opacity-30 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({ name, defaultValue = "", placeholder, minHeight = 180, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        // Désactiver code block (on garde juste inline code)
        codeBlock: false,
      }),
      Underline,
    ],
    content: defaultValue || `<p></p>`,
    editorProps: {
      attributes: {
        class: "rich-editor-content",
        "data-placeholder": placeholder ?? "",
      },
    },
    onUpdate({ editor }) {
      onChange?.(editor.getHTML());
    },
    immediatelyRender: false,
  });

  // Sync si defaultValue change (ex: après refresh parent)
  useEffect(() => {
    if (editor && defaultValue !== undefined) {
      const current = editor.getHTML();
      if (current !== defaultValue && defaultValue !== "") {
        editor.commands.setContent(defaultValue, { emitUpdate: false });
      }
    }
  }, [defaultValue, editor]);

  const isEmpty = !editor || editor.isEmpty;
  const html = editor?.getHTML() ?? "";

  if (!editor) return null;

  return (
    <div className="rich-editor-wrapper border border-border rounded overflow-hidden focus-within:border-gold/60 focus-within:ring-1 focus-within:ring-gold/40 transition-colors">
      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-0.5 px-2 py-1.5 bg-bg-elevated border-b border-border">
        {/* Titre */}
        <ToolbarButton
          title="Titre H2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
        >
          <Heading2 size={14} />
        </ToolbarButton>
        <ToolbarButton
          title="Titre H3"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
        >
          <Heading3 size={14} />
        </ToolbarButton>

        <span className="w-px h-4 bg-border mx-1" />

        {/* Formatage inline */}
        <ToolbarButton
          title="Gras (Ctrl+B)"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
        >
          <Bold size={14} />
        </ToolbarButton>
        <ToolbarButton
          title="Italique (Ctrl+I)"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
        >
          <Italic size={14} />
        </ToolbarButton>
        <ToolbarButton
          title="Souligné (Ctrl+U)"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
        >
          <UnderlineIcon size={14} />
        </ToolbarButton>
        <ToolbarButton
          title="Barré"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
        >
          <Strikethrough size={14} />
        </ToolbarButton>

        <span className="w-px h-4 bg-border mx-1" />

        {/* Listes */}
        <ToolbarButton
          title="Liste à puces"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
        >
          <List size={14} />
        </ToolbarButton>
        <ToolbarButton
          title="Liste numérotée"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        >
          <ListOrdered size={14} />
        </ToolbarButton>

        <span className="w-px h-4 bg-border mx-1" />

        {/* Bloc */}
        <ToolbarButton
          title="Citation"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
        >
          <Quote size={14} />
        </ToolbarButton>
        <ToolbarButton
          title="Séparateur horizontal"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus size={14} />
        </ToolbarButton>

        <span className="w-px h-4 bg-border mx-1" />

        {/* Historique */}
        <ToolbarButton
          title="Annuler (Ctrl+Z)"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo size={14} />
        </ToolbarButton>
        <ToolbarButton
          title="Rétablir (Ctrl+Y)"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo size={14} />
        </ToolbarButton>
      </div>

      {/* Zone d'édition */}
      <div className="relative bg-bg-deep">
        {isEmpty && placeholder && (
          <p className="absolute top-3 left-4 text-text-muted text-sm pointer-events-none select-none z-10">
            {placeholder}
          </p>
        )}
        <EditorContent
          editor={editor}
          style={{ minHeight }}
          className="px-4 py-3 text-sm text-text-primary outline-none"
        />
      </div>

      {/* Champ caché pour la soumission du formulaire */}
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
