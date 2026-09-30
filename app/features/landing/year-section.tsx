import ActivityHeatmap from "@/app/components/activity-heatmap";
import Slab from "@/app/features/landing/slab";
import {
  ACTIVITY,
  ACTIVITY_SUMMARY,
  LANDING_RAMP,
  LANDING_TODAY,
  LIBRARY_SUMMARY,
} from "@/app/features/landing/sample-data";

const RECAP = [
  { tag: "Episodes watched", value: String(LIBRARY_SUMMARY.episodes), detail: "anime + series" },
  { tag: "Chapters read", value: String(LIBRARY_SUMMARY.chapters), detail: "manga" },
  {
    tag: "Longest streak",
    value: `${ACTIVITY_SUMMARY.longestStreak} days`,
    detail: "consecutive days logged",
  },
  { tag: "Mean score", value: LIBRARY_SUMMARY.meanScore.toFixed(1), detail: "across the library" },
];

export default function YearSection() {
  return (
    <section id="year" className="mx-auto w-[min(1140px,92vw)] py-20 md:py-24">
      <div data-reveal className="mb-10">
        <Slab>03 — Activity</Slab>
        <h2 className="mt-3.5 mb-3 font-serif text-[clamp(30px,3.6vw,44px)] leading-[1.12] tracking-[-0.01em]">
          Your half-year, counted<span className="text-accent">.</span>
        </h2>
        <p className="max-w-[58ch] text-[15px] text-ink-2">
          One activity feed across all five formats — the graph your group chat actually wants.
          Here&apos;s a slice of a real one.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[1.1fr_0.9fr]">
        <div data-reveal className="rounded-xl border border-line bg-surface-2 p-6">
          <ActivityHeatmap
            className="mt-1"
            items={ACTIVITY}
            today={LANDING_TODAY}
            weeks={26}
            ramp={LANDING_RAMP}
          />
          <p className="mt-4 text-[9px] font-mono tracking-[0.14em] text-ink-3 uppercase">
            {ACTIVITY_SUMMARY.activeDays} active days · {ACTIVITY_SUMMARY.longestStreak}-day longest
            streak · busiest {ACTIVITY_SUMMARY.busiestMonth}
          </p>
        </div>

        <div data-reveal className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-line">
          {RECAP.map((entry) => (
            <div key={entry.tag} className="bg-surface-2 px-5 py-6">
              <span className="text-[9px] font-mono tracking-[0.14em] text-accent uppercase">
                {entry.tag}
              </span>
              <b className="mt-2 block font-serif text-[24px] font-normal leading-none">{entry.value}</b>
              <span className="mt-1.5 block text-[8.5px] font-mono tracking-[0.14em] text-ink-3 uppercase">
                {entry.detail}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
