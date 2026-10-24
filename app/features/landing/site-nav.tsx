"use client";

import { useEffect, useState } from "react";
import { ButtonLink } from "@/app/components/button";
import ThemeToggleButton from "@/app/components/theme-toggle-button";
import LogoMark from "@/app/features/landing/logo-mark";
import { probeSession } from "@/lib/api/session";

const LINKS = [
  { id: "formats", label: "Formats" },
  { id: "features", label: "Features" },
  { id: "year", label: "Activity" },
  { id: "faq", label: "FAQ" },
];

type NavAuthState = "checking" | "authenticated" | "unauthenticated";

export default function SiteNav() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [authState, setAuthState] = useState<NavAuthState>("checking");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    // A validated check, not a cookie sniff: the refresh cookie is scoped to
    // /api/auth and the access cookie lapses after 15 minutes, so the browser
    // cannot tell us reliably without asking the server.
    probeSession({ signal: controller.signal }).then((result) => {
      if (!active) return;
      setAuthState(
        result.state === "authenticated" ? "authenticated" : "unauthenticated",
      );
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

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
          {authState === "checking" ? (
            // Placeholder buttons keep the nav footprint stable while the
            // session probe is in flight.
            <div aria-hidden="true" className="flex items-center gap-2">
              <span className="h-9 w-24 animate-pulse rounded-lg bg-surface-2" />
              <span className="h-9 w-24 animate-pulse rounded-lg bg-surface-2" />
            </div>
          ) : authState === "authenticated" ? (
            <ButtonLink
              href="/home"
              size="sm"
              className="!px-4 text-[13px] whitespace-nowrap"
            >
              Open app
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/login" variant="secondary" size="sm" className="!px-4 text-[13px] w-24">
                Log in
              </ButtonLink>
              <ButtonLink href="/register" size="sm" className="!px-4 text-[13px] w-24">
                Register
              </ButtonLink>
            </>
          )}
          <ThemeToggleButton className="!size-9 !rounded-lg !bg-transparent !text-ink-2 hover:!bg-surface-2 hover:!text-ink" />
        </div>
      </div>
    </nav>
  );
}
