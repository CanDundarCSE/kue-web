"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartColumn,
  Compass,
  House,
  Plus,
  TrendingUp,
  User,
  type LucideIcon,
} from "lucide-react";

import Button from "@/app/components/button";
import { SheetClose, SheetDescription, SheetTitle } from "@/app/components/ui/sheet";
import LogoMark from "@/app/features/landing/logo-mark";
import { cn } from "@/lib/utils";

export type AppSidebarItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  count?: number;
};

const DEFAULT_ITEMS: AppSidebarItem[] = [
  { href: "/", label: "Home", icon: House },
  { href: "/library", label: "Library", icon: ChartColumn, count: 8 },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/stats", label: "Stats", icon: TrendingUp },
  { href: "/profile", label: "Profile", icon: User },
];

function isActive(pathname: string, href: string) {
  if (href.startsWith("#")) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavRow({ item, active }: { item: AppSidebarItem; active: boolean }) {
  const Icon = item.icon;

  return (
    <SheetClose asChild>
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
    </SheetClose>
  );
}

export default function AppSidebar({
  items = DEFAULT_ITEMS,
  onAddTitle,
  className,
}: {
  items?: AppSidebarItem[];
  onAddTitle?: () => void;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="flex shrink-0 items-center gap-2.5 px-5 pt-5 pb-6">
        <LogoMark />
        <SheetTitle className="pr-10 text-[16px] tracking-[-0.01em]">
          Kue
        </SheetTitle>
        <SheetDescription>
          {items.map((item) => item.label).join(", ")}
        </SheetDescription>
      </div>

      <nav className="flex shrink-0 flex-col gap-0.5 px-3">
        {items.map((item) => (
          <NavRow
            key={item.label}
            item={item}
            active={isActive(pathname, item.href)}
          />
        ))}
      </nav>

      <div className="mt-auto shrink-0 px-5 pb-5">
        <Button fullWidth onClick={onAddTitle}>
          <Plus className="size-4" strokeWidth={2.25} />
          Add title
        </Button>
      </div>
    </div>
  );
}
