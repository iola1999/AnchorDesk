import type { ReactNode } from "react";

import { cn } from "@/lib/ui";

export function SettingsShell({
  sidebar,
  top = null,
  children,
  mainClassName,
}: {
  sidebar: ReactNode;
  top?: ReactNode;
  children: ReactNode;
  mainClassName?: string;
}) {
  return (
    <div className="min-h-[100dvh] bg-app-bg">
      <div
        data-slot="settings-shell-frame"
        className="grid min-h-[100dvh] w-full grid-cols-1 xl:grid-cols-[264px_minmax(0,1fr)]"
      >
        <aside className="bg-app-surface-low xl:sticky xl:top-0 xl:h-[100dvh] xl:overflow-y-auto">
          {sidebar}
        </aside>

        <section className="min-w-0">
          <header
            data-slot="settings-shell-top"
            className="sticky top-0 z-20 border-b border-[color:color-mix(in_srgb,var(--outline-variant)_12%,transparent)] bg-white/72 px-6 py-3 backdrop-blur-xl md:px-8"
          >
            {top ? <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between gap-3">{top}</div> : null}
          </header>

          <main
            className={cn(
              "min-w-0 bg-app-bg px-6 py-8 md:px-8 md:py-10",
              mainClassName,
            )}
          >
            {children}
          </main>
        </section>
      </div>
    </div>
  );
}

export function SettingsShellSidebar({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-5 md:px-5 md:py-6">
      {children}
    </div>
  );
}
