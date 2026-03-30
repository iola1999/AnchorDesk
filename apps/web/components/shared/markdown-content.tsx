"use client";

import { createElement } from "react";
import { XMarkdown } from "@ant-design/x-markdown/es";

import { cn, textSelectionStyles } from "../../lib/ui";

export function MarkdownContent({
  content,
  className,
  streaming = false,
}: {
  content: string;
  className?: string;
  streaming?: boolean;
}) {
  return createElement(XMarkdown, {
    content,
    className: cn("x-markdown-light app-markdown", textSelectionStyles.content, className),
    openLinksInNewTab: true,
    streaming: streaming
      ? {
          hasNextChunk: true,
          tail: {
            content: "▍",
          },
        }
      : undefined,
  });
}
