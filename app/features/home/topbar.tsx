"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Bell, Search } from "lucide-react";

import AppSidebarMenu from "@/app/components/app-sidebar-menu";
import ThemeToggleButton from "@/app/components/theme-toggle-button";
import { DEFAULT_ITEMS, isActive } from "@/app/components/app-sidebar";
import { initialOf } from "@/lib/current-user";
import { useCurrentUser } from "@/lib/use-current-user";
import { cn } from "@/lib/utils";

function useSectionLabel() {
  const pathname = usePathname();
  const item = DEFAULT_ITEMS.find((entry) => isActive(pathname, entry.href));
  return item?.label ?? "Home";
}

function SearchField() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();
      inputRef.current?.focus();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="relative w-40 sm:w-56 lg:w-64">
      <Search
        aria-hidden="true"
        strokeWidth={1.75}
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3"
      />
      <input
        ref={inputRef}
        type="search"
        name="search"
        aria-label="Search titles"
        placeholder="Search..."
        autoComplete="off"
        className={cn(
          "h-10 w-full rounded-lg border border-line bg-surface-2/60 pr-9 pl-9",
          "text-[13px] text-foreground transition-colors duration-150 motion-reduce:transition-none",
          "placeholder:text-ink-3",
          "hover:border-line-2",
          "focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none",
          "[&::-webkit-search-cancel-button]:hidden",
        )}
      />
      <kbd
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-1/2 right-2 hidden h-[18px] -translate-y-1/2",
          "items-center justify-center rounded border border-line-2/70 px-1.5",
          "font-mono text-[10px] leading-none text-ink-3 sm:flex",
        )}
      >
        /
      </kbd>
    </div>
  );
}

export default function HomeTopBar() {
  const sectionLabel = useSectionLabel();
  const { user, loading } = useCurrentUser();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-line bg-background/85 px-4 backdrop-blur-xl sm:gap-3 sm:px-8">
      <AppSidebarMenu className="-ml-2 lg:hidden" />

      <p
        aria-hidden="true"
        className="hidden text-[10px] font-mono tracking-[0.2em] text-ink-3 uppercase sm:block"
      >
        {sectionLabel}
      </p>

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

        <button
          type="button"
          aria-label={user ? `Account — ${user.username}` : "Account"}
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 sm:size-10",
            "text-[13px] font-semibold text-foreground",
            "transition-colors duration-150 motion-reduce:transition-none",
            "hover:bg-surface-3",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
          )}
        >
          {user ? (
            initialOf(user.username)
          ) : loading ? (
            <span
              aria-hidden="true"
              className="size-3.5 animate-pulse rounded bg-surface-3"
            />
          ) : (
            "•"
          )}
        </button>
      </div>
    </header>
  );
}
