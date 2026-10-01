"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";

export type ActivityHeatmapItem = {
  date: string;
  added?: number;
  completed?: number;
};

export type ActivityHeatmapMetric = "total" | "added" | "completed";

const MS_PER_DAY = 86_400_000;

const CELL_LEVEL: string[] = [
  "bg-zinc-100 dark:bg-[#1c1c1f]",
  "bg-zinc-200 dark:bg-[#33333a]",
  "bg-zinc-400 dark:bg-[#5c5c66]",
  "bg-zinc-600 dark:bg-[#a1a1ab]",
  "bg-[#1e40af] dark:bg-[#4c62d9]",
  "bg-[#4338ca] dark:bg-[#6b7bf5]",
];

const METRIC_CELL: Record<ActivityHeatmapMetric, string> = {
  total: "one cell per day",
  added: "one cell per item added",
  completed: "one cell per completion",
};

function toUtcDay(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function startOfUtcDay(value: number | Date) {
  const timestamp = value instanceof Date ? value.getTime() : value;
  return Math.floor(timestamp / MS_PER_DAY) * MS_PER_DAY;
}

function formatDay(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function buildLevels(values: number[], top: number) {
  const distinct = [...new Set(values)].sort((a, b) => a - b);
  const levels = new Map<number, number>();

  distinct.forEach((value, index) => {
    levels.set(value, 1 + Math.floor((index * top) / distinct.length));
  });

  return levels;
}

function levelOf(value: number, levels: Map<number, number>, top: number) {
  return levels.get(value) ?? top;
}

function describeDay(day: { added: number; completed: number }) {
  if (day.added === 0 && day.completed === 0) {
    return "no activity";
  }

  return [
    day.added > 0 ? `${day.added} added` : "",
    day.completed > 0 ? `${day.completed} completed` : "",
  ]
    .filter(Boolean)
    .join(", ");
}

export default function ActivityHeatmap({
  items,
  today,
  weeks = 26,
  metric = "total",
  ramp = CELL_LEVEL,
  label,
  className,
}: {
  items: ActivityHeatmapItem[];
  today: number | Date;
  weeks?: number;
  metric?: ActivityHeatmapMetric;
  ramp?: string[];
  label?: string;
  className?: string;
}) {
  const window = Math.min(53, Math.max(1, Math.trunc(weeks)));
  const lastDay = startOfUtcDay(today);
  const firstDay = lastDay - (window * 7 - 1) * MS_PER_DAY;
  const leadingBlanks = (new Date(firstDay).getUTCDay() + 6) % 7;

  const byDay = new Map<number, { added: number; completed: number }>();
  for (const item of items) {
    const day = toUtcDay(item.date);
    if (Number.isNaN(day)) {
      continue;
    }

    const current = byDay.get(day) ?? { added: 0, completed: 0 };
    byDay.set(day, {
      added: current.added + (item.added ?? 0),
      completed: current.completed + (item.completed ?? 0),
    });
  }

  const valueOf = (day: { added: number; completed: number }) =>
    metric === "added" ? day.added : metric === "completed" ? day.completed : day.added + day.completed;

  const active: number[] = [];
  let addedTotal = 0;
  let completedTotal = 0;
  for (let day = firstDay; day <= lastDay; day += MS_PER_DAY) {
    const total = byDay.get(day);
    if (!total) {
      continue;
    }

    addedTotal += total.added;
    completedTotal += total.completed;
    const value = valueOf(total);
    if (value > 0) {
      active.push(value);
    }
  }

  const top = ramp.length - 1;
  const levels = buildLevels(active, top);
  const activeDays = active.length;

  const cells: { key: number; title: string; level: number | null }[] = [];
  for (let day = firstDay - leadingBlanks * MS_PER_DAY; day <= lastDay; day += MS_PER_DAY) {
    if (day < firstDay) {
      cells.push({ key: day, title: "", level: null });
      continue;
    }

    const total = byDay.get(day) ?? { added: 0, completed: 0 };
    const value = valueOf(total);
    cells.push({
      key: day,
      title: `${formatDay(day)} — ${describeDay(total)}`,
      level: value === 0 ? 0 : levelOf(value, levels, top),
    });
  }

  return (
    <div className={["flex flex-col gap-3", className ?? ""].join(" ")}>
      <div className="flex items-center gap-3">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-zinc-500 uppercase">
          {label ?? `Last ${window} weeks — ${METRIC_CELL[metric]}`}
        </p>
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <TooltipProvider>
        <div className="overflow-x-auto">
          <div
            role="img"
            aria-label={`${activeDays} active days in the last ${window} weeks — ${addedTotal} added, ${completedTotal} completed`}
            className="grid grid-flow-col grid-rows-7 gap-[3px]"
          >
            {cells.map((cell) => {
              const cellClass = [
                "size-[11px] rounded-[3px]",
                cell.level === null ? "bg-transparent" : ramp[cell.level],
              ].join(" ");

              if (cell.level === null) {
                return <div key={cell.key} className={cellClass} />;
              }

              return (
                <Tooltip key={cell.key}>
                  <TooltipTrigger asChild>
                    <div className={cellClass} />
                  </TooltipTrigger>
                  <TooltipContent>{cell.title}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
