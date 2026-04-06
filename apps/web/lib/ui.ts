export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const textSelectionStyles = {
  chrome: "select-none",
  content: "select-text",
} as const;

type FieldSize = "md" | "compact";
type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "dangerGhost";
type ButtonSize = "md" | "sm" | "xs";
type ButtonShape = "rounded" | "pill" | "icon";
type MenuTone = "default" | "danger";
type WorkspaceTileVariant = "default" | "create";
type ConversationControlSize = "default" | "compact";

export function inputStyles({ size = "md" }: { size?: FieldSize } = {}) {
  return cn(
    textSelectionStyles.content,
    "w-full border border-app-border bg-app-surface-soft text-app-text outline-none transition placeholder:text-app-muted focus:border-app-border-strong focus:ring-app-accent/10",
    size === "compact"
      ? "h-9 rounded-[16px] px-3 text-[13px] focus:ring-[3px]"
      : "h-11 rounded-[20px] px-3.5 text-[14px] focus:ring-[3px]",
  );
}

export function textareaStyles({ size = "md" }: { size?: FieldSize } = {}) {
  return cn(
    textSelectionStyles.content,
    "w-full border border-app-border bg-app-surface-soft text-app-text outline-none transition placeholder:text-app-muted focus:border-app-border-strong focus:ring-app-accent/10",
    size === "compact"
      ? "rounded-[16px] px-3 py-2 text-[13px] focus:ring-[3px]"
      : "rounded-[20px] px-3.5 py-2.5 text-[14px] focus:ring-[3px]",
  );
}

export function selectStyles({ size = "md" }: { size?: FieldSize } = {}) {
  return cn(
    textSelectionStyles.content,
    "w-full cursor-pointer border border-app-border bg-app-surface-soft text-app-text outline-none transition focus:border-app-border-strong focus:ring-app-accent/10",
    size === "compact"
      ? "h-9 rounded-[16px] px-3 text-[13px] focus:ring-[3px]"
      : "h-11 rounded-[20px] px-3.5 text-[14px] focus:ring-[3px]",
  );
}

export const ui = {
  page: "mx-auto flex w-full max-w-[1320px] flex-col gap-5 px-4 py-6 md:px-6 md:py-7",
  pageNarrow: "mx-auto flex w-full max-w-[1040px] flex-col gap-5 px-4 py-6 md:px-6 md:py-7",
  stack: "flex flex-col gap-4",
  muted: "text-[13px] leading-5 text-app-muted",
  mutedStrong: "text-[13px] leading-5 text-app-muted-strong",
  error: "text-[13px] leading-5 text-red-600",
  eyebrow: "text-[11px] font-semibold uppercase tracking-[0.14em] text-app-accent",
  panel:
    "rounded-[24px] border border-app-border bg-white/90 p-5 shadow-soft backdrop-blur-sm",
  panelLarge:
    "rounded-[24px] border border-app-border bg-white/92 p-6 shadow-card backdrop-blur-sm",
  sectionPanel: "rounded-[20px] border border-app-border bg-white/90 p-4 shadow-soft md:p-5",
  subpanel: "rounded-[20px] border border-app-border bg-app-surface-soft/80 p-4 shadow-soft",
  subcard: "rounded-[18px] border border-app-border bg-white/80 p-3.5 shadow-soft",
  popover:
    "rounded-2xl border border-app-border bg-white/98 p-1.5 shadow-card backdrop-blur-md",
  menu: "rounded-2xl border border-app-border bg-white/98 p-1.5 shadow-card backdrop-blur-md",
  dialog: "rounded-2xl border border-app-border shadow-card",
  toolbar: "flex flex-wrap items-start justify-between gap-2.5",
  actions: "flex flex-wrap items-center gap-1.5",
  label: "flex flex-col gap-1.5 text-[13px] font-medium text-app-muted-strong",
  input: inputStyles(),
  textarea: textareaStyles(),
  select: selectStyles(),
  chip:
    "inline-flex items-center rounded-full border border-app-border bg-white/86 px-2.5 py-0.5 text-[11px] font-medium text-app-muted-strong",
  chipSoft:
    "inline-flex items-center rounded-full border border-app-border bg-app-surface-soft px-2.5 py-0.5 text-[11px] font-medium text-app-muted-strong",
  codeChip:
    "inline-flex items-center rounded-full bg-app-surface-strong px-3 py-1 text-[13px] text-app-text",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  block = false,
  shape = "rounded",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  shape?: ButtonShape;
} = {}) {
  const sizeClass =
    shape === "icon"
      ? size === "xs"
        ? "size-7 p-0 text-[12px]"
        : size === "sm"
          ? "size-8 p-0 text-[13px]"
          : "size-10 p-0 text-[14px]"
      : size === "xs"
        ? "min-h-7 px-2.5 text-[12px]"
        : size === "sm"
          ? "min-h-8 px-3 text-[13px]"
          : "min-h-10 px-3.5 text-[14px]";
  const radiusClass = shape === "pill" ? "rounded-full" : "rounded-xl";
  const variantClass =
    variant === "primary"
      ? "border-transparent bg-app-primary text-app-primary-contrast hover:bg-[#25211c]"
      : variant === "secondary"
        ? "border-app-border bg-white/90 text-app-text hover:border-app-border-strong hover:bg-white"
        : variant === "danger"
          ? "border-transparent bg-red-600 text-white hover:bg-red-700"
          : variant === "dangerGhost"
            ? "border-transparent bg-transparent text-red-600 hover:bg-red-50"
          : "border-transparent bg-transparent text-app-muted-strong hover:bg-black/5";

  return cn(
    "inline-flex cursor-pointer items-center justify-center border font-medium transition focus:outline-none focus:ring-4 focus:ring-app-accent/10 disabled:cursor-not-allowed disabled:opacity-60",
    radiusClass,
    sizeClass,
    variantClass,
    block && "w-full",
  );
}

export function navItemStyles({ selected = false }: { selected?: boolean } = {}) {
  return selected
    ? "bg-white text-app-text shadow-soft"
    : "text-app-muted-strong hover:bg-white/78 hover:text-app-text";
}

export function createConversationNavButtonStyles({
  active = false,
}: {
  active?: boolean;
} = {}) {
  return cn(
    "group flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl border text-[13px] font-medium transition-all",
    active
      ? "border-app-border-strong bg-white text-app-text shadow-sm hover:border-app-border-strong hover:bg-white hover:text-app-text"
      : "border-app-primary bg-app-primary text-app-primary-contrast shadow-sm hover:border-app-primary hover:bg-app-primary hover:text-app-primary-contrast",
  );
}

export function menuItemStyles({
  selected = false,
  tone = "default",
}: {
  selected?: boolean;
  tone?: MenuTone;
} = {}) {
  if (tone === "danger") {
    return "text-red-600 hover:bg-red-50";
  }

  return selected
    ? "bg-app-surface-soft font-medium text-app-text"
    : "text-app-muted-strong hover:bg-app-surface-soft/82 hover:text-app-text";
}

export function breadcrumbSwitcherTriggerStyles({
  open = false,
}: {
  open?: boolean;
} = {}) {
  return cn(
    buttonStyles({ variant: "ghost", size: "xs" }),
    "min-h-0 max-w-full gap-1 px-1.5 py-0.5 text-[12px] text-app-muted transition-[background-color,color,transform] duration-200 [transition-timing-function:var(--ease-out-quart)] hover:bg-app-surface-soft/74 hover:text-app-text",
    open && "bg-app-surface-soft/82 text-app-text",
  );
}

export function chipButtonStyles({
  active = false,
  size = "default",
}: {
  active?: boolean;
  size?: ConversationControlSize;
} = {}) {
  return cn(
    "inline-flex cursor-pointer items-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-50",
    size === "compact" ? "gap-1 px-2 py-0.5 text-[11px]" : "gap-1.5 px-2.5 py-1 text-[12px]",
    active
      ? "border-app-border-strong bg-app-surface-strong/65 text-app-text"
      : "border-transparent bg-transparent text-app-muted-strong hover:border-app-border/80 hover:bg-white/70 hover:text-app-text",
  );
}

export function tabButtonStyles({
  active,
  size = "default",
}: {
  active: boolean;
  size?: ConversationControlSize;
}) {
  return cn(
    "inline-flex cursor-pointer items-center border-b transition disabled:cursor-not-allowed disabled:opacity-45",
    size === "compact" ? "gap-1 px-0.5 pb-1 text-[11px]" : "gap-1.5 px-1 pb-1.5 text-[12px]",
    active
      ? "border-app-text text-app-text"
      : "border-transparent text-app-muted-strong hover:text-app-text",
  );
}

export function workspaceTileStyles({
  variant = "default",
}: {
  variant?: WorkspaceTileVariant;
} = {}) {
  return cn(
    ui.panel,
    "grid min-h-[200px] rounded-[20px] p-5 transition hover:-translate-y-px",
    variant === "create"
      ? "place-content-center justify-items-center gap-5 border-dashed text-center"
      : "grid-rows-[auto_1fr_auto] gap-4",
  );
}
