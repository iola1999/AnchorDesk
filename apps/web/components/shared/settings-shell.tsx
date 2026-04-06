import type { ReactNode } from "react";

import { cn } from "@/lib/ui";

export function SettingsShell({
  sidebar,
  children,
  mainClassName,
}: {
  sidebar: ReactNode;
  children: ReactNode;
  mainClassName?: string;
}) {
  return (
    <div className="min-h-[100dvh] bg-app-bg">
      <div className="grid min-h-[100dvh] w-full grid-cols-1 xl:grid-cols-[264px_minmax(0,1fr)]">
        <aside className="border-b border-[color:color-mix(in_srgb,var(--outline-variant)_18%,transparent)] bg-app-surface-low xl:border-b-0 xl:border-r xl:border-[color:color-mix(in_srgb,var(--outline-variant)_20%,transparent)]">
          {sidebar}
        </aside>

        <main
          className={cn(
            "min-w-0 px-3 py-3 md:px-4 md:py-4 xl:px-5 xl:py-5",
            mainClassName,
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export function SettingsShellSidebar({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col gap-3 px-3 py-3 md:px-4 md:py-4 xl:sticky xl:top-0 xl:h-[100dvh] xl:overflow-y-auto">
      {children}
    </div>
  );
}
