import Button from "@/app/components/button";
import MediaAvatarCard, { type MediaType } from "@/app/components/media-avatar-card";
import MediaLibraryRow from "@/app/components/media-library-row";
import type { MediaStatus } from "@/app/components/status-badge";
import ThemeToggleButton from "@/app/components/theme-toggle-button";

const SAMPLE_LIBRARY: {
  title: string;
  year: number;
  studio: string;
  type: MediaType;
  status: MediaStatus;
  progress: { current: number; total: number; unit: string };
  rating: number;
}[] = [
  { title: "Frieren: Beyond Journey's End", year: 2023, studio: "Madhouse", type: "anime", status: "watching", progress: { current: 16, total: 28, unit: "ep" }, rating: 9.6 },
  { title: "Elden Ring", year: 2022, studio: "FromSoftware", type: "game", status: "playing", progress: { current: 84, total: 150, unit: "h" }, rating: 8.4 },
  { title: "Berserk", year: 1989, studio: "Kentaro Miura", type: "manga", status: "reading", progress: { current: 246, total: 374, unit: "ch" }, rating: 9.8 },
  { title: "Severance", year: 2022, studio: "Dan Erickson", type: "series", status: "watching", progress: { current: 9, total: 19, unit: "ep" }, rating: 8.2 },
];

const SAMPLE_MEDIA: { title: string; year: number; type: MediaType }[] = [
  { title: "Frieren: Beyond Journey's End", year: 2023, type: "anime" },
  { title: "Elden Ring", year: 2022, type: "game" },
  { title: "Severance", year: 2022, type: "series" },
  { title: "Berserk", year: 1989, type: "manga" },
  { title: "Parasite", year: 2019, type: "movie" },
  { title: "Vagabond", year: 1989, type: "manga" },
];

const LEGEND: { type: MediaType; label: string; swatch: string }[] = [
  { type: "movie", label: "Movie", swatch: "bg-[#C4533C] dark:bg-[#D9705A]" },
  { type: "series", label: "Series", swatch: "bg-[#B98E2F] dark:bg-[#CFA544]" },
  { type: "game", label: "Game", swatch: "bg-[#4E9066] dark:bg-[#5FAE7C]" },
  { type: "anime", label: "Anime", swatch: "bg-[#A85777] dark:bg-[#C4708F]" },
  { type: "manga", label: "Manga", swatch: "bg-[#47748F] dark:bg-[#5E93B0]" },
];

export default function ThemePreviewPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="flex items-center justify-between gap-4 border-b border-zinc-200 bg-white px-4 py-3 sm:px-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <h1 className="text-sm font-semibold">Component preview</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Click it to flip the whole page
          </p>
        </div>
        <ThemeToggleButton />
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-8 p-4 sm:p-6">
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Media library rows</h2>
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            {SAMPLE_LIBRARY.map((item) => (
              <MediaLibraryRow
                key={item.title}
                className="odd:bg-zinc-50 dark:odd:bg-zinc-900/60"
                {...item}
              />
            ))}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Progress and rating drop out below <code>lg</code> and <code>sm</code>{""}
            respectively, and both collapse onto a second line under the title on
            narrow screens. Zebra striping comes from the parent&apos;s{" "}
            <code>odd:</code> variant, not the row.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Buttons</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col items-start gap-3 rounded-xl bg-white p-6">
              <p className="text-xs font-medium text-zinc-500">Light</p>
              <Button>Start your index — free</Button>
              <Button variant="secondary">See how it works</Button>
            </div>
            <div className="dark flex flex-col items-start gap-3 rounded-xl bg-zinc-950 p-6">
              <p className="text-xs font-medium text-zinc-400">Dark</p>
              <Button>Start your index — free</Button>
              <Button variant="secondary">See how it works</Button>
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-xl bg-white p-6 dark:bg-zinc-900">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Sizes and states
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="lg">Large</Button>
              <Button variant="secondary" size="lg">
                Secondary
              </Button>
              <Button disabled>Disabled</Button>
              <Button className="rounded-full">Rounded</Button>
            </div>
            <Button fullWidth>Full width</Button>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Media avatar cards</h2>
          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
            {SAMPLE_MEDIA.map((item) => (
              <MediaAvatarCard
                key={item.title}
                title={item.title}
                year={item.year}
                type={item.type}
              />
            ))}
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {LEGEND.map((item) => (
              <li key={item.type} className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <span className={["size-2.5 rounded-full", item.swatch].join(" ")} />
                {item.label}
              </li>
            ))}
          </ul>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            md is 42&times;54, sm is 34&times;44 with the year hidden. The{" "}
            <code>size</code> prop owns the dimensions — passing a width through{" "}
            <code>className</code> will not override them, because Tailwind emits
            arbitrary values after named ones.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Small size</h2>
          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
            {SAMPLE_MEDIA.slice(0, 5).map((item) => (
              <MediaAvatarCard
                key={item.title}
                title={item.title}
                year={item.year}
                type={item.type}
                size="sm"
              />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Fluid size</h2>
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:grid-cols-4 lg:grid-cols-6 dark:border-zinc-800 dark:bg-zinc-950">
            {SAMPLE_MEDIA.map((item) => (
              <MediaAvatarCard
                key={item.title}
                title={item.title}
                year={item.year}
                type={item.type}
                size="fluid"
              />
            ))}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            <code>size=&quot;fluid&quot;</code> drops the fixed width for{" "}
            <code>w-full</code> + <code>aspect-[42/54]</code>. Initials, year, and
            the accent border all scale off the card&apos;s own width, so they grow
            with the grid instead of the viewport.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">In context</h2>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="mr-auto text-sm text-zinc-600 dark:text-zinc-400">
              Wraps without shrinking (shrink-0)
            </span>
            <span className="text-xs text-zinc-400">a b c d e f g</span>
            <ThemeToggleButton />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">At other sizes</h2>
          <div className="flex flex-wrap items-center gap-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <ThemeToggleButton className="!size-8" />
            <ThemeToggleButton className="!size-12" />
            <ThemeToggleButton className="rounded-full" />
            <ThemeToggleButton className="border border-zinc-300 dark:border-zinc-700" />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            className is merged last, but the base size is size-10 — a plain
            size-8 would lose, so the demo uses the ! important modifier. The hit
            area stays 48px regardless.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col items-start gap-3 rounded-xl bg-white p-6 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold">Light</h2>
            <ThemeToggleButton />
          </div>
          <div className="dark flex flex-col items-start gap-3 rounded-xl bg-zinc-950 p-6 text-zinc-50">
            <h2 className="text-sm font-semibold">Dark (forced)</h2>
            <ThemeToggleButton />
          </div>
        </section>

        <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          The dark card is forced with a nested <code>dark</code> class, which only
          restyles that subtree. Clicking the button inside it still toggles the
          page-wide theme on &lt;html&gt;, so its label can read &quot;Switch to
          dark mode&quot; while the card looks dark.
        </p>
      </main>
    </div>
  );
}
