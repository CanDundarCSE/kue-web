"use client";

import { Bell, CheckCheck, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { type NotificationDto } from "@/lib/api/notifications";
import { useNotifications } from "@/lib/use-notifications";
import { cn } from "@/lib/utils";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff) || diff < 0) return "";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}

// Friend requests land on /friends (accept/decline lives there),
// import results on /import. Anything else just marks read.
function targetFor(item: NotificationDto): string | null {
  if (item.type.startsWith("friend_request")) return "/friends";
  if (item.type === "import_completed") return "/import";
  return null;
}

export default function NotificationsBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { items, unread, loading, markRead, markAllRead, remove, clearAll } = useNotifications();

  const openItem = (item: NotificationDto) => {
    if (!item.isRead) void markRead(item.id);
    const target = targetFor(item);
    if (target) {
      setOpen(false);
      router.push(target);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
          className={cn(
            "relative grid size-9 shrink-0 place-items-center rounded-lg text-ink-2 sm:size-10",
            "transition-colors duration-150 motion-reduce:transition-none",
            "hover:bg-surface-2 hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
          )}
        >
          <Bell className="size-[18px]" strokeWidth={1.75} />
          {unread > 0 && (
            <span className="absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 font-mono text-[9px] font-semibold text-background ring-2 ring-background">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" side="bottom" sideOffset={8} className="w-80 p-2">
        <div className="flex items-center justify-between gap-2 px-2.5 py-2">
          <span className="font-mono text-[10px] tracking-[0.16em] text-ink-3 uppercase">
            Notifications{unread > 0 ? ` · ${unread}` : ""}
          </span>
          {(unread > 0 || (items ?? []).length > 0) && (
            <div className="flex shrink-0 items-center gap-1">
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 font-mono text-[10px] tracking-[0.08em] text-ink-2 uppercase",
                    "transition-colors hover:bg-surface-3 hover:text-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                  )}
                >
                  <CheckCheck className="size-3.5" strokeWidth={2} aria-hidden="true" />
                  Read all
                </button>
              )}
              <button
                type="button"
                aria-label="Clear all notifications"
                title="Clear all"
                onClick={() => void clearAll()}
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-md text-ink-3",
                  "transition-colors hover:bg-surface-3 hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                )}
              >
                <Trash2 className="size-3.5" strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {loading || items === null ? (
          <div className="space-y-1.5 px-1 py-2" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <div key={index} className="h-14 animate-pulse rounded-lg bg-surface-3" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="px-2.5 py-6 text-center text-[13px] text-ink-3">
            You&rsquo;re all caught up.
          </p>
        ) : (
          <ul className="max-h-[320px] space-y-1 overflow-y-auto px-1 py-1">
            {items.map((item) => (
              <li key={item.id} className="group relative">
                <button
                  type="button"
                  onClick={() => openItem(item)}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 pr-8 text-left",
                    "transition-colors duration-150 motion-reduce:transition-none",
                    "hover:bg-surface-3",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                    !item.isRead && "bg-surface-2",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-1.5 size-1.5 shrink-0 rounded-full",
                      item.isRead ? "bg-line" : "bg-accent",
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-foreground">
                      {item.title}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-[12px] leading-snug text-ink-2">
                      {item.message}
                    </span>
                    <span className="mt-1 block font-mono text-[10px] tracking-[0.08em] text-ink-3 uppercase">
                      {timeAgo(item.createdAt)}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  aria-label="Delete notification"
                  title="Delete"
                  onClick={() => void remove(item.id)}
                  className={cn(
                    "absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-md text-ink-3",
                    "opacity-0 transition-all group-hover:opacity-100 focus-visible:opacity-100",
                    "hover:bg-surface-3 hover:text-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                  )}
                >
                  <X className="size-3.5" strokeWidth={2} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
