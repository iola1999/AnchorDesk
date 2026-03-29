"use client";

import { ShieldCheckIcon, UserIcon } from "@/components/icons";
import {
  type AccountSettingsNavGroup,
  type AccountSettingsSectionId,
} from "@/lib/account-settings";
import { cn, navItemStyles } from "@/lib/ui";

type AccountSettingsNavProps = {
  groups: AccountSettingsNavGroup[];
  activeSectionId: AccountSettingsSectionId;
  onSelect: (id: AccountSettingsSectionId) => void;
};

export function AccountSettingsNav({
  groups,
  activeSectionId,
  onSelect,
}: AccountSettingsNavProps) {
  return (
    <nav className="grid gap-4" aria-label="账号设置导航">
      {groups.map((group) => (
        <div key={group.label} className="grid gap-1.5">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-app-muted">
            {group.label}
          </p>
          <div className="grid gap-1">
            {group.items.map((item) => {
              const selected = item.id === activeSectionId;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-[16px] px-2.5 py-2 text-left text-sm transition",
                    navItemStyles({ selected }),
                  )}
                  aria-pressed={selected}
                >
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-[10px] border transition",
                      selected
                        ? "border-app-border-strong bg-app-surface-soft text-app-accent"
                        : "border-transparent bg-white/72 text-app-muted",
                    )}
                  >
                    <AccountSettingsNavIcon icon={item.icon} />
                  </span>
                  <span className="truncate text-[14px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function AccountSettingsNavIcon({
  icon,
}: {
  icon: AccountSettingsNavGroup["items"][number]["icon"];
}) {
  if (icon === "shield") {
    return <ShieldCheckIcon className="size-3.5" />;
  }

  return <UserIcon className="size-3.5" />;
}
