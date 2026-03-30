"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  CONVERSATION_STATUS,
  type ConversationStatus,
} from "@anchordesk/contracts";

import { ChevronDownIcon } from "@/components/icons";
import {
  breadcrumbSwitcherTriggerStyles,
  cn,
  menuItemStyles,
  ui,
} from "@/lib/ui";

type ConversationListItem = {
  id: string;
  title: string;
  status: ConversationStatus;
};

type ConversationBreadcrumbSwitcherProps = {
  workspaceId: string;
  currentConversation: {
    id: string;
    title: string;
  };
  conversations: ConversationListItem[];
};

export function ConversationBreadcrumbSwitcher({
  workspaceId,
  currentConversation,
  conversations,
}: ConversationBreadcrumbSwitcherProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const visibleConversations = useMemo(() => {
    const seen = new Set<string>();

    return conversations.filter((conversation) => {
      if (
        conversation.status !== CONVERSATION_STATUS.ACTIVE &&
        conversation.id !== currentConversation.id
      ) {
        return false;
      }

      if (seen.has(conversation.id)) {
        return false;
      }

      seen.add(conversation.id);
      return true;
    });
  }, [conversations, currentConversation.id]);

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

  return (
    <>
      <span
        key={`${currentConversation.id}-${currentConversation.title}`}
        title={currentConversation.title}
        className="animate-soft-fade hidden max-w-[28rem] min-w-0 truncate font-medium text-app-text min-[720px]:inline-block"
      >
        {currentConversation.title}
      </span>

      <div ref={containerRef} className="relative min-[720px]:hidden">
        <button
          type="button"
          aria-controls={menuId}
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((value) => !value)}
          className={breadcrumbSwitcherTriggerStyles({ open })}
        >
          <span
            title={currentConversation.title}
            className="max-w-[min(52vw,240px)] truncate font-medium text-app-text"
          >
            {currentConversation.title}
          </span>
          <ChevronDownIcon
            className={cn(
              "size-3.5 text-app-muted transition-transform duration-200 [transition-timing-function:var(--ease-out-quart)]",
              open && "rotate-180",
            )}
          />
        </button>

        {open ? (
          <div
            id={menuId}
            role="menu"
            className={cn(
              ui.menu,
              "animate-soft-enter absolute left-0 top-[calc(100%+8px)] z-10 grid w-[min(320px,calc(100vw-24px))] gap-1",
            )}
          >
            {visibleConversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/workspaces/${workspaceId}?conversationId=${conversation.id}`}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex min-h-10 items-center rounded-xl px-3 text-sm transition-[background-color,color] duration-200 [transition-timing-function:var(--ease-out-quart)]",
                  menuItemStyles({
                    selected: conversation.id === currentConversation.id,
                  }),
                )}
              >
                <span className="truncate">{conversation.title}</span>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}
