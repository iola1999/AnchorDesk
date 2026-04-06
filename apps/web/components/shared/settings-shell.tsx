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
      <div
        data-slot="settings-shell-frame"
        className="grid min-h-[100dvh] w-full grid-cols-1 xl:grid-cols-[264px_minmax(0,1fr)]"
      >
        <aside className="bg-app-surface-low xl:sticky xl:top-0 xl:h-[100dvh] xl:overflow-y-auto">
          {sidebar}
        </aside>

        <main
          className={cn(
            "min-w-0 bg-app-bg px-6 py-8 md:px-8 md:py-10",
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
    <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-5 md:px-5 md:py-6">
      {children}
    </div>
  );
}
