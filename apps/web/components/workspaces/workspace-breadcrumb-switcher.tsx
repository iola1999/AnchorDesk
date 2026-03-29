"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { buttonStyles, cn, menuItemStyles, ui } from "@/lib/ui";

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
        className={cn(
          buttonStyles({ variant: "ghost", size: "xs" }),
          "min-h-0 gap-1 px-2 py-1 text-app-muted",
        )}
      >
        <span>{workspace.title}</span>
        <span className={cn("text-[11px] transition", open && "rotate-180")}>▾</span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className={cn(ui.menu, "absolute left-0 top-[calc(100%+8px)] z-10 grid min-w-[220px] gap-1")}
        >
          {workspaces.map((workspaceItem) => (
            <Link
              key={workspaceItem.id}
              href={getWorkspaceHref(workspaceItem.id)}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={cn(
                "flex min-h-10 items-center rounded-xl px-3 text-sm transition hover:bg-app-surface-soft",
                menuItemStyles({ selected: workspaceItem.id === workspace.id }),
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
