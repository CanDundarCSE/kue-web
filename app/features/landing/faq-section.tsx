import LandingAccordion, {
  type LandingAccordionItem,
} from "@/app/features/landing/landing-accordion";
import Slab from "@/app/features/landing/slab";

const FAQ: LandingAccordionItem[] = [
  {
    title: "Are all five formats really in one place?",
    body: "Yes. One library, one search and one rating scale for all five formats. Nothing lives in a separate app, and your totals add up no matter what you are into.",
  },
  {
    title: "Where does the catalog data come from?",
    body: "Films and series come from TMDB, anime and manga from AniList, and games from IGDB. Search for a title and Kue pulls the cover, the runtime and the episode count straight from the provider. Any title can be refreshed later, and your own progress is never touched.",
  },
  {
    title: "Can I import my existing lists?",
    body: "Not yet. Everything gets added by searching the catalog, so there is nothing to type. Importing from MyAnimeList, Trakt or a CSV file is coming next.",
  },
  {
    title: "Why isn't there a review feature?",
    body: "Because Kue is for tracking, not for hot takes. You rate a title in one tap and share it through your lists. Long reviews belong on the places that are good at them.",
  },
  {
    title: "What does it cost?",
    body: "Nothing. Kue is free and it stays free. There are no ads, your library is not the product, and there is nothing to upgrade to.",
  },
];

export default function FaqSection() {
  return (
    <section id="faq" className="mx-auto w-[min(1140px,92vw)] py-20 md:py-24">
      <div data-reveal className="mb-10">
        <Slab>04 — Questions</Slab>
        <h2 className="mt-3.5 font-serif text-[clamp(30px,3.6vw,44px)] leading-[1.12] tracking-[-0.01em]">
          Fair questions<span className="text-accent">.</span>
        </h2>
      </div>

      <div data-reveal>
        <LandingAccordion items={FAQ} />
      </div>
    </section>
  );
}
