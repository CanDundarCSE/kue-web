import SectionLabel from "@/app/features/home/section-label";
import { cn } from "@/lib/utils";

type DayBar = {
  label: string;
  hours: number;
  height: number;
};

const DAY_BARS: DayBar[] = [
  { label: "M", hours: 2.4, height: 4 },
  { label: "T", hours: 1.2, height: 3 },
  { label: "W", hours: 1.6, height: 3 },
  { label: "T", hours: 2.1, height: 4 },
  { label: "F", hours: 3.4, height: 6 },
  { label: "S", hours: 1.1, height: 3 },
  { label: "S", hours: 0.8, height: 3 },
];

const STATS = [
  { value: "7", label: "In library" },
  { value: "2", label: "Finished" },
  { value: "169", label: "Hours total" },
];

export default function WeekCard({ now }: { now: number }) {
  const todayIndex = (new Date(now).getDay() + 6) % 7;

  return (
    <article className="rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
      <SectionLabel>This week — 12.6 h logged</SectionLabel>

      <div className="mt-8 flex items-end gap-2.5 sm:gap-3">
        {DAY_BARS.map((day, index) => {
          const isToday = index === todayIndex;

          return (
            <div key={`${day.label}-${index}`} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-4 w-full items-end justify-center">
                <span
                  aria-hidden="true"
                  className={cn(
                    "w-full max-w-[30px] rounded-full",
                    isToday ? "bg-accent" : "bg-line-2/70",
                  )}
                  style={{ height: `${day.height}px` }}
                />
              </div>
              <span
                className={cn(
                  "text-[9px] leading-none font-mono tracking-[0.08em] uppercase",
                  isToday ? "text-foreground" : "text-ink-3",
                )}
              >
                {day.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 border-t border-line pt-5">
        {STATS.map((stat) => (
          <div key={stat.label}>
            <p className="font-serif text-[30px] leading-none tracking-[-0.01em] text-foreground">
              {stat.value}
            </p>
            <p className="mt-2 text-[9px] font-mono tracking-[0.14em] text-ink-3 uppercase">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}
