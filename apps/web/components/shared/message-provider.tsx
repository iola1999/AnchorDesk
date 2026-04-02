"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
} from "react";
import { Toaster, toast } from "sonner";

import { CheckIcon, CloseIcon } from "@/components/icons";

type MessageTone = "info" | "success" | "error";

type MessageOptions = {
  duration?: number;
};

type MessageInput = MessageOptions & {
  content: string;
  tone?: MessageTone;
};

type MessageApi = {
  show: (input: MessageInput) => string;
  success: (content: string, options?: MessageOptions) => string;
  error: (content: string, options?: MessageOptions) => string;
  info: (content: string, options?: MessageOptions) => string;
  dismiss: (id: string) => void;
};

const MESSAGE_DURATIONS: Record<MessageTone, number> = {
  info: 2800,
  success: 2200,
  error: 4200,
};

const MESSAGE_TOAST_CLASS =
  "inline-flex w-auto max-w-[min(320px,calc(100vw-24px))] min-h-0 items-center gap-2.5 rounded-2xl border bg-white/94 px-3.5 py-2.5 shadow-soft backdrop-blur-md";

const MessageContext = createContext<MessageApi | null>(null);

function showToast({ content, duration, tone = "info" }: MessageInput) {
  const options = {
    duration: duration ?? MESSAGE_DURATIONS[tone],
  };

  if (tone === "success") {
    return String(toast.success(content, options));
  }

  if (tone === "error") {
    return String(toast.error(content, options));
  }

  return String(toast.message(content, options));
}

export function MessageProvider({ children }: { children: ReactNode }) {
  const value = useMemo<MessageApi>(
    () => ({
      show: (input) => showToast(input),
      success: (content, options) => showToast({ content, tone: "success", ...options }),
      error: (content, options) => showToast({ content, tone: "error", ...options }),
      info: (content, options) => showToast({ content, tone: "info", ...options }),
      dismiss: (id) => {
        toast.dismiss(id);
      },
    }),
    [],
  );

  return (
    <MessageContext.Provider value={value}>
      {children}
      <Toaster
        closeButton={false}
        containerAriaLabel="全局消息"
        duration={MESSAGE_DURATIONS.info}
        expand={false}
        icons={{
          success: <CheckIcon className="size-[13px] text-emerald-700" strokeWidth={2.1} />,
          error: <CloseIcon className="size-[12px] text-red-600" strokeWidth={2.1} />,
          info: <span className="size-1.5 rounded-full bg-app-accent" />,
        }}
        mobileOffset={12}
        offset={16}
        position="top-center"
        theme="light"
        toastOptions={{
          unstyled: true,
          classNames: {
            toast: MESSAGE_TOAST_CLASS,
            title:
              "whitespace-nowrap text-[13px] font-medium leading-5 tracking-[-0.01em] text-app-text",
            content: "min-w-0 flex-none",
            icon: "shrink-0 text-app-muted",
            success: "border-emerald-200/70",
            error: "border-red-200/70",
            info: "border-app-border/85",
            default: "border-app-border/85",
            closeButton: "hidden",
          },
        }}
        visibleToasts={3}
      />
    </MessageContext.Provider>
  );
}

export function useMessage() {
  const context = useContext(MessageContext);

  if (!context) {
    throw new Error("useMessage must be used within MessageProvider");
  }

  return context;
}
