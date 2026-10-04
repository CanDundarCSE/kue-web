"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

import AppSidebarMenu from "@/app/components/app-sidebar-menu";
import SearchField from "@/app/components/search-field";
import ThemeToggleButton from "@/app/components/theme-toggle-button";
import UserAccountMenu from "@/app/components/user-account-menu";
import { DEFAULT_ITEMS, isActive } from "@/app/components/app-sidebar";
import { useCurrentUser } from "@/lib/use-current-user";
import { cn } from "@/lib/utils";

function useSectionLabel() {
  const pathname = usePathname();
  const item = DEFAULT_ITEMS.find((entry) => isActive(pathname, entry.href));
  // Null off the known app sections (e.g. the public auth pages) so the
  // label only renders where it actually names the section.
  return item?.label ?? null;
}

export default function AppTopBar() {
  const sectionLabel = useSectionLabel();
  const { user, loading } = useCurrentUser();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-line bg-background/85 px-4 backdrop-blur-xl sm:gap-3 sm:px-8">
      <AppSidebarMenu className="-ml-2 lg:hidden" />

      {sectionLabel && (
        <p
          aria-hidden="true"
          className="hidden text-[10px] font-mono tracking-[0.2em] text-ink-3 uppercase sm:block"
        >
          {sectionLabel}
        </p>
      )}

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <SearchField />

        <ThemeToggleButton className="!size-9 !rounded-lg !bg-transparent !text-ink-2 hover:!bg-surface-2 hover:!text-foreground focus-visible:!ring-offset-background" />

        <button
          type="button"
          aria-label="Notifications"
          className={cn(
            "relative grid size-9 shrink-0 place-items-center rounded-lg text-ink-2 sm:size-10",
            "transition-colors duration-150 motion-reduce:transition-none",
            "hover:bg-surface-2 hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
          )}
        >
          <Bell className="size-[18px]" strokeWidth={1.75} />
          <span
            aria-hidden="true"
            className="absolute top-2 right-2 size-1.5 rounded-full bg-accent ring-2 ring-background"
          />
        </button>

        <UserAccountMenu user={user} loading={loading} />
      </div>
    </header>
  );
}
