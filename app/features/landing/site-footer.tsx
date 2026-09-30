const LINKS = [
  { label: "Formats", href: "#formats" },
  { label: "Features", href: "#features" },
  { label: "Activity", href: "#year" },
  { label: "FAQ", href: "#faq" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-line pt-16 pb-9">
      <div className="mx-auto w-[min(1140px,92vw)]">
        <div className="flex flex-wrap items-start justify-between gap-7 border-b border-line pb-11">
          <div>
            <a href="#top" className="flex items-center gap-2.5 text-[16px] font-semibold">
              <span aria-hidden="true" className="size-2.5 rounded-[3px] bg-accent" />
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
        </div>

        <div className="pt-6 text-[8.5px] font-mono tracking-[0.12em] text-ink-3 uppercase">
          © 2025 Kue
        </div>
      </div>
    </footer>
  );
}
