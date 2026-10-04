"use client";

import { useEffect, useState } from "react";
import { ButtonLink } from "@/app/components/button";
import ThemeToggleButton from "@/app/components/theme-toggle-button";
import LogoMark from "@/app/features/landing/logo-mark";

const LINKS = [
  { id: "formats", label: "Formats" },
  { id: "features", label: "Features" },
  { id: "year", label: "Activity" },
  { id: "faq", label: "FAQ" },
];

export default function SiteNav() {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );

    for (const link of LINKS) {
      const section = document.getElementById(link.id);
      if (section) {
        observer.observe(section);
      }
    }

    return () => observer.disconnect();
  }, []);

  return (
    <nav className="sticky top-0 z-40 flex h-16 items-center gap-7 border-b border-line bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex w-[min(1140px,92vw)] items-center gap-7">
        <a href="#top" className="flex items-center gap-2.5 text-[16px] font-semibold tracking-[-0.01em]">
          <LogoMark />
          Kue
        </a>

        <div className="mx-auto hidden items-center gap-6 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              aria-current={activeId === link.id ? "true" : undefined}
              className={[
                "border-b-2 px-0.5 py-1.5 text-[10.5px] font-mono tracking-[0.16em] uppercase transition-colors",
                activeId === link.id
                  ? "border-accent text-ink"
                  : "border-transparent text-ink-2 hover:text-ink",
              ].join(" ")}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <ButtonLink href="/login" variant="secondary" size="sm" className="!px-4 text-[13px] w-24">
            Log in
          </ButtonLink>
          <ButtonLink href="/register" size="sm" className="!px-4 text-[13px] w-24">
            Register
          </ButtonLink>
          <ThemeToggleButton className="!size-9 !rounded-lg !bg-transparent !text-ink-2 hover:!bg-surface-2 hover:!text-ink" />
        </div>
      </div>
    </nav>
  );
}
