import ThemeToggleButton from "@/app/components/theme-toggle-button";

export default function ThemePreviewPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="flex items-center justify-between gap-4 border-b border-zinc-200 bg-white px-4 py-3 sm:px-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <h1 className="text-sm font-semibold">Theme toggle preview</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Click it to flip the whole page
          </p>
        </div>
        <ThemeToggleButton />
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-8 p-4 sm:p-6">
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
            <ThemeToggleButton className="size-8" />
            <ThemeToggleButton className="size-12" />
            <ThemeToggleButton className="rounded-full" />
            <ThemeToggleButton className="border border-zinc-300 dark:border-zinc-700" />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            className is merged last, so size-8 / size-12 / rounded-full override the
            defaults. The hit area stays 48px thanks to the inset pseudo-element.
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
