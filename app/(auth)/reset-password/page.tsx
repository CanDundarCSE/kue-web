import type { Metadata } from "next";
import ResetPasswordForm from "@/app/components/forms/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password — Kue",
  description: "Set a new password for your Kue account.",
};

const FEATURES = [
  { num: "01", text: "Over 2 million titles, always up to date." },
  { num: "02", text: "Log episodes, chapters or hours in a couple of taps" },
  {
    num: "03",
    text: "Check your stats when you're curious, ignore them when you're not",
  },
  {
    num: "04",
    text: "See your genres, time spent, completion rates, and a 26-week heatmap",
  },
  {
    num: "05",
    text: "Search once and Kue fills in covers, runtime, episodes, and summaries from TMDB, AniList, and IGDB",
  },
];

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const email = first(params.email)?.trim() ?? "";
  const token = first(params.token)?.trim() ?? "";
  const isValidLink = Boolean(email && token);

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid w-full max-w-[820px] overflow-hidden rounded-2xl border border-line bg-background shadow-[var(--shadow)] sm:grid-cols-[1fr_1fr]">
        <div className="flex flex-col justify-between gap-8 p-8 sm:p-10">
          <div>
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-2.5 bg-accent [clip-path:polygon(0_0,100%_0,50%_100%)]"
              />
              <span className="text-[15px] font-semibold tracking-tight">
                Kue
              </span>
            </div>

            <h2 className="mt-8 font-serif text-[clamp(24px,2.8vw,32px)] leading-[1.15] tracking-[-0.01em]">
              One shelf for everything you watch, play &amp; read.
            </h2>

            <p className="mt-4 text-[14px] leading-relaxed text-ink-2">
              Films, series, games, anime, manga &mdash; all in one list. Search
              a title, log your progress as you go, and your stats build
              themselves.
            </p>

            <ul className="mt-8 space-y-4">
              {FEATURES.map((f) => (
                <li key={f.num} className="flex items-start gap-3">
                  <span className="mt-[3px] text-[11px] font-mono tracking-[0.08em] text-accent shrink-0">
                    {f.num}
                  </span>
                  <span className="text-[13px] leading-relaxed text-ink-2">{f.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-line sm:border-t-0 sm:border-l bg-surface-2/40 p-8 sm:p-10">
          {isValidLink ? (
            <ResetPasswordForm email={email} token={token} />
          ) : (
            <div className="flex flex-col gap-6">
              <div>
                <p className="flex items-center gap-3 text-[9.5px] leading-none font-mono tracking-[0.18em] text-ink-3 uppercase">
                  <span>Account &ndash; Reset Password</span>
                  <span aria-hidden="true" className="h-px flex-1 bg-line" />
                </p>
              </div>

              <div>
                <h1 className="font-serif text-[clamp(28px,3.5vw,40px)] leading-[1.1] tracking-[-0.01em]">
                  This link is broken<span className="text-accent">.</span>
                </h1>
                <p className="mt-3 max-w-[42ch] text-[14px] leading-relaxed text-ink-2">
                  The reset link is missing its token or email. Request a new one
                  and try again.
                </p>
              </div>

              <div className="rounded-lg border border-line bg-background px-4 py-3 text-[13px] text-ink-2">
                <a
                  href="/forgot-password"
                  className="text-accent font-medium underline decoration-line-2 underline-offset-2 transition-colors hover:decoration-accent"
                >
                  Request a new reset link
                </a>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
            <span className="text-[9px] font-mono tracking-[0.14em] text-ink-3 uppercase">
              &copy; 2026 Kue
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
