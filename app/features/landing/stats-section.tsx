import CountUp from "@/app/features/landing/count-up";

const STATS = [
  { label: "Titles in the catalog", value: 1.9, decimals: 1, suffix: "M+" },
  { label: "Media types — one catalog", value: 5, decimals: 0, suffix: "" },
  { label: "Metadata sources, merged", value: 3, decimals: 0, suffix: "" },
  { label: "Rating scale, every format", value: 1, decimals: 0, suffix: "" },
];

export default function StatsSection() {
  return (
    <section className="mx-auto w-[min(1140px,92vw)] py-10">
      <div
        data-reveal
        className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4"
      >
        {STATS.map((stat) => (
          <div key={stat.label} className="bg-surface px-7 py-7">
            <p className="text-[8.5px] font-mono tracking-[0.16em] text-ink-3 uppercase">
              {stat.label}
            </p>
            <p className="mt-3 font-serif text-[clamp(34px,4vw,52px)] leading-none tracking-[-0.01em]">
              <CountUp value={stat.value} decimals={stat.decimals} suffix={stat.suffix} />
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
