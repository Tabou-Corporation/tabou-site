"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { markAllNotificationsRead } from "@/lib/actions/notifications";
import { CheckCircle } from "lucide-react";

export function MarkAllReadButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  return (
    <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={handleClick}>
      <CheckCircle size={13} />
      Tout marquer comme lu
    </Button>
  );
}
