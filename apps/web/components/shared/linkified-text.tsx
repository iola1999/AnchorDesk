import { Fragment } from "react";

import { tokenizeTextWithLinks } from "@/lib/linkified-text";
import { cn, textSelectionStyles } from "@/lib/ui";

export function LinkifiedText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const lines = text.split("\n");

  return (
    <div className={cn(textSelectionStyles.content, "whitespace-pre-wrap", className)}>
      {lines.map((line, lineIndex) => {
        const segments = tokenizeTextWithLinks(line);

        return (
          <Fragment key={`${lineIndex}-${line}`}>
            {segments.map((segment, partIndex) => {
              if (segment.type === "text") {
                return (
                  <Fragment key={`${lineIndex}-${partIndex}`}>{segment.value}</Fragment>
                );
              }

              return (
                <Fragment key={`${lineIndex}-${partIndex}`}>
                  <a
                    href={segment.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-app-accent underline underline-offset-2 hover:text-app-text"
                  >
                    {segment.label}
                  </a>
                </Fragment>
              );
            })}
            {lineIndex < lines.length - 1 ? "\n" : null}
          </Fragment>
        );
      })}
    </div>
  );
}
