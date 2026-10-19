import Link from "next/link";

import LogoMark from "@/app/features/landing/logo-mark";

const LINKS = [
  { label: "Formats", href: "#formats" },
  { label: "Features", href: "#features" },
  { label: "Activity", href: "#year" },
  { label: "FAQ", href: "#faq" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Cookie Policy", href: "/cookies" },
  { label: "Terms of Service", href: "/terms-of-service" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-line pt-16 pb-9">
      <div className="mx-auto w-[min(1140px,92vw)]">
        <div className="flex flex-wrap items-start justify-between gap-7 border-b border-line pb-11">
          <div>
            <a
              href="#top"
              className="flex items-center gap-2.5 text-[16px] font-semibold"
            >
              <LogoMark />
              Kue
            </a>
            <p className="mt-3 text-[13px] whitespace-nowrap text-ink-2">
              One catalog for everything you watch, play &amp; read.
            </p>
          </div>

          <nav aria-label="Footer">
            <h3 className="mb-3.5 text-[9px] font-mono tracking-[0.18em] text-ink-3 uppercase">
              Product
            </h3>
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block w-fit py-1 text-[13.5px] text-ink-2 transition-colors hover:text-accent"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <nav aria-label="Legal">
            <h3 className="mb-3.5 text-[9px] font-mono tracking-[0.18em] text-ink-3 uppercase">
              Legal
            </h3>
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="block w-fit py-1 text-[13.5px] text-ink-2 transition-colors hover:text-accent"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pt-6">
          <p className="text-[8.5px] font-mono tracking-[0.12em] text-ink-3 uppercase">
            © 2026 Kue
          </p>
          <p className="text-[8.5px] font-mono tracking-[0.12em] text-ink-3 uppercase">
            This product uses the TMDB API but is not endorsed or certified by
            TMDB.
          </p>
          <p className="text-[8.5px] font-mono tracking-[0.12em] text-ink-3 uppercase">
            Metadata by AniList &amp; IGDB
          </p>
        </div>
      </div>
    </footer>
  );
}
