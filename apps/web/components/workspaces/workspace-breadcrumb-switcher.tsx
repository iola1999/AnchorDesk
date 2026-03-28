"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/ui";

type WorkspaceListItem = {
  id: string;
  title: string;
};

type WorkspaceBreadcrumbSwitcherProps = {
  workspace: WorkspaceListItem;
  workspaces: WorkspaceListItem[];
  activeView?: "chat" | "settings" | "knowledge-base";
};

export function WorkspaceBreadcrumbSwitcher({
  workspace,
  workspaces,
  activeView = "chat",
}: WorkspaceBreadcrumbSwitcherProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const getWorkspaceHref = (workspaceId: string) =>
    activeView === "settings"
      ? `/workspaces/${workspaceId}/settings`
      : activeView === "knowledge-base"
        ? `/workspaces/${workspaceId}/knowledge-base`
      : `/workspaces/${workspaceId}`;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-app-muted transition hover:bg-white/85 hover:text-app-text focus:outline-none focus:ring-4 focus:ring-app-accent/10"
      >
        <span>{workspace.title}</span>
        <span className={cn("text-[11px] transition", open && "rotate-180")}>▾</span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute left-0 top-[calc(100%+8px)] z-10 grid min-w-[220px] gap-1 rounded-2xl border border-app-border bg-white/95 p-2 shadow-card"
        >
          {workspaces.map((workspaceItem) => (
            <Link
              key={workspaceItem.id}
              href={getWorkspaceHref(workspaceItem.id)}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={cn(
                "flex min-h-10 items-center rounded-xl px-3 text-sm transition hover:bg-app-surface-soft",
                workspaceItem.id === workspace.id &&
                  "bg-app-surface-soft font-medium text-app-text",
              )}
            >
              {workspaceItem.title}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
