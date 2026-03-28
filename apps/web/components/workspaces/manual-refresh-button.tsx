"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function ManualRefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className="button-secondary"
      disabled={isPending}
      onClick={() =>
        startTransition(() => {
          router.refresh();
        })
      }
      type="button"
    >
      {isPending ? "刷新中..." : "手动刷新"}
    </button>
  );
}
