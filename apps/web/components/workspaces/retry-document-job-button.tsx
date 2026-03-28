"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function RetryDocumentJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleRetry() {
    setError(null);

    const response = await fetch(`/api/document-jobs/${jobId}/retry`, {
      method: "POST",
    });
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (!response.ok) {
      setError(body?.error ?? "重试任务失败");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="stack">
      <button
        className="button-secondary"
        disabled={isPending}
        onClick={handleRetry}
        type="button"
      >
        {isPending ? "提交中..." : "重试任务"}
      </button>
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
