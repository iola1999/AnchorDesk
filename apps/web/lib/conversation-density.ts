export const conversationDensityClassNames = {
  sessionStack: "grid gap-5 pb-3 min-[720px]:gap-6 min-[720px]:pb-4 md:gap-7 md:pb-5",
  assistantSection: "grid gap-3 min-[720px]:gap-4",
  userWrap: "ml-auto w-full max-w-[860px]",
  userBubble:
    "rounded-[20px] border border-app-border/60 bg-app-surface-strong/54 px-4 py-3 shadow-[0_10px_24px_rgba(23,22,18,0.03)] min-[720px]:rounded-[22px] min-[720px]:px-5 min-[720px]:py-3.5",
  userText: "text-[14px] leading-7 text-app-text md:text-[15px]",
  resultPanel: "grid gap-3 min-[720px]:gap-4",
  resultHeader:
    "flex flex-wrap items-center justify-between gap-3 border-b border-app-border/60 pb-2",
  answerText: "max-w-none text-[14px] leading-7 text-app-text md:text-[15px]",
  sourcesList: "grid gap-2",
  sourceCard:
    "grid gap-1 rounded-2xl border border-app-border/55 bg-white/72 px-3.5 py-2.5 text-left transition hover:border-app-border-strong hover:bg-white",
  actionStatus: "text-[12px] leading-5 text-app-muted",
  timelineShell:
    "group rounded-2xl border border-app-border/60 bg-white/68 px-3.5 py-2.5 shadow-[0_6px_18px_rgba(23,22,18,0.03)]",
  timelineList: "mt-2 grid gap-2 border-t border-app-border/55 pt-2.5",
  timelineEntry: "grid gap-2 border-l-[1.5px] border-app-border/70 pl-3",
  timelineEntrySummary:
    "flex list-none items-start justify-between gap-2 rounded-lg text-left",
  timelineEntryDetails: "grid gap-1.5 border-t border-app-border/55 pt-2",
  timelineEntryMeta: "flex flex-wrap items-center gap-1.5 text-[11px] text-app-muted",
  payloadDisclosure:
    "group/payload rounded-xl border border-app-border/65 bg-white/78 px-3 py-2",
  payloadPre:
    "max-h-[220px] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-app-surface-soft px-3 py-2 text-[11px] leading-5 text-app-muted-strong",
  composerShell:
    "shrink-0 border-app-border/60 pb-3 pt-2 min-[720px]:pb-4 min-[720px]:pt-3",
  composerCard:
    "grid gap-2.5 rounded-[24px] border border-app-border/80 bg-white/94 px-4 py-3 shadow-[0_8px_20px_rgba(23,22,18,0.04)] md:px-5 md:py-4",
  composerText:
    "w-full resize-none bg-transparent px-0 py-0 text-[14px] leading-7 text-app-text outline-none placeholder:text-app-muted md:text-[15px]",
  composerAttachments: "flex flex-wrap items-center gap-1.5 px-0.5",
} as const;
