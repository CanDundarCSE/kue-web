"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartColumn,
  ChevronLeft,
  Compass,
  House,
  Menu,
  TrendingUp,
  User,
  type LucideIcon,
} from "lucide-react";

import { SheetClose, SheetDescription, SheetTitle } from "@/app/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import LogoMark from "@/app/features/landing/logo-mark";
import { cn } from "@/lib/utils";

export type AppSidebarItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  count?: number;
};

export const DEFAULT_ITEMS: AppSidebarItem[] = [
  { href: "/home", label: "Home", icon: House },
  { href: "/library", label: "Library", icon: ChartColumn },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/stats", label: "Stats", icon: TrendingUp },
  { href: "/profile", label: "Profile", icon: User },
];

export function isActive(pathname: string, href: string) {
  if (href.startsWith("#")) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavRow({
  item,
  active,
  inSheet,
}: {
  item: AppSidebarItem;
  active: boolean;
  inSheet: boolean;
}) {
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      data-active={active || undefined}
      aria-current={active ? "page" : undefined}
      className={[
        "flex h-11 items-center gap-3 rounded-lg px-3 text-[15px] text-ink-2",
        "transition-colors duration-150 motion-reduce:transition-none",
        "hover:bg-surface-3 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
        "data-[active]:bg-surface-3 data-[active]:text-foreground",
      ].join(" ")}
    >
      <Icon className="size-[18px] shrink-0" strokeWidth={1.75} />
      <span className="truncate">{item.label}</span>
      {item.count !== undefined ? (
        <span className="ml-auto font-mono text-[11px] tabular-nums text-ink-3">
          {item.count}
        </span>
      ) : null}
    </Link>
  );

  return inSheet ? <SheetClose asChild>{link}</SheetClose> : link;
}

// Icon-only row used by the collapsed desktop rail. Labels aren't visible in the
// layout, so each one is wrapped in a Radix tooltip on hover/focus and carries an
// accessible `aria-label`. Any badge count shows as a small dot.
function CollapsedNavRow({ item, active }: { item: AppSidebarItem; active: boolean }) {
  const Icon = item.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={item.href}
          aria-label={item.label}
          data-active={active || undefined}
          aria-current={active ? "page" : undefined}
          className={[
            "relative grid size-9 place-items-center rounded-lg text-ink-2",
            "transition-colors duration-150 motion-reduce:transition-none",
            "hover:bg-surface-3 hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
            "data-[active]:bg-surface-3 data-[active]:text-foreground",
          ].join(" ")}
        >
          <Icon className="size-[18px]" strokeWidth={1.75} />
          {item.count !== undefined ? (
            <span
              aria-hidden
              className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-accent ring-2 ring-background"
            />
          ) : null}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={10}>
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}

export default function AppSidebar({
  items = DEFAULT_ITEMS,
  className,
  inSheet = false,
  collapsed = false,
  onToggleCollapse,
}: {
  items?: AppSidebarItem[];
  onAddTitle?: () => void;
  className?: string;
  inSheet?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();

  // The collapse control only makes sense in the persistent desktop rail. The
  // mobile sheet closes itself via SheetClose, so it never shows the toggle.
  const showToggle = !inSheet && typeof onToggleCollapse === "function";
  const ToggleIcon = collapsed ? Menu : ChevronLeft;

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div
        className={cn(
          "flex shrink-0 items-center gap-2.5",
          collapsed ? "justify-center px-2 pt-4" : "px-5 pt-5 pb-6",
        )}
      >
        {!collapsed && (
          <>
            <LogoMark />
            {inSheet ? (
              // pr-10 keeps the title clear of the sheet's own close (X) button.
              <SheetTitle className="pr-10 text-[16px] tracking-[-0.01em]">Kue</SheetTitle>
            ) : (
              <span className="text-[16px] font-semibold tracking-[-0.01em]">Kue</span>
            )}
          </>
        )}

        {inSheet ? (
          <SheetDescription>
            {items.map((item) => item.label).join(", ")}
          </SheetDescription>
        ) : !collapsed ? (
          <p className="sr-only">{items.map((item) => item.label).join(", ")}</p>
        ) : null}

        {/* When open the toggle sits at the right edge of the header; when
            collapsed the whole row is just this centered button. */}
        {showToggle && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Open sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className={[
              "grid size-9 shrink-0 place-items-center rounded-lg text-ink-2",
              "transition-colors duration-150 motion-reduce:transition-none",
              "hover:bg-surface-2 hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
              !collapsed && "ml-auto",
            ].filter(Boolean).join(" ")}
          >
            <ToggleIcon className="size-5" strokeWidth={1.75} />
          </button>
        )}
      </div>

      {collapsed ? (
        <TooltipProvider delayDuration={150}>
          <nav aria-label="Primary" className="flex flex-col items-center gap-1 px-2 pt-3">
            {items.map((item) => (
              <CollapsedNavRow
                key={item.label}
                item={item}
                active={isActive(pathname, item.href)}
              />
            ))}
          </nav>
        </TooltipProvider>
      ) : (
        <nav aria-label="Primary" className="flex shrink-0 flex-col gap-0.5 px-3">
          {items.map((item) => (
            <NavRow
              key={item.label}
              item={item}
              active={isActive(pathname, item.href)}
              inSheet={inSheet}
            />
          ))}
        </nav>
      )}
    </div>
  );
}
