"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { ArrowLeftIcon } from "@/components/icons";
import { SettingsShellSidebar } from "@/components/shared/settings-shell";
import {
  buildSystemManagementNavItems,
  resolveSystemManagementReturnHref,
  type SystemManagementSectionId,
} from "@/lib/system-management";
import { buttonStyles, cn, navItemStyles } from "@/lib/ui";

export function SystemManagementSidebar({
  activeSection,
}: {
  activeSection: SystemManagementSectionId;
}) {
  const searchParams = useSearchParams();
  const returnHref = resolveSystemManagementReturnHref(searchParams.get("returnTo"));
  const navItems = buildSystemManagementNavItems(activeSection, {
    returnTo: searchParams.get("returnTo"),
  });

  return (
    <SettingsShellSidebar>
      <Link
        href={returnHref}
        className={cn(
          buttonStyles({ variant: "ghost", size: "sm" }),
          "self-start gap-1.5",
        )}
      >
        <ArrowLeftIcon />
        返回工作台
      </Link>

      <div className="grid gap-2">
        <nav className="grid gap-1 rounded-2xl bg-app-surface-lowest/60 p-1 shadow-soft backdrop-blur-sm" aria-label="系统管理导航">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "relative rounded-[12px] px-4 py-3 text-[13px] font-medium transition",
                navItemStyles({ selected: item.selected }),
              )}
              aria-current={item.selected ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </SettingsShellSidebar>
  );
}
