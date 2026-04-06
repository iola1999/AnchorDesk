import type { ReactNode } from "react";

export function EditorialPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl space-y-2">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-app-secondary">
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-3">
          <h1 className="font-headline text-[2.6rem] font-extrabold tracking-[-0.05em] text-app-text">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-[15px] leading-7 text-app-secondary">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
