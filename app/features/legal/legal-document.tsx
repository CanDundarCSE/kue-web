import Link from "next/link";

import LogoMark from "@/app/features/landing/logo-mark";
import type { LegalDocumentContent } from "@/app/features/legal/legal-content";

type LegalDocumentBodyProps = Pick<
  LegalDocumentContent,
  "title" | "lastUpdated" | "intro" | "sections"
> & {
  showTitle?: boolean;
};

// Renders the document itself. Shared by the public legal pages and the
// in-app dialog so the two never drift apart.
export function LegalDocumentBody({
  title,
  showTitle = true,
  lastUpdated,
  intro,
  sections,
}: LegalDocumentBodyProps) {
  return (
    <article>
      {showTitle && (
        <h1 className="font-serif text-[clamp(26px,3vw,32px)] leading-[1.08] tracking-[-0.01em] text-foreground">
          {title}
        </h1>
      )}

      <p className="mt-2 font-mono text-[11px] tracking-[0.08em] text-ink-3 uppercase">
        Last updated {lastUpdated}
      </p>

      <div className="mt-6 space-y-4 text-[14px] leading-relaxed text-ink-2">
        <p>{intro}</p>
      </div>

      <div className="mt-8 space-y-8">
        {sections.map((section) => (
          <section key={section.heading} aria-labelledby={slug(section.heading)}>
            <h2
              id={slug(section.heading)}
              className="text-[16px] font-semibold tracking-[-0.01em] text-foreground"
            >
              {section.heading}
            </h2>

            {section.paragraphs?.map((paragraph, index) => (
              <p key={index} className="mt-2.5 text-[14px] leading-relaxed text-ink-2">
                {paragraph}
              </p>
            ))}

            {section.bullets && section.bullets.length > 0 && (
              <ul className="mt-2.5 space-y-2">
                {section.bullets.map((bullet, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-[14px] leading-relaxed text-ink-2"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-[7px] size-1.5 shrink-0 bg-accent [clip-path:polygon(0_0,100%_0,50%_100%)]"
                    />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}

type LegalDocumentProps = LegalDocumentContent;

// Shared shell + typography for the public legal pages (/privacy-policy and
// /terms-of-service). Kept dependency-free (no @tailwindcss/typography) so the
// prose styling matches the rest of the marketing surface.
export default function LegalDocument({
  label,
  title,
  lastUpdated,
  intro,
  sections,
}: LegalDocumentProps) {
  return (
    <div className="flex min-h-full flex-col bg-background font-sans text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-[64px] w-[min(820px,92vw)] items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-[15px] font-semibold">
            <LogoMark />
            Kue
          </Link>

          <nav className="flex items-center gap-5 text-[12px] text-ink-2">
            <Link href="/privacy-policy" className="transition-colors hover:text-accent">
              Privacy
            </Link>
            <Link href="/terms-of-service" className="transition-colors hover:text-accent">
              Terms
            </Link>
            <Link
              href="/"
              className="rounded-md border border-line-2 px-3 py-1.5 transition-colors hover:border-line-2 hover:text-foreground"
            >
              Back to Kue
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[820px] flex-1 px-5 py-12 sm:px-8 sm:py-16">
        <p className="flex items-center gap-3 text-[10px] font-mono tracking-[0.18em] text-ink-3 uppercase">
          <span className="shrink-0">{label}</span>
          <span aria-hidden="true" className="h-px flex-1 bg-line" />
        </p>

        <div className="mt-6">
          <LegalDocumentBody
            title={title}
            lastUpdated={lastUpdated}
            intro={intro}
            sections={sections}
          />
        </div>
      </main>

      <footer className="border-t border-line py-8">
        <div className="mx-auto flex w-[min(820px,92vw)] flex-wrap items-center justify-between gap-3 text-[9px] font-mono tracking-[0.12em] text-ink-3 uppercase">
          <span>&copy; 2026 Kue</span>
          <span>Kue &mdash; one catalog for everything you watch, play &amp; read</span>
        </div>
      </footer>
    </div>
  );
}

// Stable, readable anchor ids for in-page section links.
function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
