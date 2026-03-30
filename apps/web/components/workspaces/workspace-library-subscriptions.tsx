"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  WORKSPACE_LIBRARY_SUBSCRIPTION_STATUS,
  type KnowledgeLibraryStatus,
  type WorkspaceLibrarySubscriptionStatus,
} from "@anchordesk/contracts";

import {
  formatKnowledgeLibraryStatus,
  formatWorkspaceLibrarySubscriptionStatus,
} from "@/lib/api/knowledge-libraries";
import { buttonStyles, cn, ui } from "@/lib/ui";

type WorkspaceLibraryCatalogItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: KnowledgeLibraryStatus;
  documentCount: number;
  subscriptionStatus: WorkspaceLibrarySubscriptionStatus | null;
  searchEnabled: boolean;
  updatedAt: string;
};

export function WorkspaceLibrarySubscriptions({
  workspaceId,
  libraries,
}: {
  workspaceId: string;
  libraries: WorkspaceLibraryCatalogItem[];
}) {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [pendingLibraryId, setPendingLibraryId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function mutateSubscription(input: {
    libraryId: string;
    status: WorkspaceLibrarySubscriptionStatus;
    searchEnabled?: boolean;
  }) {
    setStatusMessage(null);
    setPendingLibraryId(input.libraryId);

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/library-subscriptions`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(input),
      });
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setStatusMessage(body?.error ?? "订阅更新失败");
        return;
      }

      setStatusMessage("订阅已更新");
      startTransition(() => {
        router.refresh();
      });
    } finally {
      setPendingLibraryId(null);
    }
  }

  return (
    <section className={ui.sectionPanel}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-0.5">
          <h2 className="text-[1.1rem] font-semibold text-app-text">全局资料库订阅</h2>
          <p className="text-[13px] leading-6 text-app-muted-strong">
            工作空间可直接挂载管理员维护的资料库，并在对话检索中一起召回
          </p>
        </div>
        <span className="rounded-full border border-app-border bg-app-surface-soft px-2.5 py-0.5 text-[12px] text-app-muted">
          {libraries.length} 个可见资料库
        </span>
      </div>

      <div className="mt-4 grid gap-3">
        {libraries.length > 0 ? (
          libraries.map((library) => {
            const isMutating = pendingLibraryId === library.id;
            const canSubscribe = library.status === "active";

            return (
              <div
                key={library.id}
                className="grid gap-3 rounded-[22px] border border-app-border bg-white/86 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="grid gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-[14px] text-app-text">{library.title}</strong>
                      <span className="rounded-full border border-app-border bg-app-surface-soft px-2.5 py-0.5 text-[11px] text-app-muted-strong">
                        {formatKnowledgeLibraryStatus(library.status)}
                      </span>
                      <span className="rounded-full border border-app-border bg-white px-2.5 py-0.5 text-[11px] text-app-muted">
                        {formatWorkspaceLibrarySubscriptionStatus(library.subscriptionStatus)}
                      </span>
                    </div>
                    {library.description ? (
                      <p className="text-[13px] leading-6 text-app-muted-strong">
                        {library.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="grid gap-1 text-right text-[12px] text-app-muted">
                    <span>{library.documentCount} 份资料</span>
                    <span>
                      更新于{" "}
                      {new Date(library.updatedAt).toLocaleString("zh-CN", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {library.subscriptionStatus === WORKSPACE_LIBRARY_SUBSCRIPTION_STATUS.ACTIVE ? (
                    <>
                      <button
                        type="button"
                        className={buttonStyles({ variant: "secondary", size: "sm" })}
                        disabled={isMutating}
                        onClick={() =>
                          void mutateSubscription({
                            libraryId: library.id,
                            status: WORKSPACE_LIBRARY_SUBSCRIPTION_STATUS.PAUSED,
                            searchEnabled: false,
                          })
                        }
                      >
                        {isMutating ? "处理中..." : "暂停检索"}
                      </button>
                      <button
                        type="button"
                        className={buttonStyles({ variant: "ghost", size: "sm" })}
                        disabled={isMutating}
                        onClick={() =>
                          void mutateSubscription({
                            libraryId: library.id,
                            status: WORKSPACE_LIBRARY_SUBSCRIPTION_STATUS.REVOKED,
                            searchEnabled: false,
                          })
                        }
                      >
                        移除挂载
                      </button>
                    </>
                  ) : library.subscriptionStatus === WORKSPACE_LIBRARY_SUBSCRIPTION_STATUS.PAUSED ? (
                    <>
                      <button
                        type="button"
                        className={buttonStyles({ size: "sm" })}
                        disabled={isMutating || !canSubscribe}
                        onClick={() =>
                          void mutateSubscription({
                            libraryId: library.id,
                            status: WORKSPACE_LIBRARY_SUBSCRIPTION_STATUS.ACTIVE,
                            searchEnabled: true,
                          })
                        }
                      >
                        {isMutating ? "处理中..." : "恢复订阅"}
                      </button>
                      <button
                        type="button"
                        className={buttonStyles({ variant: "ghost", size: "sm" })}
                        disabled={isMutating}
                        onClick={() =>
                          void mutateSubscription({
                            libraryId: library.id,
                            status: WORKSPACE_LIBRARY_SUBSCRIPTION_STATUS.REVOKED,
                            searchEnabled: false,
                          })
                        }
                      >
                        移除挂载
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className={buttonStyles({ size: "sm" })}
                      disabled={isMutating || !canSubscribe}
                      onClick={() =>
                        void mutateSubscription({
                          libraryId: library.id,
                          status: WORKSPACE_LIBRARY_SUBSCRIPTION_STATUS.ACTIVE,
                          searchEnabled: true,
                        })
                      }
                    >
                      {isMutating ? "处理中..." : canSubscribe ? "订阅并参与检索" : "当前不可订阅"}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className={cn(ui.subpanel, "text-[13px] text-app-muted-strong")}>
            当前没有可订阅的全局资料库
          </div>
        )}
      </div>

      {statusMessage ? (
        <p className={cn(ui.muted, isPending && "animate-pulse")}>{statusMessage}</p>
      ) : null}
    </section>
  );
}
