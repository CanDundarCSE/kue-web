import { ButtonLink } from "@/app/components/button";
import LibraryMock from "@/app/features/landing/library-mock";

export default function HeroSection() {
  return (
    <header
      id="top"
      className="mx-auto grid w-[min(1140px,92vw)] items-center gap-12 py-16 md:py-20 lg:grid-cols-[0.88fr_1.12fr] lg:gap-12 lg:py-24"
    >
      <div data-reveal>
        <h1 className="font-serif text-[clamp(40px,5vw,64px)] leading-[1.06] tracking-[-0.015em]">
          Your whole media life, in one index
          <span className="text-accent">.</span>
        </h1>
        <p className="mt-5 max-w-[50ch] text-[16.5px] text-ink-2">
          Kue tracks films, series, games, anime and manga in a single library —
          with format-aware progress, statuses, ratings and stats that finally
          add up to one honest number.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="#features" size="lg">
            See how it works
          </ButtonLink>
        </div>
      </div>

      <div data-reveal className="min-w-0">
        <LibraryMock />
      </div>
    </header>
  );
}
