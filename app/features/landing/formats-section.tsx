import CountUp from "@/app/features/landing/count-up";
import Slab from "@/app/features/landing/slab";
import { MEDIA_FORMATS } from "@/app/features/landing/sample-data";

export default function FormatsSection() {
  return (
    <section id="formats" className="mx-auto w-[min(1140px,92vw)] py-20 md:py-24">
      <div data-reveal className="mb-10">
        <Slab>01 — Coverage</Slab>
        <h2 className="mt-3.5 mb-3 font-serif text-[clamp(30px,3.6vw,44px)] leading-[1.12] tracking-[-0.01em]">
          Five formats<span className="text-accent">.</span> One shelf<span className="text-accent">.</span>
        </h2>
        <p className="max-w-[58ch] text-[15px] text-ink-2">
          Your anime list, film diary, game backlog and manga queue finally live in the same
          place — and weigh on the same scale.
        </p>
      </div>

      <div
        data-reveal
        className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-5"
      >
        {MEDIA_FORMATS.map((format) => (
          <div
            key={format.type}
            className="bg-surface p-6 transition-colors hover:bg-surface-2"
          >
            <p className="flex items-center gap-1.5 text-[9.5px] font-mono tracking-[0.14em] text-ink-2 uppercase">
              <span
                aria-hidden="true"
                className={[
                  "size-[7px] rounded-full",
                  format.type === "movie" && "bg-media-movie",
                  format.type === "series" && "bg-media-series",
                  format.type === "game" && "bg-media-game",
                  format.type === "anime" && "bg-media-anime",
                  format.type === "manga" && "bg-media-manga",
                ].join(" ")}
              />
              {format.label} · {format.source}
            </p>
            <p className="mt-3.5 font-serif text-[26px] tabular-nums">
              <CountUp value={format.value} decimals={format.decimals} suffix={format.suffix} />
            </p>
            <p className="mt-1 mb-2.5 text-[14px] font-semibold">{format.name}</p>
            <p className="text-[12.5px] leading-relaxed text-ink-2">{format.copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
