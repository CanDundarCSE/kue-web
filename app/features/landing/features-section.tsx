import LandingAccordion, {
  type LandingAccordionItem,
} from "@/app/features/landing/landing-accordion";
import Slab from "@/app/features/landing/slab";
import {
  FriendDemo,
  HoursDemo,
  MiniListDemo,
  SyncDemo,
} from "@/app/features/landing/feature-demos";
import VagabondDemo from "@/app/features/landing/vagabond-demo";

const FEATURES: LandingAccordionItem[] = [
  {
    num: "01",
    title: "Unified tracking",
    sub: "Everything you track, on one shelf",
    body: "Films, series, games, anime and manga all live in one library. Filter by format whenever you want, or leave the boundaries alone. A ninety minute film and a manga you read for 374 chapters end up in the same stats.",
    demo: <MiniListDemo />,
  },
  {
    num: "02",
    title: "Honest progress",
    sub: "Progress that actually adds up",
    body: "Track the episode you watched, the chapter you read, the film you finished. Statuses follow the format, so a game is playing and a series is watching. The steppers below are live, so push one all the way to the end.",
    demo: <VagabondDemo />,
  },
  {
    num: "03",
    title: "Social & discovery",
    sub: "Share lists and ratings, not hot takes",
    body: "Make lists of anything you like, follow people who watch what you watch, and see what they are into. No comment sections and no long reviews, just the titles and the ratings.",
    demo: <FriendDemo />,
  },
  {
    num: "04",
    title: "Analytics",
    sub: "The honest numbers",
    body: "See which genres you lean on, how much time you spend, how much you finish, and a heatmap of the last 26 weeks. Every format counts toward the same numbers.",
    demo: <HoursDemo />,
  },
  {
    num: "05",
    title: "Metadata sync",
    sub: "Never type a title twice",
    body: "Search for a title once and Kue fills in the cover, the runtime, the episode count and the summary from TMDB, AniList and IGDB. Your own progress and ratings are never touched.",
    demo: <SyncDemo />,
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="mx-auto w-[min(1140px,92vw)] py-20 md:py-24">
      <div data-reveal className="mb-10">
        <Slab>02 — What&apos;s inside</Slab>
        <h2 className="mt-3.5 font-serif text-[clamp(30px,3.6vw,44px)] leading-[1.12] tracking-[-0.01em]">
          Built like five apps<span className="text-accent">.</span> Kept as one<span className="text-accent">.</span>
        </h2>
      </div>

      <div data-reveal>
        <LandingAccordion items={FEATURES} />
      </div>
    </section>
  );
}
