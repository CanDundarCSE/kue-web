"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";

export type LandingAccordionItem = {
  num?: string;
  title: string;
  sub?: string;
  body: string;
  demo?: ReactNode;
};

export default function LandingAccordion({
  items,
  initialOpen = 0,
}: {
  items: LandingAccordionItem[];
  initialOpen?: number | null;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(initialOpen);

  return (
    <div className="border-t border-line">
      {items.map((item, index) => {
        const open = openIndex === index;

        return (
          <div key={item.title} className="border-b border-line">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpenIndex(open ? null : index)}
              className={[
                "group grid w-full items-baseline gap-4 py-6 text-left",
                item.num ? "grid-cols-[44px_1fr_auto] md:grid-cols-[64px_1fr_auto]" : "grid-cols-[1fr_auto]",
                "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
              ].join(" ")}
            >
              {item.num && (
                <span
                  className={[
                    "text-[11px] font-mono tracking-[0.14em] transition-colors",
                    open ? "text-accent" : "text-ink-3",
                  ].join(" ")}
                >
                  {item.num}
                </span>
              )}

              <span>
                <span
                  className={[
                    "block font-serif text-[21px] leading-tight transition-colors md:text-[24px]",
                    open ? "text-accent" : "text-ink group-hover:text-accent",
                  ].join(" ")}
                >
                  {item.title}
                </span>
                {item.sub && <span className="mt-1 block text-[13px] text-ink-2">{item.sub}</span>}
              </span>

              <ChevronDown
                aria-hidden="true"
                className={[
                  "size-5 self-center text-ink-3",
                  "transition-transform duration-300 motion-reduce:transition-none",
                  open ? "rotate-180 text-accent" : "",
                ].join(" ")}
              />
            </button>

            <div
              className={[
                "grid transition-[grid-template-rows] duration-300 motion-reduce:transition-none",
                open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              ].join(" ")}
            >
              <div className="overflow-hidden">
                <div
                  className={[
                    "grid gap-8 pb-7 lg:grid-cols-2 lg:gap-10",
                    item.num ? "lg:pl-[88px]" : "",
                  ].join(" ")}
                >
                  <p className="max-w-[52ch] text-[14.5px] leading-relaxed text-ink-2">{item.body}</p>
                  {item.demo && (
                    <div className="rounded-xl border border-line bg-surface-2 px-5 py-4">{item.demo}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
