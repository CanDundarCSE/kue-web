"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import AppSidebar, { type AppSidebarItem } from "@/app/components/app-sidebar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/app/components/ui/sheet";
import { cn } from "@/lib/utils";

export type { AppSidebarItem };

export default function AppSidebarMenu({
  items,
  onAddTitle,
  triggerLabel = "Open menu",
  className,
}: {
  items?: AppSidebarItem[];
  onAddTitle?: () => void;
  triggerLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={triggerLabel}
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl text-foreground",
            "transition-colors duration-150 motion-reduce:transition-none",
            "hover:bg-surface-2",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
            className,
          )}
        >
          <Menu className="size-5" strokeWidth={1.75} />
        </button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[17.5rem] sm:w-[18.5rem]">
        <AppSidebar items={items} onAddTitle={onAddTitle} inSheet />
      </SheetContent>
    </Sheet>
  );
}
