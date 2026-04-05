"use client";

import { Trash2 } from "lucide-react";
import { deleteAnnouncement, deleteGuide, deleteCalendarEvent, deleteAssembly } from "@/lib/actions/content";
import { useRouter } from "next/navigation";

interface Props {
  id: string;
  type: "announcement" | "guide" | "event" | "assembly";
  title: string;
}

const deleteFns = {
  announcement: deleteAnnouncement,
  guide: deleteGuide,
  event: deleteCalendarEvent,
  assembly: deleteAssembly,
} as const;

export function DeleteContentButton({ id, type, title }: Props) {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        if (!window.confirm(`Supprimer "${title}" ?`)) return;
        await deleteFns[type](id);
        router.refresh();
      }}
      className="p-1.5 text-text-muted hover:text-red-400 transition-colors"
      title="Supprimer"
    >
      <Trash2 size={14} />
    </button>
  );
}
