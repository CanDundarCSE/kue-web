"use client";

import { Database, LayoutDashboard, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/media", label: "Media", icon: Database },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-line bg-background/60">
      <nav
        aria-label="Admin sections"
        className="mx-auto flex w-full max-w-[1160px] gap-1 overflow-x-auto px-5 sm:px-8"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(pathname, tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex h-11 shrink-0 items-center gap-2 border-b-2 border-transparent px-3 text-[13px] text-ink-2 transition-colors duration-150 motion-reduce:transition-none hover:text-foreground",
                active && "border-accent text-foreground",
              )}
            >
              <Icon className="size-4" strokeWidth={1.75} />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
