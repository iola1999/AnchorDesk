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
    <div className="min-h-screen">
      <div className="grid min-h-screen w-full grid-cols-1 xl:grid-cols-[252px_minmax(0,1fr)]">
        <aside className="border-b border-app-border/80 bg-white/45 xl:border-b-0 xl:border-r">
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
    <div className="flex h-full flex-col gap-3 px-3 py-3 md:px-4 md:py-4 xl:sticky xl:top-0 xl:h-screen xl:overflow-y-auto">
      {children}
    </div>
  );
}
